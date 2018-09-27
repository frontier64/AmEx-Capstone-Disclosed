/**
 * Responds to any HTTP request that can provide a "message" field in the body.
 *
 * @param {!Object} req Cloud Function request context.
 * @param {!Object} res Cloud Function response context.
 */
const Datastore = require('@google-cloud/datastore');
const request = require('request');

exports.getPTO = (req, res) => {
    var slackUserID = req.body.slackInfo.authed_users[0];
    var slackChannelID = req.body.slackInfo.event.channel;
    var slackTeamID = req.body.slackInfo.team_id; //Currently not used
    //var requestedProperty = req.body.queryInfo.userInfo; //userInfo isn't a very descriptive name. Consider changing?
    var projectID = req.body.envVar.PROJECT_ID //(Waiting on environment variable forwarding in order to enable this)

    // Creates a datastore client connection
    const datastore = new Datastore({ projectId: projectID, });

    // Finds user in DB by provided slackid, and finds the band. 
    const bandQuery = datastore
        .createQuery('user')
        .select('band')
        .filter('slackID', '=', slackUserID);

    // Finds user in DB by provided slackid, and finds the serviceyears
    const queryYears = datastore
        .createQuery('user')
        .select('serviceyears')
        .filter('slackID', '=', slackUserID);

    var response;
    datastore.runQuery(bandQuery).then(results => { //queries datastore to get the band element
        var band;

        if (results[0].length == 0) {
            request({
                uri: envVar.BASE_URL + "setUserEmail",
                method: "POST",
                form: {
                    slackUser: slackUserID,
                    envVar: envVar
                }
            });
            response = "Sorry, we don't recognize your slackID. Please try again!";

        }
        else if (results[0].length == 1) { //A single result, as expected.
            band = results[0][0]['band']
            //response = "Your " + requestedProperty + " is " + results[0][0][requestedProperty] + ". SlackID: " + slackUserID + ". ChannelID: " + slackChannelID;

        }
        else { //Query issue. Most likely caused by the query returning more than 1 user. 
            response = "Error: Malformed query of slackID. SlackID query returned " + results[0].length + " results.";
        }


    });

    datastore.runQuery(queryYears).then(results => { //queries datastore to get the yearsserved element
        var yearsServed;

        if (results[0].length == 0) {
            request({
                uri: envVar.BASE_URL + "setUserEmail",
                method: "POST",
                form: {
                    slackUser: slackUserID,
                    envVar: envVar
                }
            });
            response = "Sorry, we don't recognize your slackID. Please try again!";

        }
        else if (results[0].length == 1) { //A single result, as expected.
            yearsServed = results[0][0]['serviceyears']
            //response = "Your " + requestedProperty + " is " + results[0][0][requestedProperty] + ". SlackID: " + slackUserID + ". ChannelID: " + slackChannelID;

        }
        else { //Query issue. Most likely caused by the query returning more than 1 user. 
            response = "Error: Malformed query of slackID. SlackID query returned " + results[0].length + " results.";
        }
    });


    if (band != null && yearsServed != null) {

        //Calculates the accumulated Paid Time Off based on band and yearsServed
        if (band == 20 || band == 25 || band == 30) {

            if (yearsServed > 0 && yearsServed <= 4) {
                response = "Your Paid Time Off is " + yearsServed * 23 + " days.";
            }
            else if (yearsServed > 4 && yearsServed <= 9) {
                response = "Your Paid Time Off is " + ((yearsServed - 4) * 28 + (23 * 4)) + " days.";
            }
            else if (yearsServed > 9 && yearsServed <= 24) {
                response = "Your Paid Time Off is " + ((yearsServed - 9) * 33 + (23 * 4) + (28 * 5)) + " days.";
            }
            else if (yearsServed >= 25) {
                response = "Your Paid Time Off is " + ((yearsServed - 24) * 33 + (23 * 4) + (28 * 5) + (33 * 10)) + " days.";
            }
            else {
                response = "Error: Can't compute Paid Time Off with returned yearsServed value, " + yearsServed + " .";
            }

        }
        else if (band == 35 || band == 40) {

            if (yearsServed > 0 && yearsServed <= 9) {
                response = "Your Paid Time Off is " + (yearsServed * 28) + " days.";
            }
            else if (yearsServed > 9 && yearsServed <= 24) {
                response = "Your Paid Time Off is " + ((yearsServed - 9) * 33 + (9 * 28)) + " days.";
            }
            else if (yearsServed >= 25) {
                response = "Your Paid Time Off is " + ((yearsServed - 24) * 38 + (9 * 28) + (15 * 33)) + " days.";
            }
            else {
                response = "Error: Can't compute Paid Time Off with returned yearsServed value, " + yearsServed + " .";
            }

        }
        else if (band >= 45) {

            if (yearsServed > 0 && yearsServed <= 19) {
                response = "Your Paid Time Off is " + (yearsServed * 33) + " days.";
            }
            else if (yearsServed > 19) {
                response = "Your Paid Time Off is " + ((yearsServed - 19) * 38 + (19 * 33)) + " days.";
            }
            else {
                response = "Error: Can't compute Paid Time Off with returned yearsServed value, " + yearsServed + " .";
            }

        }
        else {
            response = "Error: Can't compute Paid Time Off with returned band value, " + band + " .";
        }
    }
    else {
        response = "Error: One of either band or yearsserved from datastore is null. Band: " + band + ". Years: " + yearsServed + ".";
    }

    //Build and send the response

    res.json({ "fulfillmentText": response });
}