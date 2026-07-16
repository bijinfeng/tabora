# Directus Tabora Extension Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the Tabora Directus endpoint extension into typed, service-backed route modules with stable session UUIDs, validated input, ownership-safe attachment access, and deployment-level registration protection.

**Architecture:** Keep `src/index.ts` as the composition root. Store stable session identity in the Tabora-owned `user_refresh_tokens` table as `user_id + session_id + token_hash`, while Directus remains the source of truth for authentication and raw refresh-token lifecycle. Use database transactions for login, refresh, logout, revoke, attachment refs, and deletion; keep production-only request throttling in Nginx instead of importing unpublished Directus API internals.

**Tech Stack:** TypeScript, Directus 12.1.1 extension SDK/services, Express route types, Zod 4, Vitest, Knex, PostgreSQL, Nginx.

**Repository constraint:** Do not create a git commit unless the user explicitly requests one. Preserve the existing staged/unstaged split.

---

### Task 1: Preserve the completed modular endpoint refactor

**Files:**

- Created: `backend/directus/extensions/directus-extension-tabora/src/auth.ts`
- Created: `backend/directus/extensions/directus-extension-tabora/src/attachments.ts`
- Created: `backend/directus/extensions/directus-extension-tabora/src/errors.ts`
- Created: `backend/directus/extensions/directus-extension-tabora/src/http.ts`
- Created: `backend/directus/extensions/directus-extension-tabora/src/sessions.ts`
- Created: `backend/directus/extensions/directus-extension-tabora/src/types.ts`
- Modified: `backend/directus/extensions/directus-extension-tabora/src/index.ts`
- Created: `backend/directus/tests/endpoints/tabora-test-kit.ts`

- [x] **Step 1: Import endpoint source in tests**

Endpoint tests import `src/index.ts`, not stale `dist` output.

- [x] **Step 2: Use Directus services and context schema**

Routes use `context.getSchema()`, `UsersService`, `AuthenticationService`, and `FilesService`. They do not call the same Directus instance over HTTP.

- [x] **Step 3: Add typed request validation and global error forwarding**

Zod failures become Directus `INVALID_PAYLOAD` errors and async failures flow through `next(error)`.

- [x] **Step 4: Add attachment ownership, transaction, and row-lock coverage**

Commit, bind, unbind, and delete validate file ownership and use transactions plus `FOR UPDATE`.

### Task 2: Define the stable session identity schema and RED tests

**Files:**

- Modify: `backend/directus/schema/manifest.json`
- Modify: `backend/directus/schema/snapshot.json`
- Modify: `backend/directus/scripts/provisionSchema.ts`
- Modify: `backend/directus/tests/schema/schema.test.ts`
- Modify: `backend/directus/tests/endpoints/tabora-test-kit.ts`
- Modify: `backend/directus/tests/endpoints/tabora-auth.test.ts`

- [ ] **Step 1: Add the Tabora-owned session identity fields**

Change the `user_refresh_tokens` manifest entry to:

```json
{
  "name": "user_refresh_tokens",
  "fields": [
    { "name": "user_id", "type": "uuid" },
    {
      "name": "session_id",
      "type": "uuid",
      "schema": { "is_unique": true, "is_nullable": false }
    },
    {
      "name": "token_hash",
      "type": "string",
      "schema": { "max_length": 64, "is_unique": true, "is_nullable": false }
    }
  ]
}
```

Extend the manifest field type and `ensureField()` payload so `schema` options are passed to Directus:

```ts
type ManifestField = {
  name: string
  type: string
  schema?: {
    is_unique?: boolean
    is_nullable?: boolean
    max_length?: number
  }
}

body: JSON.stringify({
  field,
  type,
  ...(fieldSchema ? { schema: fieldSchema } : {}),
})
```

- [ ] **Step 2: Add schema assertions**

Assert the three fields exist and that `session_id` and `token_hash` are unique:

