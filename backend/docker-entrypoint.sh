
#!/bin/sh
# Le volume monté appartient à root : on donne l'accès à l'utilisateur « node », puis on lance le serveur sans droits root.
# Hébergeurs sans privilèges (MSY CLOUD : conteneur sans root et sans capacités) : chown et su-exec y sont refusés ;
# le conteneur y est déjà isolé, le serveur démarre alors directement.
mkdir -p /data
if chown -R node:node /data 2>/dev/null && su-exec node true 2>/dev/null; then
  exec su-exec node node --no-warnings /app/src/server.js
fi
exec node --no-warnings /app/src/server.js
