var request = require('request');
var config = require('./config');
var ClientOAuth2 = require('client-oauth2');
var token;

if(config.clientSecret == '' || config.clientId == ''){
    throw new Error("Config not updated.");
}

// Initiate oauth2 client.
var oAuthClient = new ClientOAuth2({
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    accessTokenUri: config.accessTokenUri,
    scopes: ['vehicles', 'locations']
});

// Use client_credentials grant and generate token to be used for making API calls.
oAuthClient.credentials.getToken()
    .then(function(user){
        token = oAuthClient.createToken(user.data.access_token);
        fetchVehicles(token)
    }).catch(function(err){
        console.log("Error while fetching token : ", err);
    });

function fetchVehicles(token){
    // Sign a standard HTTP request object, updating the URL with the access token
    // or adding authorization headers, depending on token type.
    var signed = token.sign({
        method: 'get',
        url: config.domain + '/v1/vehicles'
    });

    request(signed.url, function(err, response, body) {
        if(err){
            console.log("Error while making API call", err);
            return;
        }
        var bodyObj = JSON.parse(body);
        console.log('Fetched vehicles :', bodyObj);
        // Fetch locations of first vehicle received.
        if(bodyObj && bodyObj.data && bodyObj.data[0]){
            fetchLocations(token, bodyObj.data[0].id);
        }
        else{
            console.log("No vehicles added to the system.");
        }
    });
}

function fetchLocations(token, vehicleId){
    signed = token.sign({
        method: 'get',
        url: config.domain + '/v1/vehicles/' + vehicleId + '/locations?from_datetime=' + config.fromDate + '&to_datetime=' + config.toDate
    });
    request(signed.url, function(err, response, body) {
        if(err){
            console.log("Error while making API call", err);
            return;
        }
        console.log('Locations response :', JSON.parse(body));
    });
}
