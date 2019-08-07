## mediator ##

### Prerequisites ###
* Netbeans or VS code or any editor you prefere



* Follow the steps to modify the omrstonida mediator

1. Open the **server** folder inside your ide

2. edit the **lib/index.js** file

3. push your modifications to bitbucket

4. Build the docker image by running the command  **docker build -t  savicsorg/omrstonida:latest .**  while in the docker folder, the **latest** flag is the version number

5. Push your image to the docker hub by running the command **docker push savicsorg/omrstonida:latest** ,the **latest** flag is the version number
