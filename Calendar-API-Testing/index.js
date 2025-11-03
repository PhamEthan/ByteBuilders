//Google calendar API test project

//DONE
//- Implemented "readonly" functions for gathering information from a google calendar once the user is
//      authenticated, including events and calendars, and their associated data.


//TODO
//- Add "write" functions for adding, editing and deleting calendar events.
//- Separate the calendar from the user's google calendar, to be used with their "client" or "employee"
//      login instead




require('dotenv').config();
const express = require('express');
const {google} = require('googleapis');


var fs = require('fs');
var http = require('http');
var calendarID = '';
var eventID = '';

const app = express();
//Currently just uses a google account for authentication, but once integrateed, it will use the oauth2 tokens of the application's user account
const oauth2Client = new google.auth.OAuth2(process.env.CLIENT_ID, process.env.SECRET_ID, process.env.REDIRECT);

//Directs the user to login and authenticate with a google account
app.get('/', (req, res)=>{
    const url = oauth2Client.generateAuthUrl({
        access_type:'offline',
        scope:'https://www.googleapis.com/auth/calendar'
    });
    res.redirect(url);
});




//Landing page used for Testing features. Html can be found in landing.html in the same directory.
app.get('/landing', (req,res)=> {
    console.log('request was made: ' + req.url);
    res.writeHead(200, {'Content-Type': 'text/html'});
    var myReadStream = fs.createReadStream(__dirname + '/landing.html','utf8');
    myReadStream.pipe(res);
});


//After authenticating, the user is redirected to "localhost:3000/redirect", where it gives a message that the login was successful, or prints a console error if it wasn't, before redirecting again to /landing.
app.get('/redirect', (req,res)=>{
    const code = req.query.code;
    oauth2Client.getToken(code, (err, tokens)=>{
        if(err)
        {
             console.error('Couldn\'t get token', err);
             res.send('Error');
             return;
        }
        oauth2Client.setCredentials(tokens);
        //res.send('Successfully logged in');
        res.redirect('../landing')
    });
});

//Handles gathering the authenticated user's calendars, formatted as json, and shown on the page..
app.get('/calendars', (req, res)=> {
    const calendar = google.calendar({version:'v3', auth:oauth2Client});
    calendar.calendarList.list({}, (err, response)=> {
        if(err){
            console.error('error fetching calendars', err);
            res.end('Error!');
            return;
        }
        const calendars = response.data.items;
        res.set("Content-type","application/json; charset=utf-8");
        res.send(JSON.stringify(calendars, null, 2));
    });
});


//Handles gathering the "event" details, formatted as json.
app.get('/events', (req, res) => {
    var calIDres = "";
    if(calendarID != "")
    {
        calIDres = calendarID;
    }
    else
    {
        calIDres = req.query.calendar??'primary';
    }
    var encodedID = encodeURIComponent(calendarID);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    calendar.events.list({
        calendarId: calIDres
    }, (err, response) => {
        if (err) {
            console.error('Can\'t fetch events');
            res.send('Error');
            return;
        }
        const events = response.data.items;
        res.set("Content-type","application/json; charset=utf-8");
        res.send(JSON.stringify(events, null, 2));
    });
});


//Handes creating a new calendar.
app.get('/newCalendar', (req,res) => {
    console.log("Trying to create new calendar...");
    const calendar = google.calendar({version:'v3', auth:oauth2Client});

    //Input params just require "summary", which is the name of the calendar itself.
    var calendarRequest = {
        "summary" : "Test"
    };

    //this is done using "<calendarName>.calendars.insert(resource:<resource>)"
    const newCalendar = calendar.calendars.insert({resource:calendarRequest}, function (err, event) {
        if(err) {
            console.log('There was an error creating the calendar: ' + err);
            return;
        }
        //Logging and debug, and redirect back to /landing.
        console.log('calendar created: %s', event.data);
        calendarID = event.data.id;
        res.redirect('/landing');
    });
});

