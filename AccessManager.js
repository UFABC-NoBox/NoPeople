const _ = require('lodash')
const net = require('net')
const chalk = require('chalk')

let AccessManager = module.exports = {
  server: null,
}

//
//
//
AccessManager.initialize = (port, validator) => {
  var server = AccessManager.server = net.createServer()
  var validator = AccessManager.validator = validator

  server.on('error', (err) => {
    console.error(err)
    process.exit(1)
  })

  server.on('connection', AccessManager._handleConnection);

  server.listen(port, () => {
    console.log('AccessManager', `AccessManager using port ${server.address().port}`)
  });
}

//
// Handles each socket connection here.
//
AccessManager._socketNumber = 0
AccessManager._handleConnection = (socket) => {
  let inMessage = ''
  let number = AccessManager._socketNumber++

  let SOCK_TAG = chalk.yellow(`[Socket:${number}]`)

  console.log(SOCK_TAG, 'Open Socket');

  socket.on('data', (data) => {
    // console.log(SOCK_TAG, 'Got data', data.length);
    inMessage += data.toString();

    // Just wait more data to arrive if didn't got a \r
    if(!inMessage.includes('\r'))
      return

    let message = AccessManager._parseMessage(inMessage)
    console.log(SOCK_TAG, message.cracha)

    if(!message)
      socket.end(
        AccessManager._generateMessage(message, false, 'Erro de formato')
      );

    AccessManager.validator(message, (ok, txt) => {
      socket.end(
        AccessManager._generateMessage(message, ok, txt)
      );
    })
  })

  // Limit timeout
  // socket.setTimeout(5000)

  // Close socket on timeout
  socket.on('timeout', () => {
    socket.end()
  })

  // On socket end
  socket.on('end', () => {
    console.log(SOCK_TAG, 'Socket closed');
  })
}

//
// Parses a string into a object-oriented data, or returns null if invalid
//
AccessManager._parseMessage = (message) => {
  // Break message every `;`
  message = message || ''
  message = message.split(';')

  // Validate message
  if(message.length < _.keys(message).length)
    return null

  // Parse message
  let parsed = {
    coletor: null,
    servidor: null,
    unknown1: null,
    unknown2: null,
    cracha: null,
    acesso: null,
  };

  // Convert to object
  let i = 0
  for(var k in parsed){
    parsed[k] = message[i]
    i++
  }

  return parsed
}


AccessManager._generateMessage = (m, ok, message = '') => {
  while(message.length < 32)
    message = message + ' ';

  if(ok)
    ok = 'L'
  else
    ok = 'B'

  let params = [
    m.servidor,
    m.coletor,
    0,
    51,
    m.cracha,
    m.acesso,
    ok,
    message,
    3,
  ]

  let txt = params.join(';') + '\r'
  return txt;
  // let retVal = "99;37;0;51;0000000016529795;E;L;             VOCE ESTA LIBERADO!;3;\r" // % (servidor, controladora, cartao, entradaSaida, liberadoStr, message.ljust(32)[:32].replace(";",","))
}
