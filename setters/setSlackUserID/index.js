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

 exports.setSlackUserID = (req, res) => {	
     //Authentication
    const authEnv = yenv('auth.yaml');
    var credentials = auth(req);
    if (!credentials || credentials.name !== authEnv.AUTH_USERNAME || credentials.pass !== authEnv.AUTH_PASSWORD) {
        res.json(401, "Sorry, you don't have permission to access this resource.");
    }

    const projectID = req.body.envVar.PROJECT_ID;
    const logging = req.body.envVar.LOGGING;

    if(!req.body.slackChannel || !req.body.slackUser) {
        res.json(400, {msg: "I think you forgot to send me some information. Try again?"});
    }

    //Let the user know that we have to update their information
    request({
        url: "https://slack.com/api/chat.postMessage",
        method: "POST",
        headers: {
            "Authorization" : "Bearer " + req.body.envVar.SLACK_TOKEN,
            "Content-type" : "application/json"
        },
        form: {
            "text" : "I couldn't find your SlackID in the database so I'm updating it now!" + 
                " I'll let you know when I'm done and then you can ask again",
            "channel" : req.body.slackChannel
        }
    }, function (error, response, body) {
        if (logging) {   
            if (error) {
                console.log(error);
            }
            else {
                console.log("message sent to user: " + body);
            }
        }
    });

    //Update the user's information in the DB
    request({
        url: "https://slack.com/api/users.info?user=" + req.body.slackUser,
        method: "GET",
        headers: {
            "Authorization" : "Bearer " + req.body.envVar.SLACK_TOKEN
        }
    }, function (error, response, body){
        if (error && logging) {
            console.log(error);
        }

        const jsb = JSON.parse(body);
        var userEmail = jsb.user.profile.email;
        var slackUserID = jsb.user.id;

        if (userEmail && slackUserID) {
            //Add the slack user ID to the DB
            if (logging)
                console.log("Adding " + userEmail + "'s slackID");

            // Creates a datastore client connection
            const datastore = new Datastore({ projectId: projectID, });

            const userQuery = datastore
            .createQuery('user')
            .filter('email','=',userEmail);

            datastore.runQuery(userQuery).then(results => {
                if (logging)
                    console.log('setSlackUserID - query ran, found ' + results[0].length);

                if(results[0].length == 1) { //Only 1 result allowed in case of duplicate email (shouldn't happen anyway)
                    var userEntity = results[0];
                    userEntity[0]['slackID'] = slackUserID; //Sets the new slackID

                    datastore //Saving updated entity to Datastore
                    .save(userEntity)
                    .then(() => {
                        if (logging)
                            console.log('Success setSlackUserID - Associated slackID');
                        request({
                            url: "https://slack.com/api/chat.postMessage",
                            method: "POST",
                            headers: {
                                "Authorization" : "Bearer " + req.body.envVar.SLACK_TOKEN,
                                "Content-type" : "application/json"
                            },
                            form: {
                                "text" : "Alright, I'm ready. Ask me your question again!",
                                "channel" : req.body.slackChannel
                            }
                        }, function (error, response, body) {
                            if (error) {
                                if (logging)
                                    console.log(error);
                                else
                                    console.log("message sent to user: " + body);
                            }
                        });
                        res.json(200, {msg : "I updated your email."});
                    })
                    .catch(err => {
                        if (logging)
                            console.error('Error setSlackUserID - DS Save Error: ', err);
                        res.json(500, { msg: "I'm having trouble storing your information. Please try again."});
                   });
                }
            });
        }
        else {
            res.json(400, { msg: "I couldn't get your email or slack ID." });
        }
    });
}
