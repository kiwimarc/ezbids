#!/usr/bin/env bash

# Get the Ezbids directory
EZBIDS_DIR=$(dirname `pwd`)

# Run development script
./dev_apptainer.sh

# load the environment variables from the .env file
source .env

if [ ! -e "mongodb.sif" ]; then

    apptainer build mongodb.sif docker://mongo:4.4.15

fi

# Check MongoDB readiness
wait_for_mongodb() {
    sleep 5
    for i in {1..100}; do
        if apptainer exec instance://mongodb bash -c "echo 'db.runCommand(\"ping\").ok' | mongo localhost:27017/test --quiet" | grep -q 1; then
            echo "MongoDB is ready."
            return
        fi
        echo "MongoDB not ready, retrying in 5s..."
        sleep 5
    done
    echo "MongoDB failed health check."
    exit 1
}

# Check API readiness
wait_for_api() {
    sleep 90
    for i in {1..100}; do
        if curl -fs http://localhost:8082/health >/dev/null; then
            echo "API is ready."
            return
        fi
        echo "API not ready, retrying in 90s..."
        sleep 90
    done
    echo "API failed health check."
    apptainer instance stop api
    apptainer instance stop mongodb
    exit 1
}

# Check UI readiness
wait_for_ui() {
    sleep 5
    for i in {1..100}; do
        if curl -fs http://localhost:3000 >/dev/null; then
            echo "UI is ready."
            return
        fi
        echo "UI not ready, retrying in 5s..."
        sleep 5
    done
    echo "UI failed health check."
    apptainer instance stop api
    apptainer instance stop handler
    apptainer instance stop mongodb
    apptainer instance stop ui
    exit 1
}


# Start MongoDB container
echo "Starting MongoDB container..."
apptainer instance run --bind $EZBIDS_DIR:$EZBIDS_DIR --bind $EZBIDS_DIR/tmp:/tmp --bind $EZBIDS_DIR/tmp/data:/data --hostname mongodb mongodb.sif mongodb ./start_mongodb.sh

# Wait for MongoDB to be ready
echo "Waiting for MongoDB to be ready..."
wait_for_mongodb

# Start the API container
echo "Starting API container..."
apptainer instance run --env "PM2_HOME=$HOME/.api" --bind $EZBIDS_DIR:$EZBIDS_DIR --bind $EZBIDS_DIR/tmp:/tmp --no-mount /etc/hosts --bind mongo_host:/etc/hosts api.sif api ./start_api.sh

# Wait for API to be ready
echo "Waiting for API to be ready..."
wait_for_api

# Start the Handler container
echo "Starting Handler container..."
apptainer instance run --env "PM2_HOME=$HOME/.handler" --bind $EZBIDS_DIR:$EZBIDS_DIR --bind $EZBIDS_DIR/tmp:/tmp --no-mount /etc/hosts --bind mongo_host:/etc/hosts handler.sif handler ./start_handler.sh

# Start the UI container
echo "Starting UI container..."
apptainer instance run --bind $EZBIDS_DIR:$EZBIDS_DIR ui.sif ui
apptainer exec --env "VITE_APIHOST=http://$SERVER_NAME:8082" instance://ui bash -c "./start_ui.sh &"

# Wait for UI to be ready
echo "Waiting for UI to be ready..."
wait_for_ui

# Start Telemetry container (if in development profile)
if [ "$PROFILE" == "development" ]; then
    echo "Starting Telemetry container..."
    apptainer instance --bind $EZBIDS_DIR:$EZBIDS_DIR run telemetry.sif telementry ./start_telementry.sh
fi

# Inform user that containers are running
echo "All containers are running"
