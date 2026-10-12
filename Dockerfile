FROM node:22-alpine
WORKDIR /app
COPY server.mjs quota.mjs activity-policy.mjs index.html script.js style.css ./
ENV NODE_ENV=production
EXPOSE 10000
CMD ["node", "server.mjs"]
