export {
  createStrapiAuthClient,
  type StrapiAuthClient,
  type StrapiAuthClientConfig,
  type StrapiSession,
  type CurrentUser,
} from "./strapiAuthClient"

export { mapStrapiError, AUTH_ERROR_MESSAGES, type AuthError, type AuthErrorCode } from "./errors"
