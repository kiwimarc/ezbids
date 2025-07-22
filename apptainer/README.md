# Apptainer for ezBIDS

This guide provides steps to convert Docker containers into Apptainer images and run them.

## Converting Docker to Apptainer

### Step 1: Build Docker Containers
Run the following command to build the Docker containers:
```sh
cd ..
./build.sh
```

### Step 2: Export Docker Images
Save the running images to `.tar` files:
```sh
docker save -o api_image.tar ezbids-api
docker save -o handler_image.tar ezbids-handler
docker save -o ui_image.tar ezbids-ui
docker save -o telemetry_image.tar ezbids-telemetry
```
For more information, refer to the Docker documentation: [Docker Save Command](https://docs.docker.com/reference/cli/docker/image/save/)

### Step 3: Convert Docker Images to Apptainer Images
Use the following commands to convert each exported Docker image to an Apptainer `.sif` image:
```sh
apptainer build api.sif docker-archive:api_image.tar
apptainer build handler.sif docker-archive:handler_image.tar
apptainer build ui.sif docker-archive:ui_image.tar
apptainer build telemetry.sif docker-archive:telemetry_image.tar
```

## Usage

### Starting the Containers
Run the following command to start the Apptainer containers:
```sh
./run_apptainer.sh
```

### Stopping the Containers
To stop the Apptainer containers, execute:
```sh
./stop_apptainer.sh
```
