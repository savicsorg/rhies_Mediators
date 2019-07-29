## labware mediator ##

### Prerequisites ###
* Netbeans or VS code or any editor you prefere

*Follow the steps to modify this mediator
1. Open the **docker** folder inside your ide

2. edit the **lib/index.js** file

3. push your modifications to bitbucket

4. Build the docker image by running the command  **docker build -t savicsorg/labwaremediator:latest .**  while in the docker folder, the **latest** flag is the version number

5. if you changed the version, update the **docker-compose.yml** file

6. Push your image to the docker hub by running the command **docker push savicsorg/labwaremediator:latest** ,the **latest** flag is the version number


*Follow the steps to install the mediator

1. Copy the **docker-compose** folder anywhere on your server and change it's name to **labwaremediator**

2. While on the **labwaremediator** folder run the commande **sudo docker-compose build && docker-compose up -d**

3. Once the installation process is finish make sur that your **openHim** instance is running properly

4. got to the **labwaremediator/configToEdit/** folder

5. Edit **the two config file** to meet your needs

6. Restart your mediator 

7. finish the configuration process on **openHim**

8. test everything

9. go rest ;)






