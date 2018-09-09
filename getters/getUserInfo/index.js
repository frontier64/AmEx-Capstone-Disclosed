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
  var getInfo = req.body.info.userInfo
  var userId = req.body.info.slack_user_id
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
      res.setHeader('Content-Type', 'application/json'); //Requires application/json MIME type
 	res.status(200).send(JSON.stringify({ "speech": "user with id: " + userId + " your " + getInfo + " is " + response, "displayText": "user with id: " + userId + " your " + getInfo + " is " + response }))
	});
};
