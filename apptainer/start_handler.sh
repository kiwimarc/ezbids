#!/usr/bin/env bash
source .env
cd ..
cd handler/
pm2 start handler.js --attach --watch --ignore-watch "ui **/node_modules **__pycache__**"
#./start.sh
