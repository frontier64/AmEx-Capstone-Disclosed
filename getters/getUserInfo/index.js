/**
 * Responds to any HTTP request that can provide a "message" field in the body.
 *
 * @param {!Object} req Cloud Function request context.
 * @param {!Object} res Cloud Function response context.
 */
const Datastore = require('@google-cloud/datastore');
const request = require('request');

exports.getUserInfo = (req, res) => {
	var slackUserID = req.body.slackInfo.authed_users[0];
	var slackChannelID = req.body.slackInfo.event.channel;
	var slackTeamID = req.body.slackInfo.team_id; //Currently not used
	var requestedProperty = req.body.queryInfo.userInfo; //userInfo isn't a very descriptive name. Consider changing?
	var projectID = req.body.envVar.PROJECT_ID //(Waiting on environment variable forwarding in order to enable this)
	
	// Creates a datastore client connection
	const datastore = new Datastore({ projectId: projectID, });
	
	// Finds user in DB by provided slackid, and finds the requestedProperty. 
	const datastoreQuery = datastore
		.createQuery('user')
	 	.select(requestedProperty)
		.filter('slackID','=',slackUserID);
	
	datastore.runQuery(datastoreQuery).then(results => {
		var response; 
	
		if(results[0].length == 0) {
			request({
				uri: envVar.BASE_URL + "setUserEmail",
				method: "POST",
				form: {
					slackUser : slackUserID,
					slackChannel: slackChannelID,
					envVar: envVar 
				}
			});
			response = "Sorry, we don't recognize your slackID. Please try again!";
			
		} 
		else if (results[0].length == 1){ //A single result, as expected.
			response = "Your " + requestedProperty + " is " + results[0][0][requestedProperty] + ". SlackID: " + slackUserID + ". ChannelID: " + slackChannelID;
		
		} 
		else { //Query issue. Most likely caused by the query returning more than 1 user. 
			response = "Error: Malformed query of slackID. SlackID query returned " + results[0].length + " results.";
		}
		
		//Build and send the response
		res.json({"fulfillmentText": response});
	});
}
