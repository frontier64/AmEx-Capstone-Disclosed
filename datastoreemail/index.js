/**
 * Responds to any HTTP request that can provide a "message" field in the body.
 *
 * @param {!Object} req Cloud Function request context.
 * @param {!Object} res Cloud Function response context.
 */
 
exports.datastoreemail = (req, res) => {
	
 	
  const Datastore = require('@google-cloud/datastore');
  	const projectId = 'ally-be86e';

	// Creates a client
	const datastore = new Datastore({
  		projectId: projectId,
	});
  	
  	const query = datastore
  		.createQuery('Task')
    	.select('emailaddress');
  
  
  	var response;
  	datastore.runQuery(query).then(results => {
  		// Task entities found.
  		const tasks = results[0];
      	response = results[0][0];
      	response = results[0][0]["emailaddress"];
  		console.log('Tasks:');
  		tasks.forEach(task => console.log(task));
      res.setHeader('Content-Type', 'application/json'); //Requires application/json MIME type
 	res.status(200).send(JSON.stringify({ "speech": response, "displayText": response }))
	});
  
  	
  	
};