```ts
const refreshTokens = manifest.collections.find(
  (collection) => collection.name === "user_refresh_tokens",
)

expect(refreshTokens?.fields).toEqual(
  expect.arrayContaining([
    expect.objectContaining({ name: "user_id", type: "uuid" }),
    expect.objectContaining({
      name: "session_id",
      schema: expect.objectContaining({ is_unique: true }),
    }),
    expect.objectContaining({
      name: "token_hash",
      schema: expect.objectContaining({ is_unique: true, max_length: 64 }),
    }),
  ]),
)
```

- [ ] **Step 3: Rewrite the in-memory auth state**

Directus session rows must not contain `data`. Login and refresh mocks return Directus' real `id` field:

```ts
return {
  accessToken: "access-token",
  refreshToken: "refresh-token",
  expires: 900,
  id: "user-1",
}
```

The test database stores identities separately:

```ts
user_refresh_tokens: [
  {
    id: 1,
    user_id: "user-1",
    session_id: STABLE_SESSION_ID,
    token_hash: sha256("refresh-token"),
  },
]
```

- [ ] **Step 4: Rewrite stable-session endpoint expectations**

Cover:

- login inserts one identity row and returns its UUID;
- refresh keeps the UUID while replacing only `token_hash`;
- logout deletes both Directus session and identity mapping;
- devices match current Directus session tokens to identity hashes;
- legacy sessions without a mapping are omitted, then receive a mapping after successful refresh;
- revoke accepts UUID, locks both tables, logs out the matched token, and deletes the mapping;
- no code selects or updates `directus_sessions.data`.

- [ ] **Step 5: Run tests and verify RED**

Run:

```bash
cd backend/directus
../../node_modules/.bin/vitest run --config vitest.config.ts \
  tests/schema/schema.test.ts \
  tests/endpoints/tabora-auth.test.ts
```

Expected: failures because production still reads `directus_sessions.data` and the schema does not yet expose identity fields.

### Task 3: Implement hash-backed session identity mapping

**Files:**

- Modify: `backend/directus/extensions/directus-extension-tabora/src/sessionIdentity.ts`
- Modify: `backend/directus/extensions/directus-extension-tabora/src/types.ts`
- Modify: `backend/directus/extensions/directus-extension-tabora/src/auth.ts`

- [ ] **Step 1: Define the identity row**

```ts
export type SessionIdentityRow = {
  id?: number
  user_id: string
  session_id: string
  token_hash: string
}
```

- [ ] **Step 2: Implement token hashing and constant-time comparison**

```ts
export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

export function sessionTokenMatchesHash(token: string, expectedHash: string): boolean {
  if (!/^[a-f0-9]{64}$/i.test(expectedHash)) return false

  const actual = Buffer.from(hashSessionToken(token), "hex")
  const expected = Buffer.from(expectedHash, "hex")
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}
```

- [ ] **Step 3: Implement identity CRUD helpers**

The module exposes:

```ts
lockSessionIdentityByToken(database, token)
createSessionIdentity(database, userId, token)
rotateSessionIdentity(database, identity, userId, nextToken)
deleteSessionIdentityByToken(database, userId, token)
```

Rules:

- lock by `token_hash` with `forUpdate().first()`;
- generate UUID v4 only when no prior mapping exists;
- verify a locked mapping belongs to the authenticated Directus result id;
- update only `token_hash` during refresh;
- reject duplicate/malformed rows with `InternalServerError`;
- never store the raw token.

- [ ] **Step 4: Make login transactional**

```ts
const { result, sessionId } = await context.database.transaction(async (transaction) => {
  const authenticationService = await createAuthenticationService(context, request, transaction)
  const result = await authenticationService.login("default", credentials, {
    session: false,
  })
  const sessionId = await createSessionIdentity(transaction, result.id, result.refreshToken)
  return { result, sessionId }
})
```

Pass `knex: transaction` as an ordinary enumerable service option. Remove `Object.defineProperty()` compatibility logic.

