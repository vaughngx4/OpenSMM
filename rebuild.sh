#!/bin/bash
docker compose down
bash ./build.sh
docker compose up -d
