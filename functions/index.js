'use strict';
const functions = require('firebase-functions'); // Cloud Functions for Firebase library
const firebaseAdmin = require('firebase-admin');
const DialogflowApp = require('actions-on-google').DialogflowApp; // Google Assistant helper library
const cors = require('cors');
const express = require('express');
let app = express();
app.use(cors({ origin: false }));
//app.options('*', cors());

/*
app.options("/*", function(req, res, next){
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With, my-header');
  res.status(200).send("my response from app.options");
  console.log("inside app.options");
});
*/

var nodemailer = require("nodemailer");
var randomstring = require("randomstring");
var xoauth2 = require('xoauth2');

//var fireMail = require("fire-mail");
//firebaseAdmin.initializeApp(functions.config().firebase);

app.route('/')
  .get(function(request, response) {
    console.log("inside app.get");
    response.status(200).send('my response from app.get');
    response.end();
  })
  .post(function(request, response) {
    console.log("inside app.post");
    response.status(200).send('my response from app.post');
    response.end();
  });
  
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

exports.sendEmail = functions.https.onRequest((request, response) => {
  console.log('Request headers: ' + JSON.stringify(request.headers));
  console.log('Request body: ' + JSON.stringify(request.body));

  var strReturn = '';
  var strRandomString = randomstring.generate(10);
  var strFromEmailID = "krishna@somu.co.in";
  //var strFromEmailID = "krishnasomu@gmail.com";
  var strToEmailID = request.body.emailid;
  var strSubject = "Chit-Chat Verification Code";
  var strBody = "Verification Code is " + strRandomString;
  var strUserName = request.body.username;
  var strPassword = request.body.password;

  if (strFromEmailID===null || strFromEmailID==='') {
    strReturn = strReturn + 'Invalid from email ID' + '\n';
  }
  if (strToEmailID===null || strToEmailID==='') {
    strReturn = strReturn + 'Invalid To email ID' + '\n';
  }
  if(strReturn===''){

    /*
    var smtpTransport = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        type: 'OAuth2',
        user: 'krishnasomu',
        clientId: '735150123528-r3pmb5r2m7l0s4jhmdanlhrl37lnhfbm.apps.googleusercontent.com',
        clientSecret: '23j4EujaclnWDOTJL46OIvzd',
        refreshToken: '1/matnfYe-rvxjPxb0JTK0P1NQ9CrB4MEUhAiq2gkZA0E',
        accessToken: 'ya29.GlsKBkHFR3DXFBR3yf1PGZ_4mwekXUvxvJ2BADO1c3piCbUrAqs_npcenZA_Kv3BImDG5a2w4V4DIuy4-rHSA-ih5qdM2WK_NF3VBkZZAqTXi2wDtDQB-EEh3DWU'
      }
    });
    */

    
    var smtpTransport = nodemailer.createTransport({
      host: 'smtpout.asia.secureserver.net',
      port: 465,
      secure: true,
      auth: {
        user: 'krishna@somu.co.in',
        pass: 'f0r@GoDaddy.com' 
      }
    });
    

    console.log("transport object created");

    var mailOptions = {
      from: strFromEmailID, // sender address
      to: strToEmailID, // list of receivers
      subject: strSubject, // Subject line
      text: strBody, // plaintext body
      html: "<b>" + strBody + "</b>" // html body
    }

    console.log("mail options object created");

    smtpTransport.sendMail(mailOptions, function(error, response){
      if(error){
          console.log("error while sending message: " + error);
      }else{
          console.log("Message sent: " + response.message);
          var ref = firebase.ref('mydb/chats/users');
          var preref = firebase.ref('mydb/chats/users/pre');
          console.log("creating JSON object with password and email ID");
          var obj = {"password":strPassword, "emailid":strToEmailID, "status":"0"};
          var preobj = {"emailid":strToEmailID, "username":strUserName};
          console.log("pushing JSON object to DB");
          try{
            ref.child(strUserName).set(obj);
            preref.child(strRandomString).set(preobj);
          }catch(err){
            console.log("error while inserting verification code into DB " + err);
          }
          console.log("successfully mail and code are inserted");
      }
  
      // if you don't want to use this transport object anymore, uncomment following line
      smtpTransport.close(); // shut down the connection pool, no more messages
    });
    console.log("mail was sent");
    response.redirect("https://www.somu.co.in/chat/validate.html");
  }else{
    return response.status(400).end(strReturn);
  }
});

