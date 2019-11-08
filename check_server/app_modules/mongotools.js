
// import mongodb lib and Client creation
const mongoclient = require('mongodb').MongoClient;
// and ObjectId creation
const mongoObjId = require('mongodb').ObjectId;
//const mongodbserver url
const _mongodbserver = "mongodb://localhost:27017";


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

function getInDB(sh_el, db, table, callback)
{
  connectToDB(db, table, (cerr, coll)=>
  {
    if(cerr){callback(cerr);}
    else {
      var mgobj = (typeof(sh_el) == 'object')?sh_el:{'_id': new mongoObjId(sh_el)};
      coll.findOne(mgobj, (gerr,gres)=>
  		{
  			if(gerr){callback(gerr);}
  			else{
  				callback(null, gres)
  			}
  		});
    }
  });
}

function updateStatusInDB(id, status, db, table, callback)
{
  connectToDB(db, table, (cerr, coll)=>
  {
    if(cerr){callback(cerr);}
    else {
      var mgobj = new mongoObjId(id);
      coll.update({'_id':mgobj}, {$set: {'status':status}}, null, (uperr, upres)=>
      {
        if(uperr){callback(uperr);}
        else {
          callback(null, upres.result);
        }
      });
    }
  });
}

exports.insertInDB = insertInDB;
exports.getInDB = getInDB;
exports.updateStatusInDB = updateStatusInDB;
