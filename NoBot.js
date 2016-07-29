#!/bin/env node
'use strict';

var SlackBot = require('slackbots');
var express = require('express');
var fs = require('fs');

var NoBot = function() {

    //  Scope.
    var self = this;

    //
    //
    //
    self.setupVariables = function() {
        //  Set the environment variables we need.
        self.ipaddress = process.env.OPENSHIFT_NODEJS_IP;
        self.port      = process.env.OPENSHIFT_NODEJS_PORT || 8080;

        if (typeof self.ipaddress === "undefined") {
            //  Log errors on OpenShift but continue w/ 127.0.0.1 - this
            //  allows us to run/test the app locally.
            console.warn('No OPENSHIFT_NODEJS_IP var, using 127.0.0.1');
            self.ipaddress = "127.0.0.1";
        };
    };


    //
    // Termination function
    //
    self.terminator = function(sig){
        if (typeof sig === "string") {
           console.log('%s: Received %s - terminating sample app ...',
                       Date(Date.now()), sig);
           process.exit(1);
        }
        console.log('%s: Node server stopped.', Date(Date.now()) );
    };


    //
    // Termination handlers to exit server in case of error
    //
    self.setupTerminationHandlers = function(){
        //  Process on exit and signals.
        process.on('exit', function() { self.terminator(); });

        // Removed 'SIGPIPE' from the list - bugz 852598.
        ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
         'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
        ].forEach(function(element, index, array) {
            process.on(element, function() { self.terminator(element); });
        });
    };


    //
    // Instantiate bot with keys
    //
    self.setupBot = function () {
      // create a bot
      self.bot = new SlackBot({
        token: 'xoxb-21888418001-Yy0rIGOOkUTPJBkFDioCXc13',
        name: 'NoBot'
      });
    }

    //
    // Setup express app
    //
    self.setupApi = function () {
      var express = require('express');
      self.app = express();

      self.app.listen(self.port, self.ipaddress, function () {
        console.log('Api is running on: ' + self.port);
      });
    }


    //
    // Initializes everything
    //
    self.initialize = function() {
        self.setupVariables();
        self.setupTerminationHandlers();
        self.setupBot();

        self.setupApi();
    };

    //
    // Current state
    //
    self.state = null;

    //
    // Starts the server
    //
    self.start = function() {
      self.bot.on('start', function() {
        // define channel, where bot exist. You can adjust it there https://my.slack.com/services
        // self.bot.postMessageToChannel('general', 'No momento, Ivan, João, Ciofi e Poloni', params);

        // define existing username instead of 'user_name'
        // self.bot.postMessageToUser('ivanseidel', 'meow!');

        // define private group instead of 'private_group', where bot exist
        // bot.postMessageToGroup('private_group', 'meow!', params);
      });

      self.bot.on('message', function (msg) {

        var txt = msg.text ? msg.text.toLowerCase() : '';

        // Check if command is '/alguem?'
        if( msg.type == 'message' &&
            txt.indexOf('tem') >= 0 &&
            txt.indexOf('algu') >= 0 &&
            txt.indexOf('?') >= 0){

          var txt = '';
          var emoji = '';
          if(self.state === null){
            emoji = ':upside_down_face:';
            txt = 'Aff. Ainda não tenho informações sobre a sala... :(';
          }else if(self.state){
            emoji = ':sunglasses:';
            txt = 'Sim! Tem alguem...';
          }else{
            emoji = ':fearful:';
            txt = 'Ops.. A sala parece fechada!';
          }

          console.log('@ Sending...', msg.channel, txt);

          self.bot.postMessage(msg.channel, txt, {
            icon_emoji: emoji
          }).always(function (data) {
            // console.log('Returned: ', data);
          });

        }else{
          // console.log(msg);
        }
      })

      self.app.get('/push/:status', function (req, res) {
        var status = !!(req.params.status * 1);

        var msg, emoji;

        self.state = status;

        if(status){
          emoji = ':sunglasses:';
          msg = 'Hey! A sala está aberta ;)';
        }else{
          emoji = ':fearful:';
          msg = 'Ops... Saimos :(';
        }

        self.bot.postMessageToChannel('general', msg, {
          icon_emoji: emoji
        });

        res.send('Pushed state: '+msg);
      });
    };

};



/**
 *  main():  Main code.
 */
var app = new NoBot();
app.initialize();
app.start();
