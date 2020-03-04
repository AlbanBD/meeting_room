const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const path = require('path');

// scope listing the autorisations
// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/calendar.events'];

// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = './credentials/token.json';

class CalendarConnector
{
  constructor(connector)
  {
    this.connector = connector;
  }

  getNextEventsOn(calendarId, nbrEvent, onlytoday)
  {
    return new Promise((resolve,reject)=>
    {
      if(calendarId)
      {
        if(!nbrEvent) nbrEvent = 5
        var cd = new Date(); //date et heure actuelle
        var clist_opt = {
          'calendarId': calendarId/*'kgto7ofa0s0i49jmhal6rhte68@group.calendar.google.com'*/,
          'timeMin': cd.toISOString(),
          'maxResults': nbrEvent,
          'singleEvents': true,
          'orderBy': 'startTime',
        }
        if(onlytoday)//j'ajoute une option maxtime si je ne veut que les resultat de la date actuelle
        {
          var ed = new Date(Date.UTC(cd.getYear()+1900, cd.getMonth(),cd.getDate()));//date actuelle OOhOOs000ms
          ed.setTime(ed.getTime()+86399999); //je rajoute 23h59m59s999ms
          clist_opt['timeMax']= ed.toISOString()
        }

        this.connector.events.list(clist_opt, (err, res) => {
          if (err) reject('The API returned an error: ' + err);
          const events = res.data.items;
          if (events.length) {
            var events_list = [];
            events.forEach((event)=>
            {
              events_list.push(
                new CalendarEvent(
                  event.id,
                  event.summary,
                  event.creator.email,
                  event.created,
                  event.updated,
                  event.organizer.email,
                  event.organizer.displayName,
                  event.start.dateTime,
                  event.end.dateTime,
                  event.htmllink,
                  event.hangoutLink)
                )
            });
            resolve(events_list);
          } else {
            resolve([]);
          }
        });
      }else {
        reject('Calendar id not defined');
      }
    });
  }
}

class CalendarEvent
{
    constructor(id, desc, creator, creats,
      updatets, organiserId, organiserName, startts,
      endts, htmllink, hangoutlink)
    {
          this.eventId = id;
          this.description = desc;
          this.creator = creator;
          this.creadate = new Date(creats);
          this.update = new Date(updatets);
          this.startdate = new Date(startts);
          this.enddate = new Date(endts);
          this.organiserId = organiserId;
          this.organiserName = organiserName;
          this.htmllink = htmllink;
          this.hangoutlink = hangoutlink;
    }
}

function getWithCredentialFile(cred_file)
{
  try {
    var filepath = path.dirname(cred_file);
    var credContent = fs.readFileSync(cred_file, 'utf8');

    var tokenFile = filepath+'/token.json';
    var tokenContent = fs.readFileSync(tokenFile, 'utf8');

    const {client_secret, client_id, redirect_uris} = (JSON.parse(credContent)).installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    oAuth2Client.setCredentials(JSON.parse(tokenContent));

    return new CalendarConnector(google.calendar({version: 'v3', auth:oAuth2Client}));

  } catch (e) {
      if (e.code == 'ENOENT')
      {
        if(e.path == tokenFile)
        {
          throw {'code':'token', 'message': 'No token.json file found in the credential directory.'};
        }
        else {
          throw {'code':'credential','message':`No credential file : ${cred_file} found.`};
        }
      }
      else{
        console.log('Error '+e);
      }
  }
}


/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */

function generateAccessToken(credentialFile, callback) {
  fs.readFile(credentialFile, 'utf8', (err, content)=>
  {
    if(err)callback(err);
    const {client_secret, client_id, redirect_uris} = (JSON.parse(content)).installed;
    if(client_secret && client_id && redirect_uris)
    {
      const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
      const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
      });
      console.log('Authorize this app by visiting this url:', authUrl);

      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
          if (err) callback('Error retrieving access token', err);
          console.log(token)
          // Store the token to disk for later program executions
          fs.writeFile(path.dirname(credentialFile)+'/token.json', JSON.stringify(token), (err) => {
            if (err) callback(err);
            console.log('Token stored to', path.dirname(credentialFile)+'/token.json');
            callback(null);
          });
        });
      });
    }
    else
    {
      callback('Credentials file not conform');
    }
  });
}

//exports.CalendarConnector = CalendarConnector;
exports.getWithCredentialFile = getWithCredentialFile;
exports.generateAccessToken = generateAccessToken;
