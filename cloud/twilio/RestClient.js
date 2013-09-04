/**
 @module RestClient

 This module presents a higher-level API for interacting with resources
 in the Twilio REST API.  Tries to map very closely to the resource structure
 of the actual Twilio API, while still providing a nice JavaScript interface.
 */

//Dependencies
var _ = require('underscore');

//REST API Config Defaults
var userAgentVersion = '0.0.1',
    defaultHost = 'api.twilio.com',
    defaultApiVersion = '2010-04-01';

/**
 The Twilio REST API client
 @constructor
 @param {string} sid - The application SID, as seen in the Twilio portal
 @param {string} tkn - The auth token, as seen in the Twilio portal
 @param {object} options (optional) - optional config for the REST client
 - @member {string} host - host for the Twilio API (default: api.twilio.com)
 - @member {string} apiVersion - the Twilio REST API version to use for requests (default: 2010-04-01)
 */
function RestClient(sid, tkn, options) {
    //Required client config
    if (!sid || !tkn) {
        throw 'RestClient requires an Account SID and Auth Token set explicitly ' +
                'or via the TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables';
    }
    else {
        //if auth token/SID passed in manually, trim spaces
        this.accountSid = sid.replace(/ /g,'');
        this.authToken = tkn.replace(/ /g,'');
    }

    //Optional client config
    options = options || {};
    this.host = options.host || defaultHost;
    this.apiVersion = options.apiVersion || defaultApiVersion;

    //REST Resource - shorthand for just "account" and "accounts" to match the REST API
    var accountResource = require('cloud/twilio/resources/Accounts')(this);
    this.accounts = accountResource;

    //mix the account object in with the client object - assume master account for resources
    _.extend(this,accountResource);

    //SMS shorthand
    this.sendSms = this.accounts.sms.messages.post;
    this.listSms = this.accounts.sms.messages.get;
    this.getSms = function(messageSid, callback) {
        this.accounts.sms.messages(messageSid).get(callback);
    };

    //Calls shorthand
    this.makeCall = this.accounts.calls.post;
    this.listCalls = this.accounts.calls.get;
    this.getCall = function(callSid, callback) {
        this.accounts.calls(callSid).get(callback);
    };
}

/**
 Get the base URL which we'll use for all requests with this client

 @returns {string} - the API base URL
 */
RestClient.prototype.getBaseUrl = function () {
    return 'https://' + this.accountSid + ':' + this.authToken + '@' + this.host + '/' + this.apiVersion;
};

/**
 Make an authenticated request against the Twilio backend.

 @param {object} options - options for HTTP request
 @param {function} callback - callback function for when request is complete
 - @param {object} error - an error object if there was a problem processing the request
 - @param {object} data - the JSON-parsed data
 */
RestClient.prototype.request = function (options, callback) {
    var client = this;

    //Prepare request options
    options.url = client.getBaseUrl() + options.url + '.json';
    options.headers = {
        'Accept':'application/json',
        'User-Agent':'twilio-parse/' + userAgentVersion.version
    };

    // Work with response data
    function handleResponse(parseResponse) {
        if (callback) {
            var data = parseResponse.data;

            // determine if we're dealing with an error by status code
            var error = null;
            if (parseResponse.status < 200 || parseResponse.status > 206) {
                error = {
                    status: parseResponse.status,
                    message: data ? data.message : 'Unable to complete HTTP request',
                    data: data && data.code,
                    moreInfo: data && data.more_info
                };
            }

            //process data and make available in a more JavaScripty format
            function processKeys(source) {
                if (_.isObject(source)) {
                    Object.keys(source).forEach(function(key) {

                        //Supplement underscore values with camel-case
                        if (key.indexOf('_') > 0) {
                            var cc = key.replace(/_([a-z])/g, function (g) {
                                return g[1].toUpperCase()
                            });
                            source[cc] = source[key];
                        }

                        //process any nested arrays...
                        if (Array.isArray(source[key])) {
                            source[key].forEach(processKeys);
                        }
                        else if (_.isObject(source[key])) {
                            processKeys(source[key]);
                        }
                    });

                    //Look for and convert date strings for specific keys
                    ['startDate', 'endDate', 'dateCreated', 'dateUpdated', 'startTime', 'endTime'].forEach(function(dateKey) {
                        if (source[dateKey]) {
                            source[dateKey] = new Date(source[dateKey]);
                        }
                    });
                }
            }
            processKeys(data);

            callback.call(client, error, data);
        }
    }

    // Initiate HTTP request with Parse's HTTP client
    Parse.Cloud.httpRequest({
        method: options.method,
        url: options.url,
        headers:options.headers,
        body: options.body||{},
        params:options.params||{},
        success: handleResponse,
        error: handleResponse
    });
};

module.exports = RestClient;
