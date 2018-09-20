/**
 * Responds to any HTTP request that can provide a "message" field in the body.
 *
 * @param {!Object} req Cloud Function request context.
 * @param {!Object} res Cloud Function response context.
 */
const request = require('request');
const yenv = require('yenv');
var auth = require('basic-auth');

exports.entryFunction = function entryFunction (req, res) {
  console.log('Received Request Body: ' + JSON.stringify(req.body));
  
  //Environment variable handling
  if (process.env.NODE_ENV !== 'production') {
    process.env.NODE_ENV = 'development'
  }
  const env = yenv();

  //Authentication
  var credentials = auth(req);
  if (!credentials || credentials.name !== env.AUTH_USERNAME || credentials.pass !== env.AUTH_PASSWORD) {
    res.statusCode = 401;
    res.send('Access denied');
  }

  //Could be changed so that intent names are stored in the env vars but this works for now since they are only used here
  var intentName = "";
  switch (req.body.queryResult.intent.displayName) {
    case "getUserInfo":
      intentName = "getUserInfo";
      break;
    default:
      res.statusCode = 404;
      res.send("Not found");
  }
  
  //Request handling
  var url = env.BASE_URL + intentName;
  request({
    uri : url,
    method : "POST",
  	form : {
      queryInfo: req.body.queryResult.parameters,
      slackInfo: req.body.originalDetectIntentRequest.payload,
      envVar: env
    }
  }, function (error, response, body) {
    console.log('error:', error); // Print the error if one occurred 
    console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received 
    console.log('body:', body); //Prints the response of the request.
    res.send(body);
  });
};