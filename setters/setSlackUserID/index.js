/**
 * Responds to any HTTP request that can provide a "message" field in the body.
 *
 * @param {!Object} req Cloud Function request context.
 * @param {!Object} res Cloud Function response context.
 */
const Datastore = require('@google-cloud/datastore');
const request = require('request');

exports.setSlackUserID = (req, res) => {	
    var projectID = req.envVar.PROJECT_ID;
    //Let the user know that we have to update their information
    request({
        url: "https://slack.com/api/chat.postMessage",
        method: "POST",
        headers: {
            "Authorization" : "Bearer " + req.envVar.SLACK_TOKEN,
            "Content-type" : "application/json"
        },
        body: {
            "text" : "I couldn't find your SlackID in the database so I'm updating it now!",
            "channel" : req.slackChannel
        }
    }, function (error, response, body) {
        if (!response.ok){
            console.log(error);
        }
    });

    //Update the user's information
    request({
        url: "https://slack.com/api/users.info?user=" + req.slackUser,
        method: "GET",
        headers: {
            "Authorization" : "Bearer " + req.envVar.SLACK_TOKEN
        }
    }, function (error, response, body){
        var userEmail = body.user.profile.email;
        if (userEmail){
            //Add the slack user ID to the DB
            // Creates a datastore client connection
            const datastore = new Datastore({ projectId: projectID, });
            console.log("Adding " + userEmail + "'s slackID");
        }

        //Add error handling here
    });
    res.json("Success!")
}
