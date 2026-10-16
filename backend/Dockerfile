FROM node:22-alpine
RUN apk add --no-cache su-exec
WORKDIR /app
COPY package.json ./
COPY src ./src
COPY scripts ./scripts
COPY docker-entrypoint.sh /usr/local/bin/entrypoint
RUN chmod +x /usr/local/bin/entrypoint
ENV NODE_ENV=production DB_FILE=/data/prepconcours.db PORT=3000
VOLUME /data
EXPOSE 3000
ENTRYPOINT ["entrypoint"]
