# ANUMATI web. NEXT_PUBLIC_ANUMATI_API is baked in at build time:
# leave it empty for the offline demo, set it to the API's public URL for live mode.
#   docker build -f anumati-web/Dockerfile --build-arg NEXT_PUBLIC_ANUMATI_API=http://localhost:4000 -t anumati-web .

FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY anumati-web/package.json anumati-web/package-lock.json ./
RUN npm ci
COPY anumati-web/ ./
ARG NEXT_PUBLIC_ANUMATI_API=""
ENV NEXT_PUBLIC_ANUMATI_API=$NEXT_PUBLIC_ANUMATI_API \
    NEXT_TELEMETRY_DISABLED=1
RUN npm run build && npm prune --omit=dev

FROM node:22-bookworm-slim
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000
WORKDIR /app
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/next.config.js ./
USER node
EXPOSE 3000
CMD ["node_modules/.bin/next", "start", "-p", "3000"]
