#!/bin/sh
# Le volume monté appartient à root : on donne l'accès à l'utilisateur « node », puis on lance le serveur sans droits root.
mkdir -p /data && chown -R node:node /data
exec su-exec node node --no-warnings /app/src/server.js
