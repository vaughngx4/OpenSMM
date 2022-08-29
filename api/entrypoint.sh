#!/bin/sh
/logo.sh
initdone="/data/init.done"
while [ ! -e $initdone ];do
    echo "Running first time setup"
    echo ""
    echo "Setup complete"
    break;
done
echo "Starting OpenSMM API"
su-exec node npm start
