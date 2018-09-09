/**
 * Responds to any HTTP request that can provide a "message" field in the body.
 *
 * @param {!Object} req Cloud Function request context.
 * @param {!Object} res Cloud Function response context.
 */
const request = require('request');
const yenv = require('yenv');

exports.entryFunction = function entryFunction (req, res) {
  if (process.env.NODE_ENV !== 'production') {
    process.env.NODE_ENV = 'development'
  }

  const env = yenv();
  var url = env.BASE_URL + req.body.intent.displayName;

  request({
    uri : url,
    method : "POST",
  	form : {
      info: req.body.outputContexts[0].parameters
    }
  }, function (error, response, body) {
    console.log('error:', error); // Print the error if one occurred 
    console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received 
    console.log('body:', body); //Prints the response of the request.
    res.send(body);
  });
};
