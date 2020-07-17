## RHIES Facility Registry Mediator ##
The Facility Registry Mediator project is created using NodeJs

### Prerequisites ###
* VS code or any editor you prefere

### How to modify the FacilityRegistryMediator ###

Follow the steps to update the url for facilityregistry mediator and credentials and to modify the server url : 

1. Open the **server** folder inside your ide

2. Edit the **config/config.json** file

3. Push your modifications to GitHub

4. Build the docker images by running the command  **docker build -t  savicsorg/frtoomrs:latest .**  while in the docker folder, the **latest** flag is the version number

5. Push your image to the docker hub by running the command **docker push savicsorg/frtoomrs:latest**
