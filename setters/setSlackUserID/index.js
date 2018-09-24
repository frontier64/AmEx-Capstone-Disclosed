/**
 * Responds to any HTTP request that can provide a "message" field in the body.
 *
 * @param {!Object} req Cloud Function request context.
 * @param {!Object} res Cloud Function response context.
 */
 const Datastore = require('@google-cloud/datastore');
 const request = require('request');

 exports.setSlackUserID = (req, res) => {	
    var projectID = req.body.envVar.PROJECT_ID;
    //Let the user know that we have to update their information
    /*
    request({
        url: "https://slack.com/api/chat.postMessage",
        method: "POST",
        headers: {
            "Authorization" : "Bearer " + req.body.envVar.SLACK_TOKEN,
            "Content-type" : "application/json"
        },
        body: {
            "text" : "I couldn't find your SlackID in the database so I'm updating it now!",
            "channel" : req.body.slackChannel
        }
    }, function (error, response, body) {
        if (error) {
            console.log(error);
        }
    });*/

    //Update the user's information
    request({
        url: "https://slack.com/api/users.info?user=" + req.body.slackUser,
        method: "GET",
        headers: {
            "Authorization" : "Bearer " + req.body.envVar.SLACK_TOKEN
        }
    }, function (error, response, body){
        if (error) {
            console.log(error);
        }
        //console.log('RESPONSE: ' + response);
        console.log('BODY: ' + body);

        var userEmail = body.user.profile.email;
        var slackUserID = req.body.slackInfo.authed_users[0];

        if (userEmail && slackUserID) {
            //Add the slack user ID to the DB
            console.log("Adding " + userEmail + "'s slackID");
            
            // Creates a datastore client connection
            const datastore = new Datastore({ projectId: projectID, });

            const userQuery = datastore
            .createQuery('user')
            .filter('email','=',userEmail);

            datastore.runQuery(userQuery, function(err, results) {
                if(err) {
                    console.log(err);
                }

                if(results[0].length == 1) { //Only 1 result allowed in case of duplicate email (shouldn't happen anyway)
                    var userEntity = results[0];
                    userEntity.slackID = slackUserID;

                    datastore //Saving updated entity to Datastore
                    .save(userEntity)
                    .then(() => {
                        console.log('Associated ' + userEmail + ':' + slackUserID);
                    })
                    .catch(err => {
                        console.error('ERROR:', err);
                   });
                }
            });
        }
    });
    res.json("Success!")
}
