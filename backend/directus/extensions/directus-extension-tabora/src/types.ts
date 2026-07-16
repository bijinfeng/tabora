import type { Accountability, EndpointExtensionContext } from "@directus/types"
import type { NextFunction, Request, RequestHandler, Response, Router } from "express"

export type TaboraRouter = Router
export type TaboraEndpointContext = EndpointExtensionContext
export type TaboraDatabase = TaboraEndpointContext["database"]
export type TaboraResponse = Response
export type TaboraNext = NextFunction

export type TaboraRequest<
  TBody = unknown,
  TParams extends Record<string, string> = Record<string, string>,
> = Request<TParams, unknown, TBody> & {
  accountability?: Accountability | null
}

export type AsyncRouteHandler<
  TBody = unknown,
  TParams extends Record<string, string> = Record<string, string>,
> = (
  request: TaboraRequest<TBody, TParams>,
  response: TaboraResponse,
  next: TaboraNext,
) => Promise<unknown>

export type TaboraRequestHandler = RequestHandler

export type AttachmentPolicy = {
  entity_type: string
  mime_whitelist: string[] | null
  max_size_bytes: number | null
}

export type AttachmentRef = {
  id?: number
  file_id: string
  owner_user_id: string
  entity_type: string
  entity_id: string
}

export type DirectusFileSummary = {
  id: string
  uploaded_by: string | null
  title?: string | null
  filename_download?: string | null
  type?: string | null
  filesize?: number | string | null
}

export type DirectusSessionRow = {
  token: string
  data: unknown
  created_at: string | null
  expires: string | null
  ip: string | null
  user_agent: string | null
  origin: string | null
}
