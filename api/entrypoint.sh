#!/bin/sh
/logo.sh

initdone="/data/init.done"
while [ ! -e "$initdone" ];do
    echo "Running first time setup"
    mkdir -p /data/fileuploads
    chown -R node:node /data/fileuploads
    touch /data/init.done
    echo "Setup complete"
    break;
done

echo "Starting OpenSMM API"

exec "$@"
