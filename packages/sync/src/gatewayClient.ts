export type GatewayAction =
  | "register-device"
  | "push"
  | "pull"
  | "snapshot"
  | "list-devices"
  | "remove-device"
  | "list-conflicts"
  | "resolve-conflict"

export type GatewayRequest = {
  action: GatewayAction
  [key: string]: unknown
}

export type GatewaySuccessResponse<T = any> = {
  ok: true
  data: T
}

export type GatewayErrorResponse = {
  ok: false
  error: {
    code:
      | "AUTH_FAILED"
      | "DEVICE_REMOVED"
      | "INVALID_PAYLOAD"
      | "SENSITIVE_FIELD_REJECTED"
      | "ENTITY_NOT_SYNCABLE"
      | "DB_ERROR"
      | "UNKNOWN_ACTION"
    message: string
  }
}

export type GatewayResponse<T = any> = GatewaySuccessResponse<T> | GatewayErrorResponse

export type DeviceInfo = {
  deviceId: string
  name: string
  type: "macos" | "windows" | "ios" | "android" | "browser"
}

export type SyncRecord = {
  scope: "core" | "plugin"
  entityType: string
  recordKey: string
  payload: unknown
  clientUpdatedAt: string
  deleted: boolean
}

export type PushRequest = {
  action: "push"
  deviceId: string
  records: SyncRecord[]
}

export type PushResponse = {
  accepted: string[]
  rejected: Array<{
    recordKey: string
    reason: string
    serverState?: SyncRecord
  }>
}

export type PullRequest = {
  action: "pull"
  cursor?: string
}

export type PullResponse = {
  records: Array<SyncRecord & { serverUpdatedAt: string }>
  cursor: string
  hasMore: boolean
}

export type RegisterDeviceRequest = {
  action: "register-device"
  device: DeviceInfo
}

export type RegisterDeviceResponse = {
  deviceId: string
  status: "current" | "online"
}

export type SnapshotRequest = {
  action: "snapshot"
  deviceId: string
  reason: "first-sync" | "pre-merge" | "manual"
}

export type SnapshotResponse = {
  snapshotId: string
  createdAt: string
}

export type GatewayClientConfig = {
  gatewayUrl: string
  getAccessToken: () => Promise<string | null>
}

/**
 * Gateway client - the only place that calls sync-gateway Edge Function.
 * All sync operations go through this client.
 */
export function createGatewayClient(config: GatewayClientConfig) {
  async function call<T = any>(request: GatewayRequest): Promise<GatewayResponse<T>> {
    const token = await config.getAccessToken()
    if (!token) {
      return {
        ok: false,
        error: {
          code: "AUTH_FAILED",
          message: "No access token available",
        },
      }
    }

    try {
      const response = await fetch(config.gatewayUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(request),
      })

      const data = await response.json()
      return data as GatewayResponse<T>
    } catch (err) {
      return {
        ok: false,
        error: {
          code: "DB_ERROR",
          message: err instanceof Error ? err.message : "Network error",
        },
      }
    }
  }

  return {
    async registerDevice(device: DeviceInfo): Promise<GatewayResponse<RegisterDeviceResponse>> {
      return call<RegisterDeviceResponse>({
        action: "register-device",
        device,
      })
    },

    async push(deviceId: string, records: SyncRecord[]): Promise<GatewayResponse<PushResponse>> {
      return call<PushResponse>({
        action: "push",
        deviceId,
        records,
      })
    },

    async pull(cursor?: string): Promise<GatewayResponse<PullResponse>> {
      return call<PullResponse>({
        action: "pull",
        cursor,
      })
    },

    async snapshot(
      deviceId: string,
      reason: SnapshotRequest["reason"],
    ): Promise<GatewayResponse<SnapshotResponse>> {
      return call<SnapshotResponse>({
        action: "snapshot",
        deviceId,
        reason,
      })
    },

    async listDevices(): Promise<
      GatewayResponse<{
        devices: Array<DeviceInfo & { status: string; lastSyncAt?: string }>
      }>
    > {
      return call({
        action: "list-devices",
      })
    },

    async removeDevice(deviceId: string): Promise<GatewayResponse<{ removed: boolean }>> {
      return call({
        action: "remove-device",
        deviceId,
      })
    },

    async listConflicts(): Promise<
      GatewayResponse<{
        conflicts: Array<{
          conflictId: string
          entityType: string
          recordKey: string
          localState: unknown
          remoteState: unknown
          createdAt: string
        }>
      }>
    > {
      return call({
        action: "list-conflicts",
      })
    },

    async resolveConflict(
      conflictId: string,
      resolution: "keep-local" | "keep-remote" | "merged",
      mergedPayload?: unknown,
    ): Promise<GatewayResponse<{ resolved: boolean }>> {
      return call({
        action: "resolve-conflict",
        conflictId,
        resolution,
        mergedPayload,
      })
    },
  }
}

export type GatewayClient = ReturnType<typeof createGatewayClient>
