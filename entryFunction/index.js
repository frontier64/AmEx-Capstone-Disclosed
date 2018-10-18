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
        res.statusCode = 401;
        res.send('Access denied');
    }
    
    //Could be changed so that intent names are stored in the env vars but this works for now since they are only used here
    var getter_function = "";
    var infoType = "";
    switch (req.body.queryResult.intent.displayName) {
        
        //Getter intents
        case "getUserInfo":
            switch(req.body.queryResult.parameters.userInfo){
                case "pto":
                    getter_function = "getPTO";
                    break;
                case "email":
                case "name":
                case "serviceyears":
                case "employeestatus":
                case "address":
                    getter_function = "getUserInfo";
                    break;
            }
            break;
        
        //Setter intents
        case "setUserInfo":
            getter_function = "setUserInfo";
            infoType = req.body.queryResult.intent.displayName.substring(4);
            req.body.queryResult.parameters.userInfo = infoType;
            break;
        
        default:
            res.statusCode = 404;
            res.send({"fulfillmentText" : "I'm not sure what information you're asking for."});
        
    }
    //Request handling
    var url = env.BASE_URL + getter_function;
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
        //If we run into an error 
        if (response.statusCode >= 300 || response.statusCode < 200) {
            body = {"fulfillmentText": "I ran into a problem while trying to answer your question. Please try again."};
        }
        res.send(body);
    });
};