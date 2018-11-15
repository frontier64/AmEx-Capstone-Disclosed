# Ally - HR Chat Bot

![Ally Architecture Image](/ally-architecture.png)
## Tools/Technologies Used:
The primary tools and technologies that Ally uses are Slack, Dialogflow, Google Cloud Functions, and Google DataStore.
## Slack
https://slack.com

Slack served as the communication interface between the user and the bot. Ally was added as an app inside of Slack so that users could directly talk to it and see the responses. The backend technologies used in Ally can be changed to use other mediums other than Slack.

## Dialogflow
https://dialogflow.com

Dialogflow is the natural language processor that integrates with the Google Cloud Platform. Developers define Intents and Entities which are used to analyze the message from the user and determine what the user is trying to do. The Intent is the action that a user is wanting the bot to do and the entity is a value associated with that action (e.g. we define an intent for getting user data from the database and an entity for the type of data the user wants to query for). Intents and entities are created in the Dialogflow web portal. Ally uses simple, single response, general context intents like those listed in the table below. More complex intents can be created such as if the developer would like to allow the user to make an action depending on the response they receive from Ally (a follow-up intent). Intents can be triggered by messages sent from the user or by events that are triggered when a user does something in the chat app used to interface with the bot. Intents can either respond with a message from Dialogflow or can use a webhook to call a separate fulfillment system for more complex requests.

|Intent Name| Description | Sample Training Phrases |
|--|--|--|
| get_pto | Used to notify fulfillment that the user would like to calculate their accumulated PTO| do I have vacation days? how much pto do i have? how much time can I take off?
|getUserInfo | Used to notify fulfillment that the user wants Ally to query the user DB | who is my boss? how long have I been working at AmEx? where’s my office? |
|help | Provides a help dialog to the user which informs them of Ally’s capabilities | can you help me, ???, what can you do
|welcome | A friendly hello! | HeyHihello |

Entities are pieces of data that dialogflow can recognize and separate from the rest of the message. For example, the @userInfo entity defined is used to identify what information the user is trying to get Ally to query for in the DB. Entities can be used in many intents and intents can use many entities. Entity classes can have multiple data types which can be mapped to synonyms. This way if a user says “Who is my boss?” Ally can recognize that “boss” is the same as “supervisor”.

|Entity Name|Description|Data Name|Sample synonyms|
|-|-|-|-|
|@userInfo|Used to identify data to be pulled for user|supervisor|Boss, head honcho, my direct report|
| | |email|Email address, e-mail, electronic mail, emailaddress|

Fulfillment for Dialogflow is handled by webooks. Each Dialogflow bot can connect to a single webhook (Cloud functions for example) to provide data access for the bot. Basic authentication can also be added here. Dialogflow sends data to the fulfillment service such as: matched intent(s), matched entities, the likelihood with which the match was successful, the original message, and others. Full data structure can be found later in the document.

Small talk allows for developers to provide responses for popular messages sent from users to chatbots like “Wow!” and “Can you get smarter?”

Training Dialogflow is quick and simple. When an intent or entity is added or edited Dialogflow will automatically trigger training. Training can be done while you work and generally takes less than a minute.

Dialogflow also provides history and analytics to allow developers to view data that was received and how it was handled by the bot. It also shows how consistent it was with determining user’s intents and how often it was unable to match a user message with an intent.

## Google Cloud Functions
https://cloud.google.com/functions/

Google Cloud Functions is the platform on which we are hosting most of our code to provide Ally with what we want her to say. Cloud Functions run node.js code. The Cloud Functions consist of an Entry Function in which the initial request is received from DialogFlow with the parsed intent of the user’s message. The entryFunction then uses that request and forwards the pertaining details to another Cloud Function. This second Cloud Function will generally pull the requested details from the Datastore and then relayed back to Ally through the Entry Function.

Cloud Functions has support for environment variables, but hasn’t yet supported them for the Cloud Functions Emulator which is used to test code locally. As an alternative, Ally currently uses an NPM package called yenv https://www.npmjs.com/package/yenv. Environment variables are stored in yaml files and yenv will pull the appropriate variables from the yaml file according to the current environment.

## Google Datastore
https://cloud.google.com/datastore/

Google Datastore is a NoSQL database that is being used to store all user (employee) data. The cloud functions use the ‘@google-cloud/datastore’ npm package to perform database queries and updates.

