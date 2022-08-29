#!/bin/bash
docker compose rm -sf
bash ./build.sh
docker compose up -d
