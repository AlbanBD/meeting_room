//import fs lib to use file system
const fs = require('fs');
const {google} = require('googleapis');
//import bodyparser lib to parse request
const bodyParser = require('body-parser');
//import http and express lib to handle request
const cors = require('cors')
const app = require('express')();
const path = require('path');
const http = require('http').Server(app);
//import io.Socket and link to http
const io = require('socket.io')(http)
//import mongotools to mongo connection
const mgt = require('./app_modules/mongotools');
const _mongodbdb = 'res_room';
const _mongodbtable = 'reservations';
//import gcalendar_tools with credentials
const calendar_credential = './credentials/gcalendar_credentials.json';
const gcalapi = require('./app_modules/gcalendar_connector');

//import items to delete google calendar events
var credContent = fs.readFileSync(calendar_credential, 'utf8');
var tokenFile = './credentials/token.json';
var tokenContent = fs.readFileSync(tokenFile, 'utf8');
const {client_secret, client_id, redirect_uris} = (JSON.parse(credContent)).installed;
const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
oAuth2Client.setCredentials(JSON.parse(tokenContent));
const calendar = google.calendar({version: 'v3', auth: oAuth2Client});
const personal_calendar = 'mre32s5c0kv8802huac21qdk7g@group.calendar.google.com';
var momo;
var tev;


// server listen port
const _server_port = 4444;
var gcal = null;
try {
  gcal = gcalapi.getWithCredentialFile(calendar_credential);
} catch (e) {
  if(e.code =='token')
  {
    console.log(e.message);
    console.log('Use the commande "node generateToken.js [credential_file]" to create token file');
  }
  else {
    console.log(e.message);
  }
}

//I use bodyparser to parse requests
app.use(bodyParser.json())
app.post('/meetingCommand', (req,res) =>
{
  switch(req.body.command)
  {
    case 'validation':
      console.log(`Validation request received from client for meeting ${req.body._id} : ${req.body.code}`);
      console.log('Getting meeting code from database...')
			mgt.getInDB(req.body._id, _mongodbdb, _mongodbtable, (dberr,dbres)=>
			{
				if(dberr){
          console.log(`Error: getting code from database : aborted\nInfos : ${dberr}`);
          res.end(JSON.stringify({'return':'pbserver'}));
        }
        else
        {
          if(req.body.code==dbres.code)
  				{
  					console.log('Client code valid, saving validation on the database...');
            mgt.updateStatusInDB(req.body._id, 'validate', _mongodbdb, _mongodbtable, (uperr)=>
            {
              if(uperr){
                console.log(`Error : saving validation in database : aborted\nInfos : ${uperr}`);
                res.end(JSON.stringify({'return': 'pbserver'}));
              }
              else
              {
                console.log(`Saving validation : success`);
                io.emit('status', true);
                updateEvent(momo);
                res.end(JSON.stringify({'return':'validation'}));
                tev = {
                  code: 'Validée',
                  status: 'validate'
                }
                io.emit('cur_event', tev);
              }
            });
          }
          else
          {
            console.log('Client code not valid, sending message.');
            io.emit('status', false);
            res.end(JSON.stringify({'return': 'pbcode'}));
          }
        }
        });
        break;
    case 'annulation':
      console.log(`Validation request received from client for meeting ${req.body._id} : ${req.body.code}`);
      console.log('Getting meeting code from database...');
      mgt.updateStatusInDB(req.body._id, 'annulate', _mongodbdb, _mongodbtable, (uperr)=>
      {
        if(uperr){
          console.log(`Error : saving annulation in database : aborted\nInfos : ${uperr}`);
          res.end(JSON.stringify({'return': 'pbserver'}));
        }
        else
        {
          console.log(`Saving annulation : success`);
          deleteEvent(momo);
          res.end(JSON.stringify({'return': 'annulation'}));
          tev = {
            code: 'Annulée',
            status: 'annulate'
          }
          io.emit('cur_event', tev);
        }
      });
      break;
    }
}).post('/currentMeeting', (req, res)=>
{
  var login = req.body.id;
  console.log(req.body);
  console.log(`Request to get meeting for ${login}`);
  mgt.getInDB({'creator':login,'status':'pending'}, _mongodbdb, _mongodbtable, (dberr, dbres) =>
  {
    if(dberr){console.log(`Error: getting code from database : aborted\nInfos : ${dberr}`)}
    else {
      if (dbres)
      {
        console.log(`Meeting found with id ${dbres._id}`);
        var data = {'_id':dbres._id, 'eventId': dbres.eventId, 'description': dbres.description, 'startdate': dbres.startdate, 'enddate':dbres.enddate, 'room':dbres.organiserName}
        momo = dbres.eventId;
        res.setHeader('Content-Type','application/json');
        console.log('send result to client.');
        res.send(JSON.stringify(data));
      }
      else {
        console.log('No meeting found, send null to client');
        res.send(null);
      }
    }
  });
}).get('/forceMeeting', (req, res)=>
{
  launchMRProcess(true);
  res.end('ok')
});