exports.verifyEmail = functions.https.onRequest((request, response) => {
  console.log('Request headers: ' + JSON.stringify(request.headers));
  console.log('Request body: ' + JSON.stringify(request.body));

  var strReturn = '';
  var strEmailID = request.body.emailid;
  var strVerificationCode = request.body.verificationCode;

  if (strEmailID===null || strEmailID==='') {
    strReturn = strReturn + 'Invalid email ID' + '\n';
  }
  if (strVerificationCode===null || strVerificationCode==='') {
    strReturn = strReturn + 'Invalid Verification Code' + '\n';
  }
  if(strReturn===''){
    var preref = firebase.ref('mydb/chats/users/pre/' + strVerificationCode);
    console.log("pushing JSON object to DB");
    try{
      preref.once("value", function(snapshot) {
        if(snapshot===null){
          console.log("Snapshot is snull");
          return response.status(400).end("Email and Code are not matching");
        }else{
          var strDBEmailID = snapshot.child("emailid").val();
          if(strDBEmailID!==strEmailID){
            console.log("emails are not matching");
            return response.status(400).end("Email and Code are not matching");
          }else{
            var strUserName = snapshot.child("username").val();
            var ref = firebase.ref('mydb/chats/users/' + strUserName);
            try{
              ref.child("status").set("1");
              console.log("status is changed to 1");
            }catch(err1){
              console.log("error while updating the status: " + err);
            }
            preref.remove();
            console.log("record is removed from pre");
            response.redirect("https://www.somu.co.in/chat/signin.html");
          }
        }
      });
      //preref.off();
    }catch(err){
      console.log("error while validating verification code: " + err);
    }
  }else{
    return response.status(400).end(strReturn);
  }
});

