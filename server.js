const request = require('request')
const AccessManager = require('./AccessManager')

const UPDATE_MINUTES = 7;
const APPS_URL_BASE = 'https://script.google.com/macros/s/';
const APPS_URL = APPS_URL_BASE + 'AKfycbze50z_ZBcM7gSBNV4bbs-cF8XtJdP42qV8-Rki4ZzshKho76JA/exec'
var app = {
  cachedAccess: {},
}


//
// Gets all users that have access and caches it to a local array
//
app.gatterAccessUsers = (next) => {
  request.get({
    url: APPS_URL
  }, (err, data) => {
    try{
      data = JSON.parse(data.body)
    }catch(e){
      console.error('Failed to get datas! Using cached.');
      return;
    }

    // Convert to local cache type
    var cache = {}

    for(var k in data){
      cache[data[k].ID] = data[k].Nome
    }

    app.cachedAccess = cache;
    console.log(cache);
  })
}

//
// Saves an access log to the drive sheet
//
app.logAccess = (cracha, allowed) => {
  request.post(APPS_URL, {
    json: true,
    body: {
      cracha: cracha,
      allowed: allowed,
    },
  }, (err) => {
    if(err)
      console.log('Falha ao salvar!');
    else
      console.log('Salvo!')
  })
}

AccessManager.initialize(2050, (obj, next) => {

  // Check if is allowed
  let id = parseInt(obj.cracha)
  let allowed = false
  let message = 'Ops... Sem acesso =/'
  if(id in app.cachedAccess) {
    allowed = true;
    message = 'Hey ' + app.cachedAccess[id] + '!';
  }

  // Log this user
  app.logAccess(id, allowed);

  // Callback
  next(allowed, message);
});

app.gatterAccessUsers();
setInterval(app.gatterAccessUsers, 60 * 1000 * UPDATE_MINUTES)
