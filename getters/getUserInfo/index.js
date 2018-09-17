/**
 * Responds to any HTTP request that can provide a "message" field in the body.
 *
 * @param {!Object} req Cloud Function request context.
 * @param {!Object} res Cloud Function response context.
 */
const Datastore = require('@google-cloud/datastore');
const projectId = 'ally-be86e';

exports.getUserInfo = (req, res) => {
	var slackUserID = req.body.info.slack_user_id;
	var slackChannelID = req.body.info.slack_channel;
	var requestedProperty = req.body.info.userInfo; //userInfo isn't a very descriptive name. Consider changing?
	//var projectID = req.body.env.projectID (Waiting on environment variable forwarding in order to enable this)
	
	// Creates a datastore client connection
	const datastore = new Datastore({ projectId: projectId, });
	
	// Finds user in DB by provided slackid, and finds the requestedProperty. 
	const datastoreQuery = datastore
		.createQuery('user')
	 	.select(requestedProperty)
		.filter('slackID','=',slackUserID);
	
	datastore.runQuery(datastoreQuery).then(results => {
		var response; 
	
		if(results[0].length == 0) {
			//SlackID was not found in the Datastore. 
			//TODO: Slack Authentication
			response = "Sorry, we don't recognize your slackID."; //Temporary
			
		} 
		else if (results[0].length == 1){ //A single result, as expected.
			response = "Your " + requestedProperty + " is " + results[0][0][requestedProperty] + ". SlackID: " + slackUserID + ". ChannelID: " + slackChannelID;
		
		} 
		else { //Query issue. Most likely caused by the query returning more than 1 user. 
			response = "Error: Malformed query of slackID. SlackID query returned " + results[0].length + " results.";
		}
		
		//Build and send the response
	
		res.setHeader('Content-Type', 'application/json'); //Requires application/json MIME type
		res.status(200).send(JSON.stringify({"fulfillmentText": text_response}))
		return;
	});
}
