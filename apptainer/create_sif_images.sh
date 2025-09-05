#!/usr/bin/env bash

set -e

# Build docker images
cd ..
./build.sh


# Export docker images
cd apptainer

docker save -o api_image.tar ezbids-api
docker save -o handler_image.tar ezbids-handler
docker save -o ui_image.tar ezbids-ui
docker save -o telemetry_image.tar ezbids-telemetry

# Convert docker images to apptainer images
apptainer build api.sif docker-archive:api_image.tar
apptainer build handler.sif docker-archive:handler_image.tar
apptainer build ui.sif docker-archive:ui_image.tar
apptainer build telemetry.sif docker-archive:telemetry_image.tar