const RINTERVAL = 5*60*1000;
const CGINTERVAL = 10*60*1000

http.listen(_server_port,() => {
	  console.log(`Server running at http://127.0.0.1:${_server_port}/`);
    console.log('Run meeting room process');
    //launchMRProcess()
    //var x = setInterval(launchMRProcess, RINTERVAL);
});

io.sockets.on('connection', (socket)=>
{
  launchMRProcess();
});

function random(min, max) {
	return Math.round(Math.random() * (max - min) + min);
}

function launchMRProcess(force)
{
  console.log("Request to meeting room service : In Progress");
  gcal.getNextEventsOn(personal_calendar, 5, false).then(
    (events)=>
    {
      console.log('Request to meeting room service : Success');
      var newCode = needNewCode(events[0].creadate.getTime(), events[0].startdate.getTime());
      if(newCode || force)
      {
        console.log(`Generate code for event => room : ${events[0].organiserName} -
          description : ${events[0].description} - id : ${events[0].id} - by : ${events[0].creator} : In Progress`);
          var startdate = events[0].startdate;
        generateCodeForEvent(events[0]).then((ev)=>
        {
          console.log('Generate code for event : Success');
          console.log('Send current event to dashboard.');
          io.emit('data', startdate);
          io.emit('cur_event', ev);
        }).catch((err)=>
        {
          console.log('Generate code for event : Error')
          console.log('Error during the code generation.\n')
        });
        console.log('Send events list to dashboard');
        io.emit('events', events.slice(1));
      }
      io.emit('events',events);
      console.log('Send events list to dashboard');
    }
  ).catch(
    (error) =>
    {
      console.log('Error : Google calendar connector not working '+error);
    });
}

function generateCodeForEvent(event)
{
  return new Promise((resolve, reject)=>
  {
    var nbr = random(1000, 10000);
    var nbr = Array(4-nbr.toString().length).fill(0)+nbr.toString();
    console.log(`Random code generated : ${nbr}`);

    event['code'] = nbr;
    event['status'] = 'pending';

    var dbevent = JSON.parse(JSON.stringify(event));
    dbevent['dbtimestamp'] = Date.now();
    console.log('Booking line insertion in the database...')

    mgt.insertInDB(_mongodbdb,_mongodbtable, dbevent, (dberr, dbres)=>
  	{
  		if(dberr)
  		{
  			console.log(`Error : MongoDB insertion aborted\nInfos : ${dberr}`);
        reject('MONGOERROR');
  		}
  		else
  		{
  			console.log('Booking line insertion : success');
        resolve(event);
  		}
  	});
  });
}


function needNewCode(cread, startd)
{
  //timestamp actuel
  var n = new Date().getTime();
  if(startd<n && n-cread<=RINTERVAL)
  {
    //si la reunion a ete cree dans les 5 derniere minutes et le debut est avant maintenant
    return true //je genere un code
  }
  else if(startd>n && startd-n<=CGINTERVAL/* && startd-n>=RINTERVAL*/)
  {
    //si le debut est apres maintenant et qu'il est dans les 10 prochaine setMinutes
      return true;
  }
  else {
    return false;
  }
}

function deleteEvent(eventId) {

      var params = {
        calendarId: personal_calendar,
        eventId: eventId,
      };

      calendar.events.delete(params, function(err) {
        if (err) {
          console.log('The API returned an ' + err);
          return;
        }
        console.log('Event deleted.');
      });
}

function updateEvent(update) {
  calendar.events.patch({
  "calendarId": personal_calendar,
  "eventId": update,
  "resource": {
    "colorId": "2"
  }
});
}
