/**
 * Responds to any HTTP request that can provide a "message" field in the body.
 *
 * @param {!Object} req Cloud Function request context.
 * @param {!Object} res Cloud Function response context.
 */
// var axios = require('axios');
var request = require('request');

/*exports.entryFunction = function entryFunction (req, res) {
  var url = 'https://us-central1-ally-be86e.cloudfunctions.net/' + req.body.result.metadata.intentName;
  
  axios.post(url, req.body).then((response, body) => {
    console.log('response:', response);
    res.send(response.body);
  })
  .catch((error) => {
    console.log(error);
  });
};*/

var request = require('request');

const config = require('./package.json')["envirVar"];

exports.entryFunction = function entryFunction (req, res) {
  var url = 'https://us-central1-ally-be86e.cloudfunctions.net/' + req.body.result.metadata.intentName;
  console.log('envVar: ', config);
  request({
    uri : url,
    method : "POST",
  	form : {
      info : req.body.result.parameters
    }
  }, function (error, response, body) {
    console.log('error:', error); // Print the error if one occurred 
    console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received 
    console.log('body:', body); //Prints the response of the request.
    res.send(body);
  });
};