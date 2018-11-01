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

exports.getPTO = (req, res) => {
    //Authentication
    const authEnv = yenv('auth.yaml');

    var credentials = auth(req);
    if (!credentials || credentials.name !== authEnv.AUTH_USERNAME || credentials.pass !== authEnv.AUTH_PASSWORD) {
        res.statusCode = 401;
        res.json(401, {"fulfillmentText":"Sorry, you don't have permission to access this resource."});
    }

    var slackUserID = req.body.slackInfo.authed_users[0];
    var projectID = req.body.envVar.PROJECT_ID; //(Waiting on environment variable forwarding in order to enable this)
    var logging = req.body.envVar.LOGGING;

    // Creates a datastore client connection
    const datastore = new Datastore({ projectId: projectID, });

    // Query to gather band and serviceyears of the user.
    const userQuery = datastore.createQuery('user')
        .select(['band', 'serviceyears'])
        .filter('slackID', '=', slackUserID);

    datastore.runQuery(userQuery).then(results => {    
        var band = results[0][0]['band'];
        var yearsServed = results[0][0]['serviceyears'];
        var response;

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
            response = "Sorry, it looks like I don't have that information. Please contact an administrator to update your information.";
            if (logging) {
                console.log("Error: One of either band or years served from datastore is null. Bands: " + band + ". Years: " + yearsServed + ".");
            }
        }

        //Build and send the response
        res.json({ "fulfillmentText": response });
    });
}
