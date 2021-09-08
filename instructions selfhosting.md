**Note:**
Please be aware that there will be limited/no support for self-hosting and apart from this wiki, you should figure out most stuff yourself. If you do not have experience with self hosting, we recommend using the public bot, that you can invite by clicking [here](https://discord.com/api/oauth2/authorize?client_id=437598259330940939&permissions=68672&scope=bot)

## Prerequisites
1. Create a bot on the [Discord Developer Portal](https://discordapp.com/developers/)
2. Turn on **Server Members Intent** in the bot's settings page on the developer portal
3. Invite the Discord bot to your server
4. Install Node.js 14 (LTS)
5. [Download the latest bot release here](https://github.com/midblue/timezone-bot)
6. Extract the downloaded Zip file to a new folder. In this tutorial, we will asume the folder is called "tutorial"

## Setup
1. Create a .env file and copy the values from .env_example.
2. Input the values that are needed in the file.
3. The `DISCORD_TOKEN` and `BOT_ID` (called Client or Application ID on the Discord Developer Portal) can be found in the Discord Developer Portal.
4. For the `GOOGLE_API_KEY` and the Firebase Credentials, you will need a [Google Developer account](https://console.cloud.google.com). After creating your account and your project, go to the [API & Services section](https://console.cloud.google.com/apis).
5. Click on `ENABLE APIS AND SERVICES` at the top and enable the [Timezone API](https://console.cloud.google.com/apis/library/timezone-backend.googleapis.com), the [GeoCoding API](https://console.cloud.google.com/marketplace/product/google/geocoding-backend.googleapis.com) and the [Cloud Datastore API](https://console.cloud.google.com/marketplace/product/google/datastore.googleapis.com).
6. Go to the [Credentials page](https://console.cloud.google.com/apis/credentials) and create a new API key. Copy this and paste it after `GOOGLE_API_KEY=`.
7. Open the [Datastore](https://console.cloud.google.com/datastore/) page on Google cloud and choose native mode. Select the location of your choice, preferably close to where your bot is hosted. After your database has been created, click on start collection and create a new `Collection ID` named "guilds". All other fields can be left empty.
8. After enabling your API's, go to [Firebase](https://console.firebase.google.com) and create a new project. Click add project and link it to your Google project that you used for the API's.
9. You do not need Google Analytics enabled for this project, so if you want, you can turn it off.
10. Setup a new Firebase web app by clicking the `</>` symbol in the middle of the page. Give your Firebase project a cool name and register the app. No need to enable Firebase Hosting.
11. Copy the `projectId` from the Firebase SDK and paste it after `FIREBASE_PROJECT_ID=`.
12. Go to project settings by clicking on the cog in the sidebar on the main menu and go to service accounts. Create a new Firebase Admin SDK for node.js. Once you click "Generate a new private key", it will prompt you to download a file. In this file there are 2 values of importance. First off, you need the `client_email`. Paste this in the .env file after `FIREBASE_CLIENT_EMAIL=`. Next up, copy the `private_key` and paste this after `FIREBASE_PRIVATE_KEY=`. Be sure to not copy the comma at the end of the entries.
13. That's it for the .env file!

**NOTE:** You will need to give Google permission to bill you once you go over the quota, as otherwise, the bot will not work with country/city names and only timezones will work.

## Terminal
1. Open your terminal and cd in the folder where bot files are located, so in our case: `cd tutorial`
2. Run `npm ci` and wait for it to finish
3. To start the bot, run `npm start`
4. That's it! You're bot should be up and running :)
