import type { Core } from "@strapi/strapi"

const allowedMediaTypes = [
  "image/*",
  "video/*",
  "audio/*",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.*",
  "text/plain",
  "text/csv",
]

const deniedExecutableTypes = [
  "application/vnd.microsoft.portable-executable",
  "application/x-msdownload",
  "application/x-msdos-program",
  "application/x-executable",
  "application/x-dosexec",
  "application/x-sh",
  "text/x-shellscript",
  "application/x-mach-binary",
]

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Plugin => ({
  "users-permissions": {
    config: {
      // 纯 JWT：legacy-support 模式登录返回 { jwt, user }，不签发 refresh token
      jwtManagement: "legacy-support",
      jwt: {
        expiresIn: env("JWT_EXPIRES_IN", "30d"),
      },
    },
  },
  upload: {
    config: {
      security: {
        allowedTypes: allowedMediaTypes,
        deniedTypes: deniedExecutableTypes,
      },
      // dev 用本地 provider；生产设 UPLOAD_PROVIDER=aws-s3 走 S3
      ...(env("UPLOAD_PROVIDER", "local") === "aws-s3"
        ? {
            provider: "aws-s3",
            providerOptions: {
              s3Options: {
                region: env("AWS_REGION"),
                credentials: {
                  accessKeyId: env("AWS_ACCESS_KEY_ID"),
                  secretAccessKey: env("AWS_ACCESS_SECRET"),
                },
                params: { Bucket: env("AWS_BUCKET") },
              },
            },
          }
        : { provider: "local" }),
    },
  },
  email: {
    config: {
      provider: env("EMAIL_PROVIDER", "sendmail"),
      providerOptions:
        env("NODE_ENV", "development") === "development"
          ? {
              devHost: env("EMAIL_DEV_HOST", "127.0.0.1"),
              devPort: env.int("EMAIL_DEV_PORT", 1025),
            }
          : {},
      settings: {
        defaultFrom: env("EMAIL_DEFAULT_FROM", "no-reply@tabora.local"),
        defaultReplyTo: env("EMAIL_DEFAULT_REPLY_TO", "support@tabora.local"),
      },
    },
  },
})

export default config