### Credentials
Datastore interactions will work automatically when invoked by a Cloud Function registered to the same the Google Cloud Project. However, for local emulation, you will first need to load the project credentials onto your local machine or else you will receive a promise rejection error when trying to perform a Datastore interaction. Setting this up is covered in the Gcloud SDK section of this documentation.

### Indexing and Queries
Datastore requires a sort of query template, called an index, before you can perform any kind of complex query. Datastore/index.yaml contains all of the indexes required to perform our queries at this time. If a new type of query is required, the index.yaml file can be updated and re-uploaded to Datastore at any time.

### Example Index and Query
The current Datastore/index.yaml file includes an example index structure:

	- kind: Task
		properties:
		- name: slackID
		- name: location

This index enables running the following query:

	datastore
		.createQuery('Task')
		.select('location')
		.filter('slackID','=',slackUserID);

This query queries the ‘Task’ table and finds the value of the location field belonging to the entity whose slackID value matches the string slackUserID.

### Updating index.yaml
At this time, the Google Cloud Platform does not have the capability to upload the index.yaml file from the online dashboard. This step must be performed with the gcloud command line. After updating the index.yaml file, upload the new version to datastore using the gcloud command:

    gcloud datastore indexes create [PATH]
    
Where [PATH] is the path to the index.yaml file.
It may take a few minutes for the indexes to build depending on the size of the database.

### Entity Updates
Datastore does not support entity updates. That is, you cannot just modify a single field in an existing entity. An entity write will overwrite the entire entity, even if you only populate a single field. To perform an entity update, you can first query the entity you wish to operate on, modify the relevant fields, and then save the entire entity to Datastore.

### Additional Datastore Documentation
Current index structure: https://console.cloud.google.com/datastore/indexes?authuser=1&organizationId=247721031950&project=ally-be86e

Indexing Documentation: https://cloud.google.com/appengine/docs/standard/nodejs/configuring-datastore-indexes-with-index-yaml

## JSON Data Structure
User queries are transmitted from Slack to Dialogflow in JSON and then passed along to Google Cloud Functions in JSON as well.

Dialogflow sends the data as a webhook in the form of JSON to the functions.  The format of the JSON is found at https://dialogflow.com/docs/reference/v1-v2-migration-guide-fulfillment selecting the v2 tab.  The website also includes the responses Dialogflow is expecting in order to give a response to the user.  It should be noted that during the development of Ally, Dialogflow updated to v2 which caused a changed in the format of the JSONs being sent.  The JSON sent to the Google Cloud Functions include exactly what the question was in the “queryText” object which is part of “queryResult”, what Dialogflow has determined the Intent found in the “displayName” object found in “intent”, as well as the possible parameters found in “parameters”, the Slack userid found in “user” object which is a part of “originalDetectIntentRequest”, as well as much more such as context details, where the source came from (ours was Slack) and much more.  

The Google Cloud Functions sends a JSON as a response in the form found on the same webpage at https://dialogflow.com/docs/reference/v1-v2-migration-guide-fulfillment at the bottom again under the tab v2.  The response that you want Dialogflow to send as a response to the user should be sent in the “fulfillmentText” object.  You can also designate whether there should be a response from the user, and what context might be added to the next intent from the user.  

## Environment Variables
The environment variables are stored in the entryFunction package in the ‘env.yaml’ file. There are two different sets of environment variables for production and development. When entryFunction is running locally the development set of variables is used, when entryFunction is running on Google Cloud Functions the production set of variables is used. The variables consist of the BASE_URL, SLACK_TOKEN, PROJECT_ID, and LOGGING.
The BASE_URL indicates the URL which entryFunction will use to call the next function; localhost for development and the cloud functions server for production.
SLACK_TOKEN contains the Slack authentication token used by the Ally Slack bot. This token allows the cloud functions to have the Ally slack bot send messages back to the user without ending the function call.
PRJECT_ID is the id of the Google Cloud Ally project.
LOGGING decides whether the cloud functions will log information beyond the time which a function call occurs.
    These environment variables (not the authentication environment variables) are passed along from the entryFunction to other called functions through the calling JSON request. These are passed in the ‘envVar’ object.

