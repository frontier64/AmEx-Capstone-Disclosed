/**
 * Responds to any HTTP request that can provide a "message" field in the body.
 *
 * @param {!Object} req Cloud Function request context.
 * @param {!Object} res Cloud Function response context.
 */
const Datastore = require('@google-cloud/datastore');
const request = require('request');
const yenv = require('yenv');
const auth = require('basic-auth');

exports.getUserInfo = (req, res) => {
    //Authentication
    const authEnv = yenv('auth.yaml');
    var credentials = auth(req);
    if (!credentials || credentials.name !== authEnv.AUTH_USERNAME || credentials.pass !== authEnv.AUTH_PASSWORD) {
        res.json(401, {"fulfillmentText": "Sorry, you don't have permission to access this resource."});
        console.log("getUserInfo - Authentication failure");
    }
    
    if (!req.body.slackInfo || !req.body.queryInfo) {
        res.json(400, {"fulfillmentText": "I think you forgot to send me some information. Try again?"});
        console.log("getUserInfo - Request missing slack information or query information");
    }
    
    var slackUserID = req.body.slackInfo.authed_users[0];
    var slackChannelID = req.body.slackInfo.event.channel;
    var requestedProperty = req.body.queryInfo.userInfo; //userInfo isn't a very descriptive name. Consider changing?
    var projectID = req.body.envVar.PROJECT_ID; 
    var logging = req.body.envVar.LOGGING;
    var envVar = req.body.envVar;

    //Validating requestedProperty
    const validProperties = ["address", "band", "city", "country", "email", "employeestatus", "name", "serviceyears", "slackID", "state", "zip"];
    if (validProperties.indexOf(requestedProperty) < 0) {
        //requestedProperty is invalid
        res.json(400, {"fulfillmentText": "Sorry, I can't find that information."});
        console.log("getUserInfo - Invalid property requested");
    }
    
    // Creates a datastore client connection
    const datastore = new Datastore({ projectId: projectID});
    
    // Finds user in DB by provided slackid, and finds the requestedProperty. 
    const datastoreQuery = datastore
        .createQuery('user')
        .select(requestedProperty)
        .filter('slackID','=',slackUserID);
    datastore.runQuery(datastoreQuery).then(results => {
        var response; 
    
        if(results[0].length === 0) {
            const authHeader = "Basic " + new Buffer(credentials.name + ":" + credentials.pass).toString('base64');
            request({
                uri: envVar.BASE_URL + "setSlackUserID",
                headers: {
                    Authorization: authHeader
                },
                method: "POST",
                form: {
                    slackUser : slackUserID,
                    slackChannel: slackChannelID,
                    envVar: envVar 
                }
            });            
        } 
        else if (results[0].length === 1 && results[0][0][requestedProperty] !== ""){ //A single result, as expected.
            response = "Your " + requestedProperty + " is " + results[0][0][requestedProperty];
            /*". SlackID: " + slackUserID + ". ChannelID: " + slackChannelID;*/
        
        } 
        else { //Query issue. Most likely caused by the query returning more than 1 user. 
            response = "Sorry I wasn't able to get your " + requestedProperty + ". You may need to contact an administrator.";
            if(logging) {
                console.log("getUserInfo - Malformed query of slackID. SlackID query returned " + results[0].length + " results.");
            }
        }
        
        //Build and send the response
        res.json({ "fulfillmentText": response});
    }).catch((err) => {
        console.log("getUserInfo - Standard error");
        if(logging) {
            console.log(err);
        }
        res.json(500, {"fulfillmentText" :"Sorry, I ran into a problem while trying to get your information."});
    });
}
