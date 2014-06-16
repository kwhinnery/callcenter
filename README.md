callcenter
==========

A call center in the Cloud, powered by Twilio and Parse.


# Dependencies

- [Twilio Node](http://twilio.github.io/twilio-node/): A Twilio library for Node.js.
- [Parse](https://www.parse.com):  A cloud platform as a service for hosting Node.js and REST services.


# Installation

### Get a Twilio account and copy your keys to the app configuration file

- To run this demo, you'll need a Twilio account. Setting up a Twilio account is beyond the scope of this demo, so see [Twilio's website](http://twilio.com) for details.

- Copy cloud/config.js.save to cloud/config.js, and copy your accountSid and authToken from the Twilio dashboard into config.js.

```javascript
	module.exports = {
	    twilio: {
	        accountSid:'your twilio account SID',
	        authToken:'your twilio auth token'
	    }
	};
```

### Create a Parse account and Parse app

- You'll also need a Parse account. To sign up with Parse, just create a free account and then follow the "Cloud Code" instructions to [install the Parse SDK](https://www.parse.com/apps/quickstart?app_id=synclio#cloud_code/unix). This link assumes you're on a Mac or Linux, but there are instructions for other platforms too.

- From the dashboard, make sure you create an app on Parse. You can name the app whatever you want. 

- In the dashboard for your app, go to the "Settings" tab and click "Web hosting". Enter a subdomain for your app at parse.com, so your URL would be `http://<YOURAPPNAME>.parseapp.com`.


###Configure Twilio to make POST requests to this app on inbound calls

- In the Twilio "Manage Numbers" dashboard, either add a new number or pick an unused number in your account, and change the "Voice" RequestUrl to: `http://<YOURAPPNAME>.parseapp.com/callcenter`


###Copy Parse keys into the app configuration files and deploy to Parse

- Next, copy the config/global.json.save file to config/global.json. In the Parse dashboard, click the "Application keys" tab. Copy the Application ID and JavaScript Key into global.json.

```javascript
{
    "applications": {
        "CallCenter": {
            "applicationId": "CHANGE_ME", 
            "masterKey": "CHANGE_ME"
        }, 
        "_default": {
            "link": "CallCenter"
        }
    }, 
    "global": {
        "parseVersion": "1.2.9"
    }
}
```

- Copy those same two keys into the client-side JavaScript in public/js/app.js. Replace the first value with the Application ID and replace the second value with the JavaScript Key.

```javascript
    // Initialize Parse SDK
    Parse.initialize(
        'Sal1JgAk0sGivZ6ZTCcyXQRD0PH9liu9dF0NIi89', 
        'InL6lqNZj7f2lxyyviocQeDZrbFZYSCORj2Goo8E'
    );
```

- Run the following command from the root of the project to deploy the app to Parse:

```
$ parse deploy
```

- You should be able to load the app at `http://<YOURAPPNAME>.parseapp.com` and see a login page.  


### Create users

Since you have no users yet, you'll need to create them. Open the developer tools console in the browser for the `http://<YOURAPPNAME>.parseapp.com` page, and run the following JavaScript code:

```javascript
Parse.User.signUp('agent007', 'password');
Parse.User.signUp('penny', 'password');
```

### Login to the demo app and try it out

- Next, login to your browser with one of the usernames and passwords. When successful, you'll see a welcome page asking if you're available to take calls.

- Click the "Yes!" radio button. 

- Make a call from a PSTN phone number to the Twilio number. Assuming all is well, you should hear the Twilio ringtone in your browser, as well as the WebRTC getUserMedia Allow/Deny permission dialog. Click "Allow" to answer the call.

### Troubleshooting

- You can make curl requests to the Parse app to test the logic independently of Twilio.
- See the Twilio logs and Twilio dev tools to see if Twilio is able to reach your app successfully.
- See the Parse logs from your app dashboard to see what might be happening on the Parse app.


