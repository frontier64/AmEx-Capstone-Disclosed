/**
 * Responds to any HTTP request that can provide a "message" field in the body.
 *
 * @param {!Object} req Cloud Function request context.
 * @param {!Object} res Cloud Function response context.
 */
const Datastore = require('@google-cloud/datastore');

exports.setSlackUserID = (req, res) => {	
	// Creates a datastore client connection
    const datastore = new Datastore({ projectId: projectID, });
    
    //Use the request information to call the slack API to get the user email address

    //Find the email in the datastore and set the slack user ID
	
    res.setHeader('Content-Type', 'application/json'); //Requires application/json MIME type
    res.status(200).send("Success!")
    return;
}
