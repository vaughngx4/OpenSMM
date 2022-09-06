#!/bin/bash
#docker compose rm -sf
docker compose down
bash ./build.sh
docker compose up -d
