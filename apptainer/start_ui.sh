#!/usr/bin/env bash
set -x
source .env
cd ../ui
./entrypoint.sh
#npm --prefix ./ui run dev
