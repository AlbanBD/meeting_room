var gcc = require('./gcalendar/gcalendar_connector');
var fs = require('fs');
var fs = require('path')

if (process.argv.length>2)
{
  console.log('Generate authorisation token : In Progress.');
  gcc.generateAccessToken(process.argv[2], (err)=>
  {
    if(err)
    {
      console.log(err);
    }
    else {
      console.log('Generate authorisation token : Success.')
    }
  });
}
else {
  console.log('credential file missing')
}
