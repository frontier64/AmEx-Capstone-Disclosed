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

  if (req.body.query == null){
    slackConnected = false;
  }
  var userId;
	var getInfo;
  var channelId;
	var slackConnected = true;
	//Idk what this would entail. Is this just a basic call without a previous call to dialogflow? 
	//	Either way it should be checked for.
	//UserID is not unique. Need both slack_channel and slack_user_id
  if (slackConnected){
  	var userId = req.body.query.slack_user_id;
  	channelId = req.body.query.slack_channel;
  	if (userId == null || channelId == null){
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
	res.status(200).send(JSON.stringify({ "speech": text_response, "displayText": text_response}))
	});
};
