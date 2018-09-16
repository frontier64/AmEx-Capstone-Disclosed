/**
 * Responds to any HTTP request that can provide a "message" field in the body.
 *
 * @param {!Object} req Cloud Function request context.
 * @param {!Object} res Cloud Function response context.
 */
const Datastore = require('@google-cloud/datastore');
const projectId = 'ally-be86e';

exports.getUserInfo = (req, res) => {
	// Creates a client
	const datastore = new Datastore({
		projectId: projectId,
	});

	var slackConnected = true;
	var userId;
	var getInfo = req.body.queryInfo.userInfo;
	var channelId;
	if (req.body.query == undefined || req.body.query == null){
		slackConnected = false;
	}
	//Idk what this would entail. Is this just a basic call without a previous call to dialogflow? 
	//	Either way it should be checked for.
	//UserID is not unique. Need both slack_channel and slack_user_id
	if (slackConnected){
		userId = req.body.slackInfo.authed_users[0];
		channelId = req.body.slackInfo.event.channel;
		teamId = req.body.slackInfo.team_id;
		if (userId == undefined || channelId == undefined || teamId == undefined){
			slackConnected = false;
		}
	}

	const query = datastore
		.createQuery('Task')
	 	.select(getInfo);

	var response;
	datastore.runQuery(query).then(results => {
	// Task entities found.
	const tasks = results[0];
	response = results[0][0];
	response = results[0][0][getInfo];
	console.log('Tasks: ' + JSON.stringify(results));
	tasks.forEach(task => console.log(task));
	var text_response;
	if (slackConnected = true){
		text_response = "user with id: " + userId + " your " + getInfo + " is " + response;
	} else {
		text_response = "your " + getInfo + " is " + response;
	}
	res.setHeader('Content-Type', 'application/json'); //Requires application/json MIME type
	res.status(200).send(JSON.stringify({"fulfillmentText": text_response}))
	return;
	});
};
