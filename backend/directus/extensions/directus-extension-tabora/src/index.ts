import { defineEndpoint } from "@directus/extensions-sdk"
import { registerAttachmentsEndpoints } from "./attachments"

export default defineEndpoint((router, context) => {
  const { services, database } = context

  // Register attachments endpoints
  registerAttachmentsEndpoints(router, context)

  // POST /auth/register
  router.post("/auth/register", async (req, res) => {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        errors: [{ message: "Email and password are required" }],
      })
    }

    try {
      const baseUrl =
        process.env.TABORA_INTERNAL_DIRECTUS_URL || `http://localhost:${process.env.PORT || 8055}`
      const response = await fetch(`${baseUrl}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        return res.status(response.status).json({
          errors: [{ message: errorText }],
        })
      }

      return res.sendStatus(204)
    } catch (_error) {
      return res.status(500).json({
        errors: [{ message: "Registration failed" }],
      })
    }
  })

  // POST /auth/login
  router.post("/auth/login", async (req, res) => {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        errors: [{ message: "Email and password are required" }],
      })
    }

    try {
      const schema = (req as any).schema || {}
      const authService = new services.AuthenticationService({
        schema,
        accountability: null,
      })

      const result = await authService.login("default", { email, password }, { session: true })

      return res.json({
        data: {
          access_token: result.accessToken,
          refresh_token: result.refreshToken,
          expires: result.expires,
        },
      })
    } catch (_error) {
      return res.status(401).json({
        errors: [{ message: "Invalid credentials" }],
      })
    }
  })

  // POST /auth/refresh
  router.post("/auth/refresh", async (req, res) => {
    const { refresh_token } = req.body

    if (!refresh_token) {
      return res.status(400).json({
        errors: [{ message: "Refresh token is required" }],
      })
    }

    try {
      const schema = (req as any).schema || {}
      const authService = new services.AuthenticationService({
        schema,
        accountability: null,
      })

      const result = await authService.refresh(refresh_token, { session: true })

      return res.json({
        data: {
          access_token: result.accessToken,
          refresh_token: result.refreshToken,
          expires: result.expires,
        },
      })
    } catch (_error) {
      return res.status(401).json({
        errors: [{ message: "Invalid refresh token" }],
      })
    }
  })

  // POST /auth/logout
  router.post("/auth/logout", async (req, res) => {
    const { refresh_token } = req.body

    if (!refresh_token) {
      return res.status(400).json({
        errors: [{ message: "Refresh token is required" }],
      })
    }

    try {
      const schema = (req as any).schema || {}
      const authService = new services.AuthenticationService({
        schema,
        accountability: null,
      })

      await authService.logout(refresh_token)

      return res.sendStatus(204)
    } catch (_error) {
      return res.status(500).json({
        errors: [{ message: "Logout failed" }],
      })
    }
  })

  // GET /auth/session
  router.get("/auth/session", async (req, res) => {
    const accountability = (req as any).accountability

    if (!accountability?.user) {
      return res.status(401).json({
        errors: [{ message: "Unauthorized" }],
      })
    }

    try {
      const schema = (req as any).schema || {}
      const usersService = new services.UsersService({
        schema,
        accountability,
      })

      const user = await usersService.readOne("me")

      return res.json({ data: user })
    } catch (_error) {
      return res.status(500).json({
        errors: [{ message: "Failed to fetch session" }],
      })
    }
  })

  // POST /auth/send-code
  router.post("/auth/send-code", async (req, res) => {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({
        errors: [{ message: "Email is required" }],
      })
    }

    try {
      const baseUrl =
        process.env.TABORA_INTERNAL_DIRECTUS_URL || `http://localhost:${process.env.PORT || 8055}`
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)

      const response = await fetch(`${baseUrl}/auth/password/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        return res.sendStatus(204)
      }

      return res.sendStatus(204)
    } catch (error: any) {
      if (error.name === "AbortError") {
        return res.status(504).json({ error: "upstream_unavailable" })
      }
      return res.sendStatus(204)
    }
  })

  // POST /auth/verify-code
  router.post("/auth/verify-code", async (req, res) => {
    const { token, code, password } = req.body
    const resetToken = token || code

    if (!resetToken || !password) {
      return res.status(400).json({
        errors: [{ message: "Token/code and password are required" }],
      })
    }

    try {
      const baseUrl =
        process.env.TABORA_INTERNAL_DIRECTUS_URL || `http://localhost:${process.env.PORT || 8055}`
      const response = await fetch(`${baseUrl}/auth/password/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: resetToken, password }),
      })

      if (!response.ok) {
        return res.status(400).json({
          errors: [{ message: "Invalid or expired code" }],
        })
      }

      return res.sendStatus(204)
    } catch (_error) {
      return res.status(500).json({
        errors: [{ message: "Verification failed" }],
      })
    }
  })

  // GET /auth/devices
  router.get("/auth/devices", async (req, res) => {
    const accountability = (req as any).accountability

    if (!accountability?.user) {
      return res.status(401).json({
        errors: [{ message: "Unauthorized" }],
      })
    }

    try {
      const sessions = await database
        .select("*")
        .from("directus_sessions")
        .where({ user: accountability.user })
        .orderBy("created_at", "desc")

      return res.json({ data: { devices: sessions } })
    } catch (_error) {
      return res.status(500).json({
        errors: [{ message: "Failed to fetch devices" }],
      })
    }
  })

  // POST /auth/revoke
  router.post("/auth/revoke", async (req, res) => {
    const accountability = (req as any).accountability

    if (!accountability?.user) {
      return res.status(401).json({
        errors: [{ message: "Unauthorized" }],
      })
    }

    const { session_id } = req.body

    if (!session_id) {
      return res.status(400).json({
        errors: [{ message: "Session ID is required" }],
      })
    }

    try {
      await database("directus_sessions")
        .where({ token: session_id, user: accountability.user })
        .del()

      return res.sendStatus(204)
    } catch (_error) {
      return res.status(500).json({
        errors: [{ message: "Failed to revoke session" }],
      })
    }
  })
})