- [ ] **Step 5: Make refresh transactional**

Lock the old identity before Directus rotates the token. After refresh:

```ts
const sessionId = identity
  ? await rotateSessionIdentity(transaction, identity, result.id, result.refreshToken)
  : await createSessionIdentity(transaction, result.id, result.refreshToken)
```

- [ ] **Step 6: Make logout transactional**

Call `AuthenticationService.logout(refreshToken)` and delete the matching identity row in the same transaction.

- [ ] **Step 7: Run auth tests**

```bash
cd backend/directus
../../node_modules/.bin/vitest run --config vitest.config.ts tests/endpoints/tabora-auth.test.ts
```

Expected: login, refresh, logout, and identity persistence tests pass.

### Task 4: Implement device listing and transactional revoke

**Files:**

- Modify: `backend/directus/extensions/directus-extension-tabora/src/sessions.ts`
- Test: `backend/directus/tests/endpoints/tabora-auth.test.ts`

- [ ] **Step 1: Read only native Directus session columns**

```ts
const SESSION_COLUMNS = ["token", "created_at", "expires", "ip", "user_agent", "origin"] as const
```

- [ ] **Step 2: Match identities in application code**

Read `session_id` and `token_hash` from `user_refresh_tokens` for the current user. For each active, non-OAuth Directus session, find one identity with `sessionTokenMatchesHash(session.token, identity.token_hash)`.

Skip sessions without a valid identity. Return `current: true` only when `request.accountability.session === session.token`.

- [ ] **Step 3: Revoke by stable UUID**

Inside one transaction:

1. lock the current user's identity row by `session_id`;
2. lock the current user's non-OAuth Directus sessions;
3. find the raw session token using constant-time hash comparison;
4. construct `AuthenticationService` with `knex: transaction`;
5. call `logout(token)`;
6. delete the locked identity row.

Missing or foreign UUIDs throw the same `SESSION_NOT_FOUND` error.

- [ ] **Step 4: Run focused auth tests**

```bash
cd backend/directus
../../node_modules/.bin/vitest run --config vitest.config.ts tests/endpoints/tabora-auth.test.ts
```

Expected: all auth and session tests pass.

### Task 5: Match Directus auth semantics and protect registration

**Files:**

- Modify: `backend/directus/extensions/directus-extension-tabora/src/auth.ts`
- Modify: `backend/directus/tests/endpoints/tabora-auth.test.ts`
- Modify: `backend/directus/docker/nginx/default.conf`
- Create: `backend/directus/tests/bootstrap/nginx.test.ts`

- [ ] **Step 1: Add RED tests for `AUTH_DISABLE_DEFAULT`**

With `context.env.AUTH_DISABLE_DEFAULT = true`, `/auth/login` must forward a Directus `ROUTE_NOT_FOUND` error and must not call `AuthenticationService.login()`.

- [ ] **Step 2: Add RED test for `/users/me` compatibility**

When `UsersService.readOne()` throws Directus `FORBIDDEN`, `/auth/session` returns:

```json
{ "data": { "id": "user-1" } }
```

- [ ] **Step 3: Implement auth compatibility**

Use the public `context.env` and `@directus/errors` exports only. Do not import `@directus/api` internals.

- [ ] **Step 4: Add the registration limiter config test**

The test reads `docker/nginx/default.conf` and asserts:

```ts
expect(config).toContain("limit_req_zone $binary_remote_addr zone=tabora_registration:")
expect(config).toContain("location = /tabora/auth/register")
expect(config).toContain("limit_req zone=tabora_registration")
expect(config).toContain("limit_req_status 429")
```

- [ ] **Step 5: Add the exact-path Nginx limiter**

Define the shared zone outside `server`:

```nginx
limit_req_zone $binary_remote_addr zone=tabora_registration:10m rate=5r/m;
```

Add an exact location that proxies the original URI and returns 429 when exceeded:

