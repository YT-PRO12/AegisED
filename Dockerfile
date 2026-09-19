FROM node:22-bookworm-slim AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM node:22-bookworm-slim AS app
ENV NODE_ENV=production
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --chown=node:node backend/src ./src
COPY --chown=node:node backend/scripts ./scripts
COPY --chown=node:node backend/migrations ./migrations
COPY --from=frontend-build --chown=node:node /app/frontend/dist /app/frontend/dist
RUN chown node:node /app/backend
USER node
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=5s CMD node -e "fetch('http://127.0.0.1:5000/api/ready').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["sh", "-c", "npm run migrate && node src/server.js"]
