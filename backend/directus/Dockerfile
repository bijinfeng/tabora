FROM directus/directus:12.1.1

# 复制自定义扩展
COPY extensions /directus/extensions

# 确保扩展目录权限正确
RUN chown -R node:node /directus/extensions

USER node