```nginx
location = /tabora/auth/register {
  limit_req zone=tabora_registration burst=3 nodelay;
  limit_req_status 429;

  proxy_pass http://directus:8055;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
}
```

- [ ] **Step 6: Run auth and Nginx tests**

```bash
cd backend/directus
../../node_modules/.bin/vitest run --config vitest.config.ts \
  tests/endpoints/tabora-auth.test.ts \
  tests/bootstrap/nginx.test.ts
```

Expected: all tests pass.

### Task 6: Fail closed for unknown attachment policies

**Files:**

- Modify: `backend/directus/extensions/directus-extension-tabora/src/attachments.ts`
- Modify: `backend/directus/extensions/directus-extension-tabora/src/errors.ts`
- Modify: `backend/directus/tests/endpoints/tabora-attachments.test.ts`

- [ ] **Step 1: Add RED tests**

Prepare, commit, and bind with an `entity_type` missing from `attachment_policies` must fail and must not create refs.

- [ ] **Step 2: Add a stable policy error**

Define a Directus error such as:

```ts
export const AttachmentPolicyNotFoundError = createError(
  "ATTACHMENT_POLICY_NOT_FOUND",
  "Attachment policy not found.",
  400,
)
```

- [ ] **Step 3: Require policy**

Replace nullable policy handling with:

```ts
async function requirePolicy(...): Promise<AttachmentPolicy> {
  const policy = await readPolicy(...)
  if (!policy) throw new AttachmentPolicyNotFoundError()
  return policy
}
```

Use it in prepare, commit, and bind. Keep corrupt policy rows as `INTERNAL_SERVER_ERROR`.

- [ ] **Step 4: Run attachment tests**

```bash
cd backend/directus
../../node_modules/.bin/vitest run --config vitest.config.ts tests/endpoints/tabora-attachments.test.ts
```

Expected: all attachment tests pass.

### Task 7: Documentation and verification

**Files:**

- Modify: `backend/directus/README.md`
- Modify: `backend/directus/extensions/directus-extension-tabora/README.md`
- Modify: `docs/README.md`
- Modify: `docs/superpowers/specs/2026-07-15-directus-extension-refactor-design.md`
- Modify: `docs/superpowers/plans/2026-07-15-directus-extension-refactor.md`

- [ ] **Step 1: Document the final module and data boundaries**

Document:

- stable session UUIDs are stored in `user_refresh_tokens`;
- only token hashes are persisted by Tabora;
- JSON auth uses `{ session: false }`;
- registration rate limiting is enforced at the production Nginx boundary;
- unknown attachment policies fail closed;
- ordinary roles must not directly mutate private file/ref/policy collections;
- `/assets` authorization still depends on Directus permissions;
- object-storage deletion is not cross-system atomic.

- [ ] **Step 2: Run focused Directus tests**

```bash
cd backend/directus
../../node_modules/.bin/vitest run --config vitest.config.ts \
  tests/endpoints/tabora-auth.test.ts \
  tests/endpoints/tabora-attachments.test.ts \
  tests/schema/schema.test.ts \
  tests/bootstrap/nginx.test.ts
```

- [ ] **Step 3: Run all Directus tests**

```bash
cd backend/directus
../../node_modules/.bin/vitest run --config vitest.config.ts
```

- [ ] **Step 4: Verify the extension**

```bash
cd backend/directus/extensions/directus-extension-tabora
./node_modules/.bin/tsc --noEmit
./node_modules/.bin/directus-extension build
./node_modules/.bin/directus-extension validate
```

- [ ] **Step 5: Run repository-level verification**

```bash
cd /home/kebai/桌面/tabora
pnpm test
pnpm check
pnpm build
git diff --check
```

If repository-wide commands fail for unrelated baseline issues, record the exact failures and do not claim they are green.

- [ ] **Step 6: Review the final diff**

Perform a specification review first, then a code-quality review. Resolve all critical and important findings before reporting completion.
