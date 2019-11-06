//import fs lib to use file system
const fs = require('fs');
//import bodyparser lib to parse request
const bodyParser = require('body-parser');
//import http and express lib to handle request
const cors = require('cors')
const app = require('express')();
const http = require('http').Server(app);
//import io.Socket and link to http
const io = require('socket.io')(http)
//import mongotools to mongo connection
const mgt = require('./mongotools');
const _mongodbdb = 'res_room';
const _mongodbtable = 'reservations';
//import gcalendar_tools with credentials
const calendar_credential = './gcalendar/gcalendar_credentials.json';
const gcalapi = require('./gcalendar/gcalendar_connector');
const gcal = gcalapi.getWithCredentialFile(calendar_credential);
const personal_calendar = 'kgto7ofa0s0i49jmhal6rhte68@group.calendar.google.com';


// server listen port
const _server_port = 4444;

//I use bodyparser to parse requests
app.use(bodyParser.json())

app.get('/room_planning/:text',(req, res) => {


}).post('/confirmation', (req,res) =>
{
    console.log(req.body);
		var book_id = req.body.book_id;
		var code = req.body.code;
		console.log(`Code received from client for booking ${book_id} : ${code}`);
		if(!isNaN(parseInt(code)))
		{
			console.log('Getting booking code from database...')
      var mgobj = new mongoObjId(book_id);
			mgt.getInDB({'_id':mgobj}, _mongodbdb, _mongodbtable, (dberr,dbres)=>
			{
        var dbcode = dbres.code;
        console.log(`Booking code from de database ${dbcode}`);
				if(dberr){console.log(`Error: getting code from database : aborted\nInfos : ${dberr}`)}
        else
        {
          if(parseInt(dbcode)==parseInt(code))
  				{
  					console.log('Client code valid, saving validation on the database...');
            mgt.updateStatusInDB(book_id, _mongodbdb, _mongodbtable, (uperr, upres)=>
            {
              if(uperr){console.log(`Error : saving validation in database : aborted\nInfos : ${uperr}`);}
              else
              {
                console.log(`Saving validation : success`);
              }
            });
          }
          else
          {
            console.log('Client code not valid, sending message.');
          }
        }
        });
		}
    else {
      console.log('error')
    }
}).get('/currentMeeting', (req, res)=>
{
  console.log(req);
  var login = req.body.id;
  mgt.getInDB({'creator':login,'status':'pending'}, _mongodbdb, _mongodbtable, (dberr, dbres) =>
  {
    if(dberr){console.log(`Error: getting code from database : aborted\nInfos : ${dberr}`)}
    else {
      res.setHeader('Content-Type','application/json')
      try{
        res.send(JSON.stringify(dbres));
      }
      catch(TypeError)
      {
        res.send(JSON.stringify(null));
      }
    }
  });
}).post('/newcode', (req,res)=>
{
	var nbr = random(0, 10000);
	var nbr = Array(4-nbr.toString().length).fill(0)+nbr.toString();
	console.log(`Random code generated : ${nbr}`);

	var d = new Date();
	var de = new Date(d);
	de.setHours(de.getHours()+1);

  var booking = {room:"han solo", client:"florent.dubois@airbus.com", ts_begin:d, ts_end:de, code:nbr, status:"pending"};

  console.log('Booking line insertion in the database...')
	mgt.insertInDB(_mongodbdb,_mongodbtable, booking, (dberr, dbres)=>
	{
		if(dberr)
		{
			console.log(`Error : MongoDB insertion aborted\nInfos : ${dberr}`);
			res.end('book code not sent');
		}
		else
		{
			console.log('Booking line insertion : success\nSending code to dashboard.');
      io.emit('book_code', nbr);
      res.end('book code sent');
		}
	});
}).post('/calendar_events', (req, res)=>
{
  console.log('new calendar events request');
  gcal.getNextEventsOn(personal_calendar, 5, false).then(
    (events)=>
    {
      io.emit('calendar_events', events);
      res.end('calendar events sent');
    }
  ).catch(
    (error)=>
    {
      console.log('Error : Google calendar connector not working');
      res.end('calendar events not sent');
    }
  );
});

const tr = 5*60*1000;

http.listen(_server_port,() => {
	  console.log(`Server running at http://127.0.0.1:${_server_port}/`);
    console.log('Run meeting room process');
    //launchMRProcess()
    //var x = setInterval(launchMRProcess, 5000);
});

function random(min, max) {
	return Math.round(Math.random() * (max - min) + min);
}

function launchMRProcess()
{
  console.log("Request to meeting room service : In Progress");
  gcal.getNextEventsOn(personal_calendar, 5, false).then(
    (events)=>
    {
      console.log('Request to meeting room service : Success');
      var newCode = needNewCode(events[0].creadate.getTime(), events[0].startdate.getTime());

      if(newCode)
      {
        console.log(`Generate code for event => room : ${events[0].organiserName} -
          description : ${events[0].description} - id : ${events[0].id} - by : ${events[0].creator} : In Progress`);
        generateCodeForEvent(events[0]).then((ev)=>
        {
          console.log('Generate code for event : Success');
          console.log('Send current event to dashboard.');
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
    var nbr = random(0, 10000);
    var nbr = Array(4-nbr.toString().length).fill(0)+nbr.toString();
    console.log(`Random code generated : ${nbr}`);

    event['code'] = nbr;

    var dbevent = JSON.parse(JSON.stringify(event));
    dbevent['status'] = 'pending'
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
  const dc = 10*60*1000;

  //timestamp actuel
  var n = new Date().getTime();
  if(startd<n && n-cread<=tr)
  {
    //si la reunion a ete cree dans les 5 derniere minutes et le debut est avant maintenant
    return true //je genere un code
  }
  else if(startd>n && startd-n<=dc && startd-n>=tr)
  {
    //si le debut est apres maintenant et qu'il est dans les 10 prochaine setMinutes
      return true;
  }
  else {
    return false;
  }
}
