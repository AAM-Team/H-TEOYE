# 1. Etapa de dependencias y construcción
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat

COPY . .

RUN corepack enable && pnpm install --frozen-lockfile --config.minimum-release-age=0 --ignore-scripts

RUN npx prisma generate

ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm run build

# 2. Etapa de ejecución final (Runner)
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar los archivos públicos y la salida standalone generada en .next-production
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next-production/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next-production/static ./.next-production/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.pnpm ./node_modules/.pnpm

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Apuntar directamente al punto de entrada compilado dentro de la estructura standalone
CMD ["node", "server.js"]