//Handles creating a new event.
app.get('/newEvent', (req,res) => {
     console.log("Trying to create new Event...");
     const calendar = google.calendar({version:'v3', auth:oauth2Client});


     //Input params require summary, start and end times. Other parameters are optional.
     var startTime = new Date("2025-11-10T10:00:00Z");
     var endTime = new Date("2025-11-10T11:00:00Z");
     var timeZone = 'America/Chicago';
     var event = {
         'anyoneCanAddSelf' : false,
         'summary':'Test Event',
         'description' : 'testing event creation!',
         'start' :{
                    'dateTime' : startTime,
                    'timeZone' : timeZone

        },
         'end' : {
             'dateTime' : endTime,
             'timeZone' : timeZone
        }
    };

    //this is done using "<calendarName>.events.insert(calendarId:<CalID>, resource:<resource>)"
    calendar.events.insert({
        calendarId : calendarID,
        resource: event
    }, function (err, event) {
        if(err) {
            console.log('There was an error creating the event: ' + err);
            return;
        }
        //Logging and debug, and redirect back to /landing.
        console.log('event created: %s', event.data);
        eventID = event.data.id;
        res.redirect('/landing');
    });
});


//Updates a given event, based on its given ID.
app.get('/updateEvent', (req, res)=> {
    const calendar = google.calendar({version:'v3', auth:oauth2Client});
    var newStart = new Date("2025-11-10T20:00:00Z");
    var newEnd = new Date("2025-11-10T21:00:00Z");
    var timeZone = 'America/Chicago';

    //Input data seems to be pretty flexible. Format it like this:
    var eventData = {
        'summary':'Test Event Updated',
        'description' : 'updating event creation!',
        'start' :{
            'dateTime' : newStart,
            'timeZone' : timeZone

        },
        'end' : {
            'dateTime' : newEnd,
            'timeZone' : timeZone
        }

    };

    //this is done using "<calendarName>.events.update(calendarId:<CalID>, eventId:<EventID>, resource:<resource>)"
    calendar.events.update({
        calendarId : calendarID,
        eventId : eventID,
        resource: eventData
    }, function (err, event) {
        if(err) {
            console.log('There was an error updating the event: ' + err);
            return;
        }
        //Logging and debug, and redirect back to /landing.
        console.log('event updated: %s', event.data);
        eventID = event.data.id;
        res.redirect('/landing');
    });

});

//Deletes the given calendar event, based on the event ID given
app.get('/deleteEvent', (req, res) => {
    const calendar = google.calendar({version:'v3', auth:oauth2Client});


    //Only takes calendarId and eventId as parameters.

    //this is done using "<calendarName>.events.delete(calendarId:<CalID>, eventId:<EventID>)"
    calendar.events.delete({
        calendarId : calendarID,
        eventId : eventID
    }, function (err, event) {
        if(err) {
            console.log('There was an error deleting the event: ' + err);
            return;
        }
        //Logging and debug, and redirect back to /landing.
        console.log('event deleted!');
        res.redirect('/landing');
    });
});


//Lastly, this is a debugging function for deleting calendars themselves using the google API, because
//a single button press is faster than doing it manually on the actual Google Calendar page.
app.get('/clean', (req, res) => {
    const calendar = google.calendar({version:'v3', auth:oauth2Client});


    //requries just the calendarId as a param, and uses "<calendarName>.calendars.delete(calendarId:<CalID>)"
    calendar.calendars.delete({
        calendarId : calendarID
    }, function (err, event) {
        if(err) {
            console.log('There was an error deleting the calendar: ' + err);
            return;
        }
        //Logging and debug, and redirect back to /landing.
        console.log('calendar deleted!');
        res.redirect('/landing');
    });
});





//Starts a server for the application on port 3000
app.listen(3000,()=>console.log('Server running at 3000'));

//server.listen(3000, '127.0.0.1');
//console.log('listening on 3000');
