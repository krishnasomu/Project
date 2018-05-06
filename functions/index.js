'use strict';
const functions = require('firebase-functions'); // Cloud Functions for Firebase library
const firebaseAdmin = require('firebase-admin');
const DialogflowApp = require('actions-on-google').DialogflowApp; // Google Assistant helper library
//firebaseAdmin.initializeApp(functions.config().firebase);
firebaseAdmin.initializeApp({
  databaseURL: "https://booming-cosine-188305-1e6db.firebaseio.com"
}).firebase;
const firebase = firebaseAdmin.database();
  //firebase.initializeApp(config);
exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));
  if (request.body.result) {
    processV1Request(request, response);
  } else if (request.body.queryResult) {
    processV2Request(request, response);
  } else {
    console.log('Invalid Request');
    return response.status(400).end('Invalid Webhook Request (expecting v1 or v2 webhook request)');
  }
});
exports.SPTZoneBotFulFillment = functions.https.onRequest((request, response) => {
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));
  // An action is a string used to identify what needs to be done in fulfillment
  let action = (request.body.queryResult.action) ? request.body.queryResult.action : 'default';
  // Parameters are any entites that Dialogflow has extracted from the request.
  let parameters = request.body.queryResult.parameters || {}; // https://dialogflow.com/docs/actions-and-parameters
  // Contexts are objects used to track and store conversation state
  let inputContexts = request.body.queryResult.contexts; // https://dialogflow.com/docs/contexts
  // Get the request source (Google Assistant, Slack, API, etc)
  let requestSource = (request.body.originalDetectIntentRequest) ? request.body.originalDetectIntentRequest.source : undefined;
  // Get the session ID to differentiate calls from different users
  let session = (request.body.session) ? request.body.session : undefined;
  // Create handlers for Dialogflow actions as well as a 'default' handler
  const actionHandlers = {
    // The default fallback intent has been matched, try to recover (https://dialogflow.com/docs/intents#fallback_intents)
    'welcome': () => {
        console.log("creating database object");
        /*
        var database = firebase.database('booming-cosine-188305-1e6db');
        console.log("creating database ref object");
        */
        var ref = firebase.ref('sptz/visitors/' + session);
        console.log("creating JSON object");
        var obj = {"name":parameters['introducer']};
        console.log("pushing JSON object to DB");
        ref.push(obj);
        console.log("successfully JSON object inserted");
      // Use the Actions on Google lib to respond to Google requests; for other requests use JSON
      sendResponse('Hello ' + parameters['introducer'] + ', Can you please give us your phone number ? ?? '); // Send simple response to user
    },
    'phonenumber': () => {
      console.log("creating database object");
      /*
      var database = firebase.database('booming-cosine-188305-1e6db');
      console.log("creating database ref object");
      */
      var ref = firebase.ref('sptz/visitors/' + session);
      console.log("creating JSON object for phone number");
      var obj = {"phone":parameters['phone-number']};
      console.log("pushing JSON object to DB");
      ref.push(obj);
      console.log("successfully JSON object inserted");
    // Use the Actions on Google lib to respond to Google requests; for other requests use JSON
    sendResponse('Hello ' + parameters['introducer'] + ', How may i help you ? ?? '); // Send simple response to user
  },
  // The default fallback intent has been matched, try to recover (https://dialogflow.com/docs/intents#fallback_intents)
    'get-details': () => {
      // Use the Actions on Google lib to respond to Google requests; for other requests use JSON
      console.log("my-action: " + parameters['my-action']);
      var member_name = parameters['family-member'];
      var member_info = parameters['member-info'];
      //request.body.session+'/contexts/something'} 
      var objOutputContexts = JSON.parse('{"outputContexts" : [{"name":"' + request.body.session + '/contexts/my-context", "lifespanCount":10, "parameters":{}}]}');

      console.log("member_name: " + member_name);
      console.log("member_info: " + member_info);
      
      if(member_name===null || member_name===''){
        console.log("member_name is empty, so reading value from 'member-name' parameter");
        member_name = parameters['member-name'];
      }

      if(member_info===null || member_info===''){
        console.log("member_info is empty, so reading value from 'my-action' parameter");
        member_info = parameters['my-action'];
      }

      objOutputContexts["outputContexts"][0].parameters["family-member"] = member_name;
      objOutputContexts["outputContexts"][0].parameters["member-info"] = member_info;

      if(member_name===null && member_info===null){
        //objOutputContexts.fulfillmentText = 'Sorry, i did not get you question.  Can you reframe your question again ?';
        console.log(objOutputContexts.stringify);
        sendResponse(objOutputContexts);
      }else if(member_name===null){
        objOutputContexts.fulfillmentText = 'Whose ' + member_info + ' you would like to know ?';
        console.log(objOutputContexts.stringify);
        sendResponse(objOutputContexts);
      }else if(member_info===null){
        objOutputContexts.fulfillmentText = 'What would you like to know about ' + member_name + '?';
        console.log(objOutputContexts.stringify);
        sendResponse(objOutputContexts);
      }

      console.log("executing firebase query with member_name(" + member_name + ") and member_info(" + member_info + ")");

      var ref = firebase.ref('mydb/family/' + member_name + '/' + member_info);
      ref.orderByKey().on("value", function(snapshot) {
        if(snapshot===null){
          objOutputContexts.displayText = 'Wrong family member';
          sendResponse(objOutputContexts); // Send simple response to user
        }else{
          console.log(member_info + " is: " + snapshot.val());
        }

        if(member_info==='age'){
          objOutputContexts["fulfillmentText"] = member_name + ' is ' + snapshot.val() + ' years old !!'; // Send simple response to user
          sendResponse(objOutputContexts); // Send simple response to user
          //sendResponse(member_name + ' is ' + snapshot.val() + ' years old !!');
        }else if(member_info==='position'){
          objOutputContexts.fulfillmentText = member_name + ' is ' + snapshot.val(); // Send simple response to user
          sendResponse(objOutputContexts); // Send simple response to user
        }else if(member_info==='job'){
          objOutputContexts.fulfillmentText = member_name + ' is ' + snapshot.val(); // Send simple response to user
          sendResponse(objOutputContexts); // Send simple response to user
        }else if(member_info==='location'){
          objOutputContexts.fulfillmentText = member_name + ' is living in ' + snapshot.val(); // Send simple response to user
          sendResponse(objOutputContexts); // Send simple response to user
        }else if(member_info==='education'){
          objOutputContexts.fulfillmentText = member_name + '\'s qualification is ' + snapshot.val(); // Send simple response to user
          sendResponse(objOutputContexts); // Send simple response to user
        }
      });
    },
    // to get the relationships
    'get-relationship': () => {
      var ref = firebase.ref('mydb/family/' + parameters['family-member1'] + '/relationship/' + parameters['family-member2']);
      ref.orderByKey().on("value", function(snapshot) {
        if(snapshot===null){
          sendResponse('Wrong family member'); // Send simple response to user
        }else{
          console.log("snapshot is: ");
          console.log(snapshot.val());
          console.log("snapshot value is: " + snapshot.val());
          sendResponse(parameters['family-member2'] + ' is ' + snapshot.val() + ' to ' + parameters['family-member1']); // Send simple response to user
        }
      });
    },
    // Default handler for unknown or undefined actions
    'default': () => {
      let responseToUser = {
        //fulfillmentMessages: richResponsesV2, // Optional, uncomment to enable
        //outputContexts: [{ 'name': `${session}/contexts/weather`, 'lifespanCount': 2, 'parameters': {'city': 'Rome'} }], // Optional, uncomment to enable
        fulfillmentText: 'This is from Dialogflow\'s Cloud Functions for Firebase editor! :-)' // displayed response
      };
      sendResponse(responseToUser);
    }
  };
  // If undefined or unknown action use the default handler
  if (!actionHandlers[action]) {
    action = 'default';
  }
  // Run the proper handler function to handle the request from Dialogflow
  actionHandlers[action]();
  // Function to send correctly formatted responses to Dialogflow which are then sent to the user
  function sendResponse (responseToUser) {
    // if the response is a string send it as a response to the user
    if (typeof responseToUser === 'string') {
      let responseJson = {fulfillmentText: responseToUser}; // displayed response
      response.json(responseJson); // Send response to Dialogflow
    } else {
      // If the response to the user includes rich responses or contexts send them to Dialogflow
      let responseJson = {fulfillmentText: responseToUser.fulfillmentText};
      // Define the text response
      responseJson.fulfillmentText = responseToUser.fulfillmentText;
      // Optional: add rich messages for integrations (https://dialogflow.com/docs/rich-messages)
      if (responseToUser.fulfillmentMessages) {
        responseJson.fulfillmentMessages = responseToUser.fulfillmentMessages;
      }
      // Optional: add contexts (https://dialogflow.com/docs/contexts)
      if (responseToUser.outputContexts) {
        responseJson.outputContexts = responseToUser.outputContexts;
      }
      // Send the response to Dialogflow
      console.log('Response to Dialogflow: ' + JSON.stringify(responseJson));
      response.json(responseJson);
      //response["queryResult"] = responseJson;
    }
  }
});
function processV1Request (request, response) {
  let action = request.body.result.action; // https://dialogflow.com/docs/actions-and-parameters
  let parameters = request.body.result.parameters; // https://dialogflow.com/docs/actions-and-parameters
  let inputContexts = request.body.result.contexts; // https://dialogflow.com/docs/contexts
  let requestSource = (request.body.originalRequest) ? request.body.originalRequest.source : undefined;
  const googleAssistantRequest = 'google'; // Constant to identify Google Assistant requests
  const app = new DialogflowApp({request: request, response: response});
  // Create handlers for Dialogflow actions as well as a 'default' handler
  const actionHandlers = {
    // The default welcome intent has been matched, welcome the user (https://dialogflow.com/docs/events#default_welcome_intent)
    'input.welcome': () => {
      // Use the Actions on Google lib to respond to Google requests; for other requests use JSON
      if (requestSource === googleAssistantRequest) {
        sendGoogleResponse('Hello, Welcome to my Dialogflow agent!'); // Send simple response to user
      } else {
        sendResponse('Hello, Welcome to my Dialogflow agent!'); // Send simple response to user
      }
    },
    // The default fallback intent has been matched, try to recover (https://dialogflow.com/docs/intents#fallback_intents)
    'input.unknown': () => {
      // Use the Actions on Google lib to respond to Google requests; for other requests use JSON
      if (requestSource === googleAssistantRequest) {
        sendGoogleResponse('I\'m having trouble, can you please try that again?'); // Send simple response to user
      } else {
        sendResponse('I\'m having trouble, can you please try that again?'); // Send simple response to user
      }
    },
    // Default handler for unknown or undefined actions
    'default': () => {
      // Use the Actions on Google lib to respond to Google requests; for other requests use JSON
      if (requestSource === googleAssistantRequest) {
        let responseToUser = {
          //googleRichResponse: googleRichResponse, // Optional, uncomment to enable
          //googleOutputContexts: ['weather', 2, { ['city']: 'rome' }], // Optional, uncomment to enable
          speech: 'This message is from Dialogflow\'s Cloud Functions for Firebase editor!', // spoken response
          text: '1This is from Dialogflow\'s Cloud Functions for Firebase editor! :-)' // displayed response
        };
        sendGoogleResponse(responseToUser);
      } else {
        let responseToUser = {
          //data: richResponsesV1, // Optional, uncomment to enable
          //outputContexts: [{'name': 'weather', 'lifespan': 2, 'parameters': {'city': 'Rome'}}], // Optional, uncomment to enable
          speech: 'This message is from Dialogflow\'s Cloud Functions for Firebase editor!', // spoken response
          text: '2This is from Dialogflow\'s Cloud Functions for Firebase editor! :-)' // displayed response
        };
        sendResponse(responseToUser);
      }
    }
  };
  // If undefined or unknown action use the default handler
  if (!actionHandlers[action]) {
    action = 'default';
  }
  // Run the proper handler function to handle the request from Dialogflow
  actionHandlers[action]();
    // Function to send correctly formatted Google Assistant responses to Dialogflow which are then sent to the user
  function sendGoogleResponse (responseToUser) {
    if (typeof responseToUser === 'string') {
      app.ask(responseToUser); // Google Assistant response
    } else {
      // If speech or displayText is defined use it to respond
      let googleResponse = app.buildRichResponse().addSimpleResponse({
        speech: responseToUser.speech || responseToUser.displayText,
        displayText: responseToUser.displayText || responseToUser.speech
      });
      // Optional: Overwrite previous response with rich response
      if (responseToUser.googleRichResponse) {
        googleResponse = responseToUser.googleRichResponse;
      }
      // Optional: add contexts (https://dialogflow.com/docs/contexts)
      if (responseToUser.googleOutputContexts) {
        app.setContext(...responseToUser.googleOutputContexts);
      }
      console.log('Response to Dialogflow (AoG): ' + JSON.stringify(googleResponse));
      app.ask(googleResponse); // Send response to Dialogflow and Google Assistant
    }
  }
  // Function to send correctly formatted responses to Dialogflow which are then sent to the user
  function sendResponse (responseToUser) {
    // if the response is a string send it as a response to the user
    if (typeof responseToUser === 'string') {
      let responseJson = {};
      responseJson.speech = responseToUser; // spoken response
      responseJson.displayText = responseToUser; // displayed response
      response.json(responseJson); // Send response to Dialogflow
    } else {
      // If the response to the user includes rich responses or contexts send them to Dialogflow
      let responseJson = {};
      // If speech or displayText is defined, use it to respond (if one isn't defined use the other's value)
      responseJson.speech = responseToUser.speech || responseToUser.displayText;
      responseJson.displayText = responseToUser.displayText || responseToUser.speech;
      // Optional: add rich messages for integrations (https://dialogflow.com/docs/rich-messages)
      responseJson.data = responseToUser.data;
      // Optional: add contexts (https://dialogflow.com/docs/contexts)
      responseJson.contextOut = responseToUser.outputContexts;
      console.log('Response to Dialogflow: ' + JSON.stringify(responseJson));
      response.json(responseJson); // Send response to Dialogflow
    }
  }
}
// Construct rich response for Google Assistant (v1 requests only)
const app = new DialogflowApp();
const googleRichResponse = app.buildRichResponse()
  .addSimpleResponse('This is the first simple response for Google Assistant')
  .addSuggestions(
    ['Suggestion Chip', 'Another Suggestion Chip'])
    // Create a basic card and add it to the rich response
  .addBasicCard(app.buildBasicCard(`This is a basic card.  Text in a
 basic card can include "quotes" and most other unicode characters
 including emoji 📱.  Basic cards also support some markdown
 formatting like *emphasis* or _italics_, **strong** or __bold__,
 and ***bold itallic*** or ___strong emphasis___ as well as other things
 like line  \nbreaks`) // Note the two spaces before '\n' required for a
                        // line break to be rendered in the card
    .setSubtitle('This is a subtitle')
    .setTitle('Title: this is a title')
    .addButton('This is a button', 'https://assistant.google.com/')
    .setImage('https://developers.google.com/actions/images/badges/XPM_BADGING_GoogleAssistant_VER.png',
      'Image alternate text'))
  .addSimpleResponse({ speech: 'This is another simple response',
    displayText: 'This is the another simple response 💁' });
