var gcc = require('./gcalendar_connector');
var c = gcc.getWithCredentialFile('gcalendar_credentials.json');

c.getNextEventsOn('kgto7ofa0s0i49jmhal6rhte68@group.calendar.google.com',5, true).then((event)=>{console.log(event)}).catch((err)=>{console.log(err)});

