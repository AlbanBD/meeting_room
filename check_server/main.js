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

// import mongodb lib and Client creation
const mongoclient = require('mongodb').MongoClient;
// and ObjectId creation
const mongoObjId = require('mongodb').ObjectId;
//const mongodbserver url
const _mongodbserver = "mongodb://localhost:27017";
const _mongodbdb = 'res_room';
const _mongodbtable = 'reservations';


const corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}


// express port const
const _server_port = 4444;
//I set the bodyparser as the app parser
app.use(bodyParser.json())

/*app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  next();
});*/
/*
var server = http.createServer(function(req, res) {
    fs.readFile('./index.html', 'utf-8', function(error, content) {
        res.writeHead(200, {"Content-Type": "text/html"});
        res.end(content);
    });
});
*/





app.get('/room_planning/:text',(req, res) => {

  /*var ts_temp=new Date()
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
  */
  res.send('momo'/*room*/);
  io.emit('momo',req.params.text);

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
			getInDB({'_id':mgobj}, _mongodbdb, _mongodbtable, (dberr,dbres)=>
			{
        var dbcode = dbres.code;
        console.log(`Booking code from de database ${dbcode}`);
				if(dberr){console.log(`Error: getting code from database : aborted\nInfos : ${dberr}`)}
        else
        {
          if(parseInt(dbcode)==parseInt(code))
  				{
  					console.log('Client code valid, saving validation on the database...');
            updateStatusInDB(book_id, _mongodbdb, _mongodbtable, (uperr, upres)=>
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
  getInDB({'client':login,'status':'pending'}, _mongodbdb, _mongodbtable, (dberr, dbres) =>
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
  console.log('new code request');
	var nbr = random(0, 10000);
	var nbr = Array(4-nbr.toString().length).fill(0)+nbr.toString();
	console.log(`Random code generated : ${nbr}`);

	var d = new Date();
	var de = new Date(d);
	de.setHours(de.getHours()+1);

  var booking = {room:"han solo", client:"florent.dubois@airbus.com", ts_begin:d, ts_end:de, code:nbr, status:"pending"};

  console.log('Booking line insertion in the database...')
	insertInDB(_mongodbdb,_mongodbtable, booking, (dberr, dbres)=>
	{
		if(dberr)
		{
			console.log(`Error : MongoDB insertion aborted\nInfos : ${dberr}`);
			res.end('error');
		}
		else
		{
			console.log('Booking line insertion : success\nSending code to dashboard.');
      io.emit('book_code', nbr);
      res.end('success');
		}
	});
});
/*
io.on('connection',socket => {
  console.log('a new client is connected');
  socket.on('keepAlive', data =>
  {
      console.log(data);
  });
})
*/
http.listen(_server_port,() => {
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
