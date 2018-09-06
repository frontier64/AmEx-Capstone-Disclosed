/**
 * Responds to any HTTP request that can provide a "message" field in the body.
 *
 * @param {!Object} req Cloud Function request context.
 * @param {!Object} res Cloud Function response context.
 */
 
exports.dataTest = (req, res) => {
	const Datastore = require('@google-cloud/datastore');
  	const projectId = 'ally-be86e';
  	

	// Creates a client
	const datastore = new Datastore({
  		projectId: projectId,
	});

  	// The kind for the new entity
	const kind = 'test';
	// The name/ID for the new entity
	const name = 'testTask';
	// The Cloud Datastore key for the new entity
	const taskKey = datastore.key([kind, name]);

	// Prepares the new entity
	const task = {
  		key: taskKey,
  		data: {
    		description: req.body.message,
  		},
	};

	// Saves the entity
	datastore
  	.save(task)
  	.then(() => {
    	console.log(`Saved ${task.key.name}: ${task.data.description}`);
 	})
 	.catch(err => {
 		console.error('ERROR:', err);
 	});
  
  	// Query
  	var response;
  	const query = datastore.createQuery('Task').select('emailaddress');
  	datastore.runQuery(query).then(results => {
     	response = results;
    });
 	
  
  	res.setHeader('Content-Type', 'application/json'); //Requires application/json MIME type
 	res.status(200).send(JSON.stringify({ "speech": response, "displayText": response }));
  	
};
