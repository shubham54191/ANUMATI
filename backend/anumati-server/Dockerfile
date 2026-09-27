# ANUMATI API and worker — one image, two commands.
# Build from the repository root: the engine is bundled in from anumati-web/lib.
#   docker build -f backend/anumati-server/Dockerfile -t anumati-server .

FROM node:22-bookworm-slim AS build
WORKDIR /repo/backend/anumati-server
COPY backend/anumati-server/package.json backend/anumati-server/package-lock.json ./
RUN npm ci
COPY anumati-web/lib /repo/anumati-web/lib
COPY anumati-web/types /repo/anumati-web/types
COPY backend/anumati-server/ ./
RUN npm run build && npm prune --omit=dev

FROM node:22-bookworm-slim
ENV NODE_ENV=production \
    PORT=4000 \
    DOCUMENT_STORE_DIR=/var/lib/anumati/documents
WORKDIR /app
COPY --from=build /repo/backend/anumati-server/node_modules ./node_modules
COPY --from=build /repo/backend/anumati-server/dist ./dist
COPY --from=build /repo/backend/anumati-server/migrations ./migrations
COPY --from=build /repo/backend/anumati-server/package.json ./
RUN mkdir -p /var/lib/anumati/documents && chown -R node:node /var/lib/anumati
USER node
EXPOSE 4000
HEALTHCHECK --interval=15s --timeout=3s --start-period=20s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||4000)+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/index.js"]
