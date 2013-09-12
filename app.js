var
  util = require('util'),
  express = require('express'),
  googleapis = require('googleapis'),
  settings = {
      server: {
          hostname: 'hostname',
          port: '00000'
      },
      google: {
          client_id: 'id',
          client_secret: 'secret'
      }
  },
    createTemplate = function () {

      var html = [];

      html.push('<article><h1>Hello Google Glass!<h1>')
      html.push('<h3> - From Jeff</h3>')
      html.push('<footer><p class="purple">:)</p></footer></article>');

      return html.join('');

  },
  OAuth2Client = googleapis.OAuth2Client,
  oauth2Client,
  app = express();

app.configure(function () {
    app.use(express.bodyParser());
    app.use(express.static(__dirname + '/public'));
});




app.get('/', function (req, res) {
    if (!oauth2Client || !oauth2Client.credentials) {
        oauth2Client = new OAuth2Client(settings.google.client_id, settings.google.client_secret, 'http://' + settings.server.hostname + ':' + settings.server.port + '/oauth2callback');
        res.redirect(oauth2Client.generateAuthUrl({
            access_type: 'offline',
            approval_prompt: 'force',
            scope: [
            "https://www.googleapis.com/auth/glass.timeline",
            "https://www.googleapis.com/auth/userinfo.profile"
            ].join(' ')
        }));
    }
    else {
        googleapis.discover('mirror', 'v1').execute(function (err, client) {


            client.mirror.timeline.insert({
                html: createTemplate(),
                menuItems: [
                  {
                      id: 'refresh',
                      action: 'CUSTOM',
                      values: [
                        {
                            displayName: 'Refresh',
                            iconUrl: 'http://' + settings.server.hostname + ':' + settings.server.port + '/refresh.png'
                        }
                      ]
                  },
                  {
                      action: 'TOGGLE_PINNED'
                  },
                  {
                      action: 'DELETE'
                  }
                ]
            }).withAuthClient(oauth2Client).execute(function (err, result) {
                console.log('mirror.timeline.insert', util.inspect(result));
            });


        });
        res.send("success! - check go check out the timeline", 200);
    }
});

app.get('/oauth2callback', function (req, res) {
    if (!oauth2Client) {
        res.redirect('/');
    }
    else {
        oauth2Client.getToken(req.query.code, function (err, tokens) {
            oauth2Client.credentials = tokens;
            res.redirect('/');
        });
    }
});

app.listen(settings.server.port);