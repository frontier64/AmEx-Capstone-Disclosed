/**
* Responds to any HTTP request that can provide a "message" field in the body.
*
* @param {!Object} req Cloud Function request context.
* @param {!Object} res Cloud Function response context.
*/
const request = require('request');
const yenv = require('yenv');
const auth = require('basic-auth');

exports.entryFunction = function entryFunction (req, res) {
    //Environment variable handling
    if (process.env.NODE_ENV !== 'production') {
        process.env.NODE_ENV = 'development'
    }
    const env = yenv('env.yaml');
    const authEnv = yenv('auth.yaml');
    
    if (env.LOGGING) {
        console.log('Received Request Body: ' + JSON.stringify(req.body));
    }

    //Authentication
    var credentials = auth(req);
    if (!credentials || credentials.name !== authEnv.AUTH_USERNAME || credentials.pass !== authEnv.AUTH_PASSWORD) {
        res.json(401, "Sorry, you don't have permission to access this resource.");
    }
    
    //Could be changed so that intent names are stored in the env vars but this works for now since they are only used here
    var callingFunction = "";

    if (!req.body.queryResult) {
        res.json(400, {"fulfillmentText": "Looks like there was a problem with your question. Try again."});
    }

    //Determine which function to route to based on intent. Pass entities to functions to be handled.
    switch (req.body.queryResult.intent.displayName) {
        case "getUserInfo":
            callingFunction = "getUserInfo";
            break;
        case "get_pto":
            callingFunction = "getPTO";
            break;
        case "setUserInfo":
            callingFunction = "setUserInfo";
            break;
        default:
            res.json(404, {"fulfillmentText" : "I'm not sure what information you're asking for."});
        
    }
    //Request handling
    var url = env.BASE_URL + callingFunction;
    const authHeader = "Basic " + new Buffer(credentials.name + ":" + credentials.pass).toString('base64');
    request({
        uri: url,
        headers: {
            Authorization: authHeader
        },
        method : "POST",
        form : {
            queryInfo: req.body.queryResult.parameters,
            slackInfo: req.body.originalDetectIntentRequest.payload,
            envVar: env
        }
    }, function (error, response, body) {
        if (env.LOGGING) {
            console.log('error:', error); // Print the error if one occurred 
            console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received 
            console.log('body:', body); //Prints the response of the request.
        }
        res.json(response.statusCode, JSON.parse(body));
    });
};