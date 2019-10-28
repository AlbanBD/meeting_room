const fs = require('fs');
const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');

// mongodb contantes
const mongoclient = require('mongodb').MongoClient;
const _mongodbserver = "mongodb://localhost:27017";
const mongoObjId = require('mongodb').ObjectId;
var test;

// express contantes
const _server_port = 8080;
var app = express()
app.use(bodyParser.json())


var server = http.createServer(function(req, res) {
    fs.readFile('./index.html', 'utf-8', function(error, content) {
        res.writeHead(200, {"Content-Type": "text/html"});
        res.end(content);
    });
});

app.get('/room_planning',(req, res) => {

  var ts_temp=new Date()
	ts_temp.setMinutes(0);
	ts_temp.setSeconds(0);
	ts_temp.setHours(ts_temp.getHours()+1);

	var client =['florent.dubois@airbus.com', 'vincent.v.cordina@airbus.com', 'marc.carre@airbus.com', 'simon.nicolai@airbus.com', 'alban.bezieau-darguesse@airbus.com'];

  var room ={name:'han solo',room_res:[]};

	for(var c of client)
	{
		var tbeg = new Date(ts_temp.toISOString());
		var tend = new Date(ts_temp.toISOString());
		tend.setHours(tend.getHours()+1);
		var r = {client:c, ts_begin:tbeg, ts_end:tend};
		room.room_res.push(r)
		ts_temp.setHours(ts_temp.getHours()+1);
	}

	res.setHeader('Content-Type', 'application/json')
	res.send(room);

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
			getInDB({'_id':mgobj}, _mongodbdb, 'reservations', (dberr,dbres)=>
			{
        var dbcode = dbres.code;
        console.log(`Booking code from de database ${dbcode}`);
				if(dberr){console.log(`Error: getting code from database : aborted\nInfos : ${dberr}`)}
        else
        {
          if(parseInt(dbcode)==parseInt(code))
  				{
  					console.log('Client code valid, saving validation on the database...');
            updateStatusInDB(book_id, _mongodbdb, 'reservations', (uperr, upres)=>
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
}).get('/resid', (req, res)=>
{
  var login = req.query.id;
  getInDB({'client':login,'status':'pending'}, _mongodbdb, 'reservations', (dberr, dbres) =>
  {
    if(dberr){console.log(`Error: getting code from database : aborted\nInfos : ${dberr}`)}
    else {
      res.setHeader('Content-Type','application/json')
      try{
        res.send(JSON.stringify({res_id:dbres._id}));
      }
      catch(TypeError)
      {
        res.send(JSON.stringify({res_id:null}));
      }
    }
  });
}).post('/newcode', (req,res)=>
{
	var nbr = random(0, 10000);
	if (nbr < 10) {
		nbr = "000" + nbr;
	} else if (nbr < 100) {
		nbr = "00" + nbr;
	} else if (nbr < 1000) {
		nbr = "0" + nbr;
	}
	console.log(`Random code generated`)
	var d = new Date();
	var de = new Date(d);
	de.setHours(de.getHours()+1);
	var booking = {room:"han solo", client:"florent.dubois@airbus.com", ts_begin:d, ts_end:de, code:nbr, status:"pending"};
	console.log('Booking line insertion in the database...')
	insertInDB(_mongodbdb,'reservations', booking, (dberr, dbres)=>
	{
		if(dberr)
		{
			console.log(`Error : MongoDB insertion aborted\nInfos : ${dberr}`);
			res.end();
		}
		else
		{
			console.log('Booking line insertion : success');
		}
	});
	
});



app.listen(_server_port,() => {
	  console.log(`Server running at http://127.0.0.1:${_server_port}/`);
});

function connectToDB(dbname, table, callback)
{
  mongoclient.connect(_mongodbserver, (dberr, server)=>
	{
		if(dberr){callback(`Mongodb server not found : ${dberr}`);}
		var db = server.db(dbname);
		db.collection(table, (terr, coll)=>
		{
			if(terr){callback(`Mongodb table not found : ${terr}`)}
      else {
        callback(null, coll,server);
      }
		});
	});
}

function insertInDB(db, table, data, callback)
{
  connectToDB(db, table, (cerr, coll,server)=>
  {
    if(cerr){callback(cerr);}
    else {
      coll.insertOne(data, (ierr,ires)=>
  		{
  			if(ierr){callback(ierr);}
  			else{
  				callback(null, ires.insertedId);
          server.close();
  			}
  		});
    }
  });
}

function getInDB(search_el, db, table, callback)
{
  connectToDB(db, table, (cerr, coll)=>
  {
    if(cerr){callback(cerr);}
    else {
      coll.findOne(search_el, (gerr,gres)=>
  		{
  			if(gerr){callback(gerr);}
  			else{
  				callback(null, gres)
  			}
  		});
    }
  });
}

function updateStatusInDB(id, db, table, callback)
{
  connectToDB(db, table, (cerr, coll)=>
  {
    if(cerr){callback(cerr);}
    else {
      var mgobj = new mongoObjId(id);
      coll.update({'_id':mgobj}, {$set: {'status':'validate'}}, null, (uperr, upres)=>
      {
        if(uperr){callback(uperr);}
        else {
          callback(null, upres.result);
        }
      });
    }
  });
}

function random(min, max) {
	return Math.round(Math.random() * (max - min) + min);
}