exports.authenticateUser = functions.https.onRequest((request, response) => {
  console.log('Request headers: ' + JSON.stringify(request.headers));
  console.log('Request body: ' + JSON.stringify(request.body));

  var strReturn = '';
  var strUserName = request.body.username;
  var strPassword = request.body.password;

  if (strUserName===null || strUserName==='') {
    strReturn = strReturn + 'Invalid User Name' + '\n';
  }
  if (strPassword===null || strPassword==='') {
    strReturn = strReturn + 'Invalid Password' + '\n';
  }
  if(strReturn===''){
    var ref = firebase.ref('mydb/chats/users/' + strUserName);
    console.log("pushing JSON object to DB");
    try{
      ref.once("value", function(snapshot) {
        if(snapshot===null){
          console.log("Snapshot is snull");
          return response.status(400).end("User name is not registered");
        }else{
          var strDBPassword = snapshot.child("password").val();
          if(strDBPassword!==strPassword){
            console.log("Credentials are not matching");
            return response.status(400).end("Credentials are not matching");
          }else{
            console.log("Login successful");
            response.redirect("https://www.somu.co.in/chat/chat.html");
          }
        }
      });
      //preref.off();
    }catch(err){
      console.log("error while validating verification code: " + err);
    }
  }else{
    return response.status(400).end(strReturn);
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
        console.log("creating database object for welcome");
        /*
        var database = firebase.database('booming-cosine-188305-1e6db');
        console.log("creating database ref object");
        */
        var ref = firebase.ref('sptz/visitors/' + session);
        console.log("creating JSON object with name and introducer");
        var obj = {"name":parameters['introducer']};
        console.log("pushing JSON object to DB");
        ref.push(obj);
        console.log("welcome: successfully JSON object inserted");
      // Use the Actions on Google lib to respond to Google requests; for other requests use JSON
      sendResponse(response,'Hello ' + parameters['introducer'] + ', Can you please give us your phone number ? ?? '); // Send simple response to user
    },
    'phonenumber': () => {
      console.log("creating database object for phonenumber");
      /*
      var database = firebase.database('booming-cosine-188305-1e6db');
      console.log("creating database ref object");
      */
      var ref = firebase.ref('sptz/visitors/' + session);
      console.log("creating JSON object for phone number");
      var obj = {"phone":parameters['phone-number']};
      console.log("pushing JSON object to DB");
      ref.push(obj);
      console.log("phonenumber: successfully JSON object inserted");
    // Use the Actions on Google lib to respond to Google requests; for other requests use JSON
    sendResponse(response,'Hello ' + parameters['introducer'] + ', How may i help you ? ?? '); // Send simple response to user
  },
    // Default handler for unknown or undefined actions
    'default': () => {
      let responseToUser = {
        //fulfillmentMessages: richResponsesV2, // Optional, uncomment to enable
        //outputContexts: [{ 'name': `${session}/contexts/weather`, 'lifespanCount': 2, 'parameters': {'city': 'Rome'} }], // Optional, uncomment to enable
        fulfillmentText: 'This is from Dialogflow\'s Cloud Functions for Firebase editor! :-)' // displayed response
      };
      sendResponse(response,responseToUser);
    }
  };
  // If undefined or unknown action use the default handler
  if (!actionHandlers[action]) {
    action = 'default';
  }
  // Run the proper handler function to handle the request from Dialogflow
  actionHandlers[action]();
  // Function to send correctly formatted responses to Dialogflow which are then sent to the user
  function sendResponse (response,responseToUser) {
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
/*
* Function to handle v2 webhook requests from Dialogflow
*/
function sendResponse (response,responseToUser) {
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

function checkEmpty(pParam){
  try{
    if(pParam === null){
      return '';
    }else{
      if(typeof pParam === 'undefined'){
        return '';
      }else{
       return pParam; 
      }
    }
  }catch(err){
    console.log("sent '' back, because error returned while checking for empty/null/undefined: " + err);
    return '';
  }
}

function actionPhotos(request, response){
  let parameters = request.body.queryResult.parameters || {}; // https://dialogflow.com/docs/actions-and-parameters
  try{
    var photo_year = checkEmpty(parameters['photo-year']);
    var photo_location = checkEmpty(parameters['photo-location']);
    var photo_ocassion = checkEmpty(parameters['photo-ocassion']);
    var family_member = checkEmpty(parameters['family-member']);
    var strResponse = '';
    var strFullSessionID = request.body["session"];
    var lastSlashPosition = strFullSessionID.lastIndexOf('/');
    var lengthSessionID = strFullSessionID.length;
    var strSessionID = strFullSessionID.slice(lastSlashPosition,lengthSessionID);
    var strPhotos = '';

    console.log("sessionid: " + strSessionID);

    if(family_member===''){
      family_member = checkEmpty(parameters['prev-family-member']);
      console.log("family_member is read from prev-family-member: " + family_member);
    }
    if(family_member===''){
      family_member = checkEmpty(parameters['member-name']);
      console.log("family_member is set from member-name: " + family_member);
    }

    var objOutputContexts = JSON.parse('{"outputContexts" : [{"name":"' + request.body.session + '/contexts/my-context", "lifespanCount":10, "parameters":{}}]}');
    objOutputContexts["outputContexts"][0].parameters["family-member"] = family_member;
    objOutputContexts["outputContexts"][0].parameters["member-info"] = "photos";
    //sendResponse(response,objOutputContexts);

    if(photo_year==='' && photo_ocassion==='' && photo_location==='' && family_member===''){
      console.log("photos: all necessary parameters are empty");
      strResponse = strResponse + 'Narrow down the criteria by providing either \r\n';
      strResponse = strResponse + 'person, year, ocassion or location';
      objOutputContexts.fulfillmentText = strResponse;
      sendResponse(response,objOutputContexts); // Send simple response to user
    }else{
      var ref = firebase.ref('mydb/photos');
      var tmpref = firebase.ref('mydb/displayphotos/' + strSessionID);
      ref.orderByKey().once("value", function(snapshot) {
        if(snapshot===null){
          console.log("no photos available in DB");
          tmpref.set('');
          objOutputContexts.fulfillmentText = 'No photos available as of now';
          sendResponse(response,objOutputContexts); // Send simple response to user
        }else{
          snapshot.forEach(function(child){
            //console.log("checking for photo: " + child.key);
            var strDate = snapshot.child(child.key + "/date").val();
            var strPersons = snapshot.child(child.key + "/persons").val();
            var strPlaces = snapshot.child(child.key + "/places").val();
            var strOcassion = snapshot.child(child.key + "/ocassion").val();
            if(strDate.indexOf(photo_year)>-1 && strPersons.indexOf(family_member)>-1 && strPlaces.indexOf(photo_location)>-1 && strOcassion.indexOf(photo_ocassion)>-1){
              strPhotos = strPhotos + child.key + ',';
            }
          });
          if(strPhotos!==''){
            console.log("photos identified: " + strPhotos);
            tmpref.set(strPhotos);
            objOutputContexts.fulfillmentText = 'Here are your photos. You can enlarge photos by clicking on the thumbnails.  Press escape to close the enlarged photos';
            sendResponse(response,objOutputContexts); // Send simple response to user
          }else{
            tmpref.set('');
            objOutputContexts.fulfillmentText = 'Sorry, there are no photos found with that criteria';
            sendResponse(response,objOutputContexts); // Send simple response to user
          }
        }
      });
    }
    //sendResponse(strResponse); // Send simple response to user
  }catch(err){
    console.log("error @ photos action: " + err);
    sendResponse(response,"Sorry, i'm confused.  Can you please rephrase your query ?"); // Send simple response to user
  }
}

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

  var objOutputContexts = null;

  const actionHandlers = {
    // The default fallback intent has been matched, try to recover (https://dialogflow.com/docs/intents#fallback_intents)
    'welcome': () => {
        console.log("creating database object");
        /*
        var database = firebase.database('booming-cosine-188305-1e6db');
        console.log("creating database ref object");
        */
        var ref = firebase.ref('mydb/visitors');
        console.log("creating JSON object with name and introducer for welcome");
        var obj = {"name":parameters['introducer']};
        if(parameters['introducer']==='devil'){

          console.log("introducer is devil");
          
          /*
          var smtpTransport = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
              type: 'OAuth2',
              user: 'krishnasomu',
              clientId: '735150123528-r3pmb5r2m7l0s4jhmdanlhrl37lnhfbm.apps.googleusercontent.com',
              clientSecret: '23j4EujaclnWDOTJL46OIvzd',
              refreshToken: '1/matnfYe-rvxjPxb0JTK0P1NQ9CrB4MEUhAiq2gkZA0E',
              accessToken: 'ya29.GlsKBkHFR3DXFBR3yf1PGZ_4mwekXUvxvJ2BADO1c3piCbUrAqs_npcenZA_Kv3BImDG5a2w4V4DIuy4-rHSA-ih5qdM2WK_NF3VBkZZAqTXi2wDtDQB-EEh3DWU'
            }
          });
          */      
         
         var smtpTransport = nodemailer.createTransport({
          host: 'smtpout.asia.secureserver.net',
          port: 465,
          secure: true,
          auth: {
            user: 'krishna@somu.co.in',
            pass: 'f0r@GoDaddy.com' 
          }
        });
        
        console.log("transport object created");
          var mailOptions = {
            from: "krishna@somu.co.in", // sender address
            //from: "krishnasomu@gmail.com", // sender address
            to: "krishnasomu@yahoo.com", // list of receivers
            subject: "alert from Cute Bot", // Subject line
            text: "devil has arrived", // plaintext body
            html: "<b>devil has arrived</b>" // html body
          }
          console.log("mail options object created");
          smtpTransport.sendMail(mailOptions, function(error, response){
            if(error){
                console.log("error while sending message: " + error);
            }else{
                console.log("Message sent: " + response.message);
            }
        
            // if you don't want to use this transport object anymore, uncomment following line
            smtpTransport.close(); // shut down the connection pool, no more messages
          });
          console.log("mail was sent");
      }
        console.log("pushing JSON object to DB");
        ref.push(obj);
        console.log("welcome: successfully JSON object inserted");
      // Use the Actions on Google lib to respond to Google requests; for other requests use JSON
      if(parameters['introducer']==='' || parameters['introducer']==='[]' || parameters['introducer']===null){
        sendResponse(response,"Hi, i'm cute bot of somu. What's your name ?"); // Send simple response to user
      }else{
        objOutputContexts = JSON.parse('{"outputContexts" : [{"name":"' + request.body.session + '/contexts/welcome", "lifespanCount":0, "parameters":{}}]}');
        objOutputContexts.fulfillmentText = 'Hello ' + parameters['introducer'] + ", i'm cute bot of somu. what do you want to know about Somu's family ?";
        sendResponse(response,objOutputContexts); // Send simple response to user
      }  
    },
    // The default fallback intent has been matched, try to recover (https://dialogflow.com/docs/intents#fallback_intents)
    'get-details': () => {
      // Use the Actions on Google lib to respond to Google requests; for other requests use JSON
      console.log("my-action: " + parameters['my-action']);
      var member_name = parameters['family-member'];
      var member_info = parameters['member-info'];
      //request.body.session+'/contexts/something'} 
      objOutputContexts = JSON.parse('{"outputContexts" : [{"name":"' + request.body.session + '/contexts/my-context", "lifespanCount":10, "parameters":{}}]}');

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

      if(member_info==='photos'){
        actionPhotos(request,response);
        return;
      }

      objOutputContexts["outputContexts"][0].parameters["family-member"] = member_name;
      objOutputContexts["outputContexts"][0].parameters["member-info"] = member_info;

      if(member_name===null && member_info===null){
        //objOutputContexts.fulfillmentText = 'Sorry, i did not get you question.  Can you reframe your question again ?';
        console.log(objOutputContexts.stringify);
        sendResponse(response,objOutputContexts);
      }else if(member_name===null){
        objOutputContexts.fulfillmentText = 'Whose ' + member_info + ' you would like to know ?';
        console.log(objOutputContexts.stringify);
        sendResponse(response,objOutputContexts);
      }else if(member_info===null){
        objOutputContexts.fulfillmentText = 'What would you like to know about ' + member_name + '?';
        console.log(objOutputContexts.stringify);
        sendResponse(response,objOutputContexts);
      }

      console.log("executing firebase query with member_name(" + member_name + ") and member_info(" + member_info + ")");

      var ref = firebase.ref('mydb/family/' + member_name + '/' + member_info);
      ref.orderByKey().on("value", function(snapshot) {
        if(snapshot===null){
          console.log("snapshot is null");
          objOutputContexts.displayText = 'Wrong family member';
          sendResponse(response,objOutputContexts); // Send simple response to user
        }else{
          console.log(member_info + " is: " + snapshot.val());
        }

        if(member_info==='age'){
          objOutputContexts["fulfillmentText"] = member_name + ' is ' + snapshot.val() + ' years old !!'; // Send simple response to user
          sendResponse(response,objOutputContexts); // Send simple response to user
          //sendResponse(member_name + ' is ' + snapshot.val() + ' years old !!');
        }else if(member_info==='position'){
          objOutputContexts.fulfillmentText = member_name + ' is ' + snapshot.val(); // Send simple response to user
          sendResponse(response,objOutputContexts); // Send simple response to user
        }else if(member_info==='job'){
          objOutputContexts.fulfillmentText = member_name + ' is ' + snapshot.val(); // Send simple response to user
          sendResponse(response,objOutputContexts); // Send simple response to user
        }else if(member_info==='location'){
          objOutputContexts.fulfillmentText = member_name + ' is living in ' + snapshot.val(); // Send simple response to user
          sendResponse(response,objOutputContexts); // Send simple response to user
        }else if(member_info==='education'){
          objOutputContexts.fulfillmentText = member_name + '\'s qualification is ' + snapshot.val(); // Send simple response to user
          sendResponse(response,objOutputContexts); // Send simple response to user
        }else if(member_info==='dob'){
          objOutputContexts.fulfillmentText = member_name + ' born on ' + snapshot.val(); // Send simple response to user
          sendResponse(response,objOutputContexts); // Send simple response to user
        }
      });
    },

    // to get all the information about family member
    'get-all-details': () => {
      // Use the Actions on Google lib to respond to Google requests; for other requests use JSON
      console.log("my-action: " + parameters['my-action']);
      var member_name = parameters['family-member'];
      objOutputContexts = JSON.parse('{"outputContexts" : [{"name":"' + request.body.session + '/contexts/my-context", "lifespanCount":10, "parameters":{}}]}');

      console.log("member_name: " + member_name);
      
      if(member_name===null || member_name===''){
        console.log("member_name is empty, so reading value from 'member-name' parameter");
        member_name = parameters['member-name'];
      }

      objOutputContexts["outputContexts"][0].parameters["family-member"] = member_name;

      if(member_name===null){
        objOutputContexts.fulfillmentText = 'Sorry, i did not get you question.  Can you reframe your question again ?';
        console.log(objOutputContexts.stringify);
        sendResponse(response,objOutputContexts);
      }

      console.log("executing firebase query with member_name(" + member_name + ")");

      var ref = firebase.ref('mydb/family/' + member_name);
      ref.orderByKey().on("value", function(snapshot) {
        if(snapshot===null){
          console.log("snapshot is null");
          objOutputContexts.displayText = 'Wrong family member';
          sendResponse(response,objOutputContexts); // Send simple response to user
        }else{
          console.log(member_name + "'s information is: " + snapshot.val());
        }

          objOutputContexts["fulfillmentText"] = member_name + ' is ' + snapshot.child("age").val() + ' years old !!'
                                                             + ' and ' + snapshot.child("job").val() // Send simple response to user
                                                             + ' and ' + snapshot.child("position").val() // Send simple response to user
                                                             + ' is living in ' + snapshot.child("location").val() // Send simple response to user
                                                             + ' and qualification is ' + snapshot.child("education").val(); // Send simple response to user
          sendResponse(response,objOutputContexts); // Send simple response to user
          //sendResponse(member_name + ' is ' + snapshot.val() + ' years old !!');
      });
    },

    // to get the relationships
    'get-relationship': () => {
      var ref = firebase.ref('mydb/family/' + parameters['family-member1'] + '/relationship/' + parameters['family-member2']);
      ref.orderByKey().on("value", function(snapshot) {
        if(snapshot===null){
          sendResponse(response,'Wrong family member'); // Send simple response to user
        }else{
          console.log("snapshot is: ");
          console.log(snapshot.val());
          console.log("snapshot value is: " + snapshot.val());
          sendResponse(response,parameters['family-member2'] + ' is ' + snapshot.val() + ' to ' + parameters['family-member1']); // Send simple response to user
        }
      });
    },
    // to get the photos
    'photos': () => {
      actionPhotos(request,response);
    },
    // Default handler for unknown or undefined actions
    'default': () => {
      let responseToUser = {
        //fulfillmentMessages: richResponsesV2, // Optional, uncomment to enable
        //outputContexts: [{ 'name': `${session}/contexts/weather`, 'lifespanCount': 2, 'parameters': {'city': 'Rome'} }], // Optional, uncomment to enable
        fulfillmentText: 'This is from Dialogflow\'s Cloud Functions for Firebase editor! :-)' // displayed response
      };
      sendResponse(response,responseToUser);
    }
  };
  // If undefined or unknown action use the default handler
  if (!actionHandlers[action]) {
    action = 'default';
  }
  // Run the proper handler function to handle the request from Dialogflow
  actionHandlers[action]();
  // Function to send correctly formatted responses to Dialogflow which are then sent to the user
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