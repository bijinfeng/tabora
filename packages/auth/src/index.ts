export {
  createStrapiAuthClient,
  type StrapiAuthClient,
  type StrapiAuthClientConfig,
  type AuthStorage,
  type StrapiSession,
  type CurrentUser,
} from "./strapiAuthClient"

export {
  createBetterAuthClient,
  type AuthClient,
  type AuthSession,
  type AuthUser,
  type BetterAuthClientConfig,
} from "./betterAuthClient"

export { mapStrapiError, AUTH_ERROR_MESSAGES, type AuthError, type AuthErrorCode } from "./errors"
