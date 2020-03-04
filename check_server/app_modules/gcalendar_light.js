const {google} = require('googleapis');


listEvents('AIzaSyDZn6isLBl3ZxWhzIjwZC5vkePegoM90rg')

function listEvents(apikey) {
  const calendar = google.calendar({version: 'v3', auth:apikey});
  calendar.events.list({
    calendarId: 'mre32s5c0kv8802huac21qdk7g@group.calendar.google.com',
    timeMin: (new Date()).toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: 'startTime',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const events = res.data.items;
    if (events.length) {
      console.log('Upcoming 10 events:');
      events.map((event, i) => {
        const start = event.start.dateTime || event.start.date;
        console.log(`${start} - ${event.summary} - ${event.organizer.displayName} - ${event.creator.displayName}`);
      });
    } else {
      console.log('No upcoming events found.');
    }
  });
}
