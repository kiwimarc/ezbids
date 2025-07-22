#!/usr/bin/env bash
source .env
mongod --dbpath /data/ --nounixsocket
