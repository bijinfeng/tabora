/* eslint-disable no-console */
/// <reference types="node" />
/**
 * Supabase Sync Gateway 集成测试脚本
 *
 * 需要的环境变量：
 * - ANON_KEY: Supabase anon key (从 Supabase Dashboard Settings → API 获取)
 * - TEST_EMAIL: 测试账号邮箱
 * - TEST_PASSWORD: 测试账号密码
 *
 * 用法：
 *   ANON_KEY=xxx TEST_EMAIL=test@example.com TEST_PASSWORD=xxx pnpm tsx scripts/test-sync-gateway.ts
 */

import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = "https://ajetfjtfterbkczrbjlq.supabase.co"
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/sync-gateway`

const ANON_KEY = process.env.ANON_KEY
const TEST_EMAIL = process.env.TEST_EMAIL
const TEST_PASSWORD = process.env.TEST_PASSWORD

if (!ANON_KEY || !TEST_EMAIL || !TEST_PASSWORD) {
  console.error("❌ 缺少必需的环境变量: ANON_KEY, TEST_EMAIL, TEST_PASSWORD")
  process.exit(1)
}

// 类型断言：上面已检查不为空
const anonKey: string = ANON_KEY
const testEmail: string = TEST_EMAIL
const testPassword: string = TEST_PASSWORD

async function main() {
  console.log("=== Supabase Sync Gateway 集成测试 ===\n")

  // 1. 登录测试账号
  const supabase = createClient(SUPABASE_URL, anonKey)

  // 尝试注册（若已存在会失败，忽略）
  await supabase.auth.signUp({ email: testEmail, password: testPassword })

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  })

  if (authError || !authData.session) {
    console.error("❌ 登录失败:", authError)
    process.exit(1)
  }

  const accessToken = authData.session.access_token
  const testUserId = authData.user!.id
  console.log("✓ 登录成功，user ID:", testUserId)

  // Helper: 调用网关
  async function callGateway(action: string, params: any = {}) {
    const res = await fetch(FUNCTION_URL, {
      method: "POST",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ action, ...params }),
    })
    return res.json()
  }

  // 2. register-device
  console.log("\n[Test] register-device")
  const deviceId = `test-device-${Date.now()}`
  const regResp = await callGateway("register-device", {
    deviceId,
    name: "Test Device",
    type: "browser",
  })
  if (!regResp.ok) {
    console.error("❌ register-device 失败:", regResp.error)
    process.exit(1)
  }
  console.log("✓ register-device 成功")

  // 3. push（正常记录）
  console.log("\n[Test] push 正常记录")
  const pushResp = await callGateway("push", {
    deviceId,
    changes: [
      {
        scope: "core",
        entityType: "workspace",
        recordKey: "test-workspace-1",
        payload: { name: "Test Workspace", theme: "dark" },
        clientUpdatedAt: new Date().toISOString(),
      },
    ],
  })
  if (!pushResp.ok || pushResp.data.pushedCount !== 1) {
    console.error("❌ push 失败:", pushResp)
    process.exit(1)
  }
  console.log("✓ push 成功, pushedCount:", pushResp.data.pushedCount)

  // 4. pull（拉回刚才 push 的记录）
  console.log("\n[Test] pull")
  const pullResp = await callGateway("pull", {})
  if (!pullResp.ok || pullResp.data.records.length === 0) {
    console.error("❌ pull 失败:", pullResp)
    process.exit(1)
  }
  const pulledRecord = pullResp.data.records.find((r: any) => r.recordKey === "test-workspace-1")
  if (!pulledRecord || pulledRecord.payload.name !== "Test Workspace") {
    console.error("❌ pull 拉回的记录不符:", pulledRecord)
    process.exit(1)
  }
  console.log("✓ pull 成功，拉回记录数:", pullResp.data.records.length)

  // 5. push 敏感字段（应被拒绝）
  console.log("\n[Test] push 敏感字段（预期拒绝）")
  const pushSensitiveResp = await callGateway("push", {
    deviceId,
    changes: [
      {
        scope: "plugin",
        entityType: "settings",
        recordKey: "test-sensitive",
        payload: { apiKey: "sk-xxxx", normalField: "value" },
        clientUpdatedAt: new Date().toISOString(),
      },
    ],
  })
  if (pushSensitiveResp.ok || pushSensitiveResp.error?.code !== "SENSITIVE_FIELD_REJECTED") {
    console.error("❌ push 敏感字段应该被拒绝，但没有:", pushSensitiveResp)
    process.exit(1)
  }
  console.log("✓ push 敏感字段被正确拒绝")

  // 6. snapshot
  console.log("\n[Test] snapshot")
  const snapshotResp = await callGateway("snapshot", {
    reason: "manual",
    payload: { workspaces: ["test-workspace-1"], timestamp: Date.now() },
  })
  if (!snapshotResp.ok || !snapshotResp.data.snapshotId) {
    console.error("❌ snapshot 失败:", snapshotResp)
    process.exit(1)
  }
  console.log("✓ snapshot 成功, snapshotId:", snapshotResp.data.snapshotId)

  // 7. list-devices
  console.log("\n[Test] list-devices")
  const listDevicesResp = await callGateway("list-devices")
  if (!listDevicesResp.ok || !Array.isArray(listDevicesResp.data.devices)) {
    console.error("❌ list-devices 失败:", listDevicesResp)
    process.exit(1)
  }
  const foundDevice = listDevicesResp.data.devices.find((d: any) => d.deviceId === deviceId)
  if (!foundDevice) {
    console.error("❌ list-devices 未找到刚注册的设备")
    process.exit(1)
  }
  console.log("✓ list-devices 成功，设备数:", listDevicesResp.data.devices.length)

  // 8. list-conflicts（应该为空，因为没有冲突）
  console.log("\n[Test] list-conflicts")
  const conflictsResp = await callGateway("list-conflicts")
  if (!conflictsResp.ok || !Array.isArray(conflictsResp.data.conflicts)) {
    console.error("❌ list-conflicts 失败:", conflictsResp)
    process.exit(1)
  }
  console.log("✓ list-conflicts 成功，冲突数:", conflictsResp.data.conflicts.length)

  // 9. 清理测试数据
  console.log("\n[Cleanup] 清理测试数据")
  await supabase.from("synced_records").delete().eq("account_id", testUserId)
  await supabase.from("sync_devices").delete().eq("account_id", testUserId)
  await supabase.from("sync_snapshots").delete().eq("account_id", testUserId)
  console.log("✓ 清理完成")

  console.log("\n=== 所有测试通过 ✓ ===")
}

main().catch((err) => {
  console.error("测试失败:", err)
  process.exit(1)
})