|production| |
|-|-|
|BASE_URL|https://us-central1-ally-be86e.cloudfunctions.net/|
|SLACK_TOKEN|[Hidden]|
|PROJECT_ID|ally-be86e|
|LOGGING|false|

|development| |
|-|-|
|BASE_URL|http://localhost:8010/ally-be86e/us-central1/|
|SLACK_TOKEN|[Hidden]|
|PROJECT_ID|ally-be86e|
|LOGGING|true|

## User Recognition
Users are currently recognized based off of the Slack user ID sent along with the original JSON request from Slack to Dialogflow. After Dialogflow calls the Google Cloud Function entryFunction the original request Slack JSON can be accessed from the JSON body from the ‘originalDetectIntentRequest.payload’ object. This is passed along to the getter functions as the ‘slackInfo’ object.
The getter functions pull the authenticated Slack User ID from the ‘slackInfo’ object by using ‘slackInfo.authed_users[0]’ as ‘authed_users’ is an array of the authenticated slack users the only element of which is the user whose request is currently being handled. All queries to the Google Cloud Datastore are indexed by the particular Slack User ID.
Slack API
The first time a user interacts with Ally, their slackID will not yet be known in the database. When this occurs, the setSlackUserID function is called. This function calls the slack API to discover the user’s email address linked to their slackID. Then, the slackID is written to the Datastore entity which owns that email address, thereby linking the slackID to a known user.


## Source Repository
### Mirroring
Google Cloud Functions currently deploys all functions from the Google Cloud Source Repository. This repository is mirrored from a private github repository found at https://github.com/Austin-Schmidli/Ally-AMEXCapstone.
The Google Cloud Source repository should update automatically to changes pushed to the github repository. If it is slow to update you can navigate to the ‘Source Repositories -> Source Code’ section from the Google Cloud Functions Console side bar and re-selecting the repository to mirror from the relevant dropdown menu. You can also use this to switch the currently mirrored branch to a different branch or the currently mirrored repository to a different repository.
### Deploying Cloud Functions from Source Repository

Cloud Functions can be manually re-deployed from the Source Repository by going to the Google Cloud Platform, navigating to ‘Cloud Functions’ on the sidebar, selecting the function which you wish to redeploy and hitting the ‘Refresh’ button. You can force a redeploy from the Google Cloud Platform with the following steps: click on the name of the function you wish to forcefully redeploy, click ‘Edit’ at the top of the page, scroll down and select ‘Save’.

## Security
### Basic Authentication
HTTP basic authentication is used to help ensure that we have received a legitimate webhook call from Dialogflow, and not a spoofed request. Dialogflow natively supports basic authentication. The username and password used for authentication are static and have been manually pre-generated. The credentials are entered in the fulfillment section of Dialogflow.
Since all the cloud functions are publicly accessible webhooks, we have to perform authentication in every function; not just the entryFunction. Cloud functions doesn’t support sharing environment variables between multiple functions, therefore copies of credentials are stored in every function package in the ‘auth.yaml’ file. If the credentials are changed, they must be manually updated in Dialogflow as well as in every cloud function package. We use the ‘yenv’ npm package to read the credentials, and the ‘basic-auth’ npm package to handle the authentication.
### Protecting User Data From Logging
Real user input or user data should never appear in the logs.There is a ‘LOGGING’ environment variable set to true in development and false in production. Any log command which is capable of logging any user input or user data is behind a check on the value of LOGGING. Safe log commands do not need to check this value.

## Gcloud SDK
https://cloud.google.com/sdk/


## Useful Development Tools
Google cloud functions emulator:
https://github.com/GoogleCloudPlatform/cloud-functions-emulator

DataStore emulator:
https://cloud.google.com/datastore/docs/tools/datastore-emulator

GCloud SDK:
https://cloud.google.com/sdk/

Postman:
    https://www.getpostman.com/

    Emulate storage and functions locally to develop and test without deploying code or risking data loss. Cloud functions emulator allows developers to host their functions locally using the command “functions deploy {function name} --trigger-http” -- and debug running functions using “functions inspect {function name}”. Multiple functions can be deployed at the same time allowing for chains of functions to be triggered by other functions. DataStore emulator provides a similar set of functionalities for hosting DataStore databases locally. GCloud SDK provides a CLI for deploying to Cloud Functions and provides other Google cloud functionalities that are also available in the webportal.