// Rich responses for Slack and Facebook for v1 webhook requests
const richResponsesV1 = {
  'slack': {
    'text': 'This is a text response for Slack.',
    'attachments': [
      {
        'title': 'Title: this is a title',
        'title_link': 'https://assistant.google.com/',
        'text': 'This is an attachment.  Text in attachments can include \'quotes\' and most other unicode characters including emoji 📱.  Attachments also upport line\nbreaks.',
        'image_url': 'https://developers.google.com/actions/images/badges/XPM_BADGING_GoogleAssistant_VER.png',
        'fallback': 'This is a fallback.'
      }
    ]
  },
  'facebook': {
    'attachment': {
      'type': 'template',
      'payload': {
        'template_type': 'generic',
        'elements': [
          {
            'title': 'Title: this is a title',
            'image_url': 'https://developers.google.com/actions/images/badges/XPM_BADGING_GoogleAssistant_VER.png',
            'subtitle': 'This is a subtitle',
            'default_action': {
              'type': 'web_url',
              'url': 'https://assistant.google.com/'
            },
            'buttons': [
              {
                'type': 'web_url',
                'url': 'https://assistant.google.com/',
                'title': 'This is a button'
              }
            ]
          }
        ]
      }
    }
  }
};
/*
* Function to handle v2 webhook requests from Dialogflow
*/
function processV2Request (request, response) {
  // An action is a string used to identify what needs to be done in fulfillment
  let action = (request.body.queryResult.action) ? request.body.queryResult.action : 'default';
  // Parameters are any entites that Dialogflow has extracted from the request.
  let parameters = request.body.queryResult.parameters || {}; // https://dialogflow.com/docs/actions-and-parameters
  // Contexts are objects used to track and store conversation state
  let inputContexts = request.body.queryResult.contexts; // https://dialogflow.com/docs/contexts
  // Get the request source (Google Assistant, Slack, API, etc)
  let requestSource = (request.body.originalDetectIntentRequest) ? request.body.originalDetectIntentRequest.source : undefined;
  // Get the session ID to differentiate calls from different users
  let session = (request.body.session) ? request.body.session : undefined;
  // Create handlers for Dialogflow actions as well as a 'default' handler
  const actionHandlers = {
    // The default fallback intent has been matched, try to recover (https://dialogflow.com/docs/intents#fallback_intents)
    'welcome': () => {
        console.log("creating database object");
        /*
        var database = firebase.database('booming-cosine-188305-1e6db');
        console.log("creating database ref object");
        */
        var ref = firebase.ref('mydb/visitors');
        console.log("creating JSON object");
        var obj = {"name":parameters['introducer']};
        console.log("pushing JSON object to DB");
        ref.push(obj);
        console.log("successfully JSON object inserted");
      // Use the Actions on Google lib to respond to Google requests; for other requests use JSON
      sendResponse('Hello ' + parameters['introducer'] + ', what do you want to know about Somu\'s family ? ?? '); // Send simple response to user
    },
    // The default fallback intent has been matched, try to recover (https://dialogflow.com/docs/intents#fallback_intents)
    'get-details': () => {
      // Use the Actions on Google lib to respond to Google requests; for other requests use JSON
      console.log("my-action: " + parameters['my-action']);
      var member_name = parameters['family-member'];
      var member_info = parameters['member-info'];
      //request.body.session+'/contexts/something'} 
      var objOutputContexts = JSON.parse('{"outputContexts" : [{"name":"' + request.body.session + '/contexts/my-context", "lifespanCount":10, "parameters":{}}]}');

      console.log("member_name: " + member_name);
      console.log("member_info: " + member_info);
      
      if(member_name===null || member_name===''){
        console.log("member_name is empty, so reading value from 'member-name' parameter");
        member_name = parameters['member-name'];
      }

      if(member_info===null || member_info===''){
        console.log("member_info is empty, so reading value from 'my-action' parameter");
        member_info = parameters['my-action'];
      }

      objOutputContexts["outputContexts"][0].parameters["family-member"] = member_name;
      objOutputContexts["outputContexts"][0].parameters["member-info"] = member_info;

      if(member_name===null && member_info===null){
        //objOutputContexts.fulfillmentText = 'Sorry, i did not get you question.  Can you reframe your question again ?';
        console.log(objOutputContexts.stringify);
        sendResponse(objOutputContexts);
      }else if(member_name===null){
        objOutputContexts.fulfillmentText = 'Whose ' + member_info + ' you would like to know ?';
        console.log(objOutputContexts.stringify);
        sendResponse(objOutputContexts);
      }else if(member_info===null){
        objOutputContexts.fulfillmentText = 'What would you like to know about ' + member_name + '?';
        console.log(objOutputContexts.stringify);
        sendResponse(objOutputContexts);
      }

      console.log("executing firebase query with member_name(" + member_name + ") and member_info(" + member_info + ")");

      var ref = firebase.ref('mydb/family/' + member_name + '/' + member_info);
      ref.orderByKey().on("value", function(snapshot) {
        if(snapshot===null){
          objOutputContexts.displayText = 'Wrong family member';
          sendResponse(objOutputContexts); // Send simple response to user
        }else{
          console.log(member_info + " is: " + snapshot.val());
        }

        if(member_info==='age'){
          objOutputContexts["fulfillmentText"] = member_name + ' is ' + snapshot.val() + ' years old !!'; // Send simple response to user
          sendResponse(objOutputContexts); // Send simple response to user
          //sendResponse(member_name + ' is ' + snapshot.val() + ' years old !!');
        }else if(member_info==='position'){
          objOutputContexts.fulfillmentText = member_name + ' is ' + snapshot.val(); // Send simple response to user
          sendResponse(objOutputContexts); // Send simple response to user
        }else if(member_info==='job'){
          objOutputContexts.fulfillmentText = member_name + ' is ' + snapshot.val(); // Send simple response to user
          sendResponse(objOutputContexts); // Send simple response to user
        }else if(member_info==='location'){
          objOutputContexts.fulfillmentText = member_name + ' is living in ' + snapshot.val(); // Send simple response to user
          sendResponse(objOutputContexts); // Send simple response to user
        }else if(member_info==='education'){
          objOutputContexts.fulfillmentText = member_name + '\'s qualification is ' + snapshot.val(); // Send simple response to user
          sendResponse(objOutputContexts); // Send simple response to user
        }
      });
    },
    // to get the relationships
    'get-relationship': () => {
      var ref = firebase.ref('mydb/family/' + parameters['family-member1'] + '/relationship/' + parameters['family-member2']);
      ref.orderByKey().on("value", function(snapshot) {
        if(snapshot===null){
          sendResponse('Wrong family member'); // Send simple response to user
        }else{
          console.log("snapshot is: ");
          console.log(snapshot.val());
          console.log("snapshot value is: " + snapshot.val());
          sendResponse(parameters['family-member2'] + ' is ' + snapshot.val() + ' to ' + parameters['family-member1']); // Send simple response to user
        }
      });
    },
    // Default handler for unknown or undefined actions
    'default': () => {
      let responseToUser = {
        //fulfillmentMessages: richResponsesV2, // Optional, uncomment to enable
        //outputContexts: [{ 'name': `${session}/contexts/weather`, 'lifespanCount': 2, 'parameters': {'city': 'Rome'} }], // Optional, uncomment to enable
        fulfillmentText: 'This is from Dialogflow\'s Cloud Functions for Firebase editor! :-)' // displayed response
      };
      sendResponse(responseToUser);
    }
  };
  // If undefined or unknown action use the default handler
  if (!actionHandlers[action]) {
    action = 'default';
  }
  // Run the proper handler function to handle the request from Dialogflow
  actionHandlers[action]();
  // Function to send correctly formatted responses to Dialogflow which are then sent to the user
  function sendResponse (responseToUser) {
    // if the response is a string send it as a response to the user
    if (typeof responseToUser === 'string') {
      let responseJson = {fulfillmentText: responseToUser}; // displayed response
      response.json(responseJson); // Send response to Dialogflow
    } else {
      // If the response to the user includes rich responses or contexts send them to Dialogflow
      let responseJson = {fulfillmentText: responseToUser.fulfillmentText};
      // Define the text response
      responseJson.fulfillmentText = responseToUser.fulfillmentText;
      // Optional: add rich messages for integrations (https://dialogflow.com/docs/rich-messages)
      if (responseToUser.fulfillmentMessages) {
        responseJson.fulfillmentMessages = responseToUser.fulfillmentMessages;
      }
      // Optional: add contexts (https://dialogflow.com/docs/contexts)
      if (responseToUser.outputContexts) {
        responseJson.outputContexts = responseToUser.outputContexts;
      }
      // Send the response to Dialogflow
      console.log('Response to Dialogflow: ' + JSON.stringify(responseJson));
      response.json(responseJson);
      //response["queryResult"] = responseJson;
    }
  }
}
const richResponseV2Card = {
  'title': 'Title: this is a title',
  'subtitle': 'This is an subtitle.  Text can include unicode characters including emoji 📱.',
  'imageUri': 'https://developers.google.com/actions/images/badges/XPM_BADGING_GoogleAssistant_VER.png',
  'buttons': [
    {
      'text': 'This is a button',
      'postback': 'https://assistant.google.com/'
    }
  ]
};
const richResponsesV2 = [
  {
    'platform': 'ACTIONS_ON_GOOGLE',
    'simple_responses': {
      'simple_responses': [
        {
          'text_to_speech': 'Spoken simple response',
          'display_text': 'Displayed simple response'
        }
      ]
    }
  },
  {
    'platform': 'ACTIONS_ON_GOOGLE',
    'basic_card': {
      'title': 'Title: this is a title',
      'subtitle': 'This is an subtitle.',
      'formatted_text': 'Body text can include unicode characters including emoji 📱.',
      'image': {
        'image_uri': 'https://developers.google.com/actions/images/badges/XPM_BADGING_GoogleAssistant_VER.png'
      },
      'buttons': [
        {
          'title': 'This is a button',
          'open_uri_action': {
            'uri': 'https://assistant.google.com/'
          }
        }
      ]
    }
  },
  {
    'platform': 'FACEBOOK',
    'card': richResponseV2Card
  },
  {
    'platform': 'SLACK',
    'card': richResponseV2Card
  }
];