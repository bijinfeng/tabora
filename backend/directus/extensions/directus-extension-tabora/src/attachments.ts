import type { Request, Response } from "express"

// Attachments endpoints
export function registerAttachmentsEndpoints(router: any, context: any): void {
  const { database } = context

  // POST /attachments/prepare
  router.post("/attachments/prepare", async (req: Request, res: Response) => {
    const { entity_type, mime_type, size_bytes, filename } = req.body
    const accountability = (req as any).accountability

    if (!accountability?.user) {
      return res.status(401).json({ errors: [{ message: "Unauthorized" }] })
    }

    if (!entity_type || !mime_type || !size_bytes || !filename) {
      return res.status(400).json({ errors: [{ message: "Missing required fields" }] })
    }

    try {
      const policies = await database.select("*").from("attachment_policies").where({ entity_type })

      const policy = policies[0] || null

      if (policy) {
        if (policy.mime_whitelist && !policy.mime_whitelist.includes(mime_type)) {
          return res.status(400).json({
            errors: [{ message: `MIME type ${mime_type} not allowed for ${entity_type}` }],
          })
        }

        if (policy.max_size_bytes && size_bytes > policy.max_size_bytes) {
          return res.status(400).json({
            errors: [{ message: `File size exceeds maximum of ${policy.max_size_bytes} bytes` }],
          })
        }
      }

      return res.json({
        data: {
          entity_type,
          filename,
          visibility: "private",
          upload: {
            method: "directus-files",
            endpoint: "/files",
          },
          policy: policy || undefined,
        },
      })
    } catch (_error) {
      return res.status(500).json({ errors: [{ message: "Failed to prepare attachment" }] })
    }
  })

  // POST /attachments/commit
  router.post("/attachments/commit", async (req: Request, res: Response) => {
    const { file_id, entity_type, entity_id } = req.body
    const accountability = (req as any).accountability

    if (!accountability?.user) {
      return res.status(401).json({ errors: [{ message: "Unauthorized" }] })
    }

    if (!file_id || !entity_type || !entity_id) {
      return res.status(400).json({ errors: [{ message: "Missing required fields" }] })
    }

    try {
      await database("attachment_refs").insert({
        file_id,
        owner_user_id: accountability.user,
        entity_type,
        entity_id,
      })

      const refs = await database.select("*").from("attachment_refs").where({ file_id })

      return res.json({
        data: {
          file_id,
          entity_type,
          entity_id,
          visibility: "private",
          refs_count: refs.length,
        },
      })
    } catch (_error) {
      return res.status(500).json({ errors: [{ message: "Failed to commit attachment" }] })
    }
  })

  // GET /attachments/:id/access
  router.get("/attachments/:id/access", async (req: Request, res: Response) => {
    const { id } = req.params
    const accountability = (req as any).accountability

    if (!accountability?.user) {
      return res.status(401).json({ errors: [{ message: "Unauthorized" }] })
    }

    try {
      const refs = await database
        .select("*")
        .from("attachment_refs")
        .where({ file_id: id, owner_user_id: accountability.user })

      if (refs.length === 0) {
        return res.status(403).json({ errors: [{ message: "Access denied" }] })
      }

      return res.json({
        data: {
          file_id: id,
          visibility: "private",
          asset_url: `/assets/${id}`,
        },
      })
    } catch (_error) {
      return res.status(500).json({ errors: [{ message: "Failed to check access" }] })
    }
  })

  // POST /attachments/:id/bind
  router.post("/attachments/:id/bind", async (req: Request, res: Response) => {
    const { id } = req.params
    const { entity_type, entity_id } = req.body
    const accountability = (req as any).accountability

    if (!accountability?.user) {
      return res.status(401).json({ errors: [{ message: "Unauthorized" }] })
    }

    if (!entity_type || !entity_id) {
      return res.status(400).json({ errors: [{ message: "Missing required fields" }] })
    }

    try {
      await database("attachment_refs").insert({
        file_id: id,
        owner_user_id: accountability.user,
        entity_type,
        entity_id,
      })

      const refs = await database.select("*").from("attachment_refs").where({ file_id: id })

      return res.json({
        data: {
          file_id: id,
          refs_count: refs.length,
        },
      })
    } catch (_error) {
      return res.status(500).json({ errors: [{ message: "Failed to bind attachment" }] })
    }
  })

  // POST /attachments/:id/unbind
  router.post("/attachments/:id/unbind", async (req: Request, res: Response) => {
    const { id } = req.params
    const { entity_type, entity_id } = req.body
    const accountability = (req as any).accountability

    if (!accountability?.user) {
      return res.status(401).json({ errors: [{ message: "Unauthorized" }] })
    }

    if (!entity_type || !entity_id) {
      return res.status(400).json({ errors: [{ message: "Missing required fields" }] })
    }

    try {
      await database("attachment_refs")
        .where({
          file_id: id,
          owner_user_id: accountability.user,
          entity_type,
          entity_id,
        })
        .del()

      const refs = await database.select("*").from("attachment_refs").where({ file_id: id })

      return res.json({
        data: {
          file_id: id,
          refs_count: refs.length,
        },
      })
    } catch (_error) {
      return res.status(500).json({ errors: [{ message: "Failed to unbind attachment" }] })
    }
  })

  // DELETE /attachments/:id
  router.delete("/attachments/:id", async (req: Request, res: Response) => {
    const { id } = req.params
    const accountability = (req as any).accountability

    if (!accountability?.user) {
      return res.status(401).json({ errors: [{ message: "Unauthorized" }] })
    }

    try {
      const refs = await database.select("*").from("attachment_refs").where({ file_id: id })

      if (refs.length > 0) {
        return res.status(409).json({
          errors: [{ message: "Cannot delete attachment with existing references" }],
        })
      }

      return res.sendStatus(204)
    } catch (_error) {
      return res.status(500).json({ errors: [{ message: "Failed to delete attachment" }] })
    }
  })

  // GET /attachments/:id/meta
  router.get("/attachments/:id/meta", async (req: Request, res: Response) => {
    const { id } = req.params
    const accountability = (req as any).accountability

    if (!accountability?.user) {
      return res.status(401).json({ errors: [{ message: "Unauthorized" }] })
    }

    try {
      const refs = await database
        .select("*")
        .from("attachment_refs")
        .where({ file_id: id, owner_user_id: accountability.user })

      if (refs.length === 0) {
        return res.status(403).json({ errors: [{ message: "Access denied" }] })
      }

      const files = await database.select("*").from("directus_files").where({ id })

      const file = files[0]

      if (!file) {
        return res.status(404).json({ errors: [{ message: "File not found" }] })
      }

      return res.json({
        data: {
          file: {
            id: file.id,
            title: file.title,
            filename_download: file.filename_download,
            type: file.type,
            filesize: file.filesize,
          },
          visibility: "private",
          refs_count: refs.length,
        },
      })
    } catch (_error) {
      return res.status(500).json({ errors: [{ message: "Failed to fetch metadata" }] })
    }
  })
}
