"use strict";

var spawn  = require('child_process').spawn;
var Class   = require('uclass');
var Events  = require('uclass/events');

var EVENT_CLAP = 'clap';

var ClapTrigger = new Class({
  Implements : [Events],
  Binds :  ['stop', 'start'],

  config : {
    DETECTION_PERCENTAGE_START : '10%',
    DETECTION_PERCENTAGE_END   : '10%',
    CLAP_AMPLITUDE_THRESHOLD   : 0.7,
    CLAP_ENERGY_THRESHOLD      : 0.3,
    CLAP_MAX_DURATION          : 1.5,
  },

  start : function(chain){
    if(this._started)
      return chain("Already running");
    this._started = true;

    this._listen(function(err) {
      console.log(err);
      //chain loop has ended
      chain();
    });
  },

  stop : function(){
    console.log("Stopping now");

    this._started = false;

    if(this.recorder) {
      console.log("Killing recorder");
      this.recorder.kill();
      this.recorder = null;
    }

  },

  _gotClap : function(){
    this.emit(EVENT_CLAP);
  },


  _listen : function(chain) {
    var self = this;

    if(!this._started)
      return chain("Listener not running");

    var args = [];
    args.push("-t", "waveaudio", "-d");
    args.push("-t",  "wav", "-n");
    args.push("--no-show-progress");
    args.push("silence", "1", "0.0001", this.config.DETECTION_PERCENTAGE_START, "1", "0.1", this.config.DETECTION_PERCENTAGE_END);
    args.push("stat");

    var child = spawn("sox.exe", args), body  = "";

    self.recorder = child;
    child.stderr.on("data", function(buf){ body += buf; });

    child.on("exit", function() {
      var clap = self.isClap(self._parse(body));
      console.log("Checking loop", clap);

      if(clap)
        self._gotClap();
      self._listen(chain);
    });
  },


  isClap : function(stats) {
    console.log(stats);

    var self = this;
    var duration = stats['Length (seconds)'],
        rms      = stats['RMS amplitude'],
        max      = stats['Maximum amplitude'];

    console.log({duration:duration, rms:rms, max:max});
    // Does it have the characteristics of a clap
    var isClap = true
          && duration < self.config.CLAP_MAX_DURATION
          && max > self.config.CLAP_AMPLITUDE_THRESHOLD
          && rms < self.config.CLAP_ENERGY_THRESHOLD;

    return isClap;
  },

  _parse : function(body) {
    body = body.replace(new RegExp("[ \\t]+", "g") , " "); //sox use spaces to align output
    var split = new RegExp("^(.*):\\s*(.*)$", "mg"), match, dict = {}; //simple key:value
    while(match = split.exec(body))
      dict[match[1]] = parseFloat(match[2]);
    return dict;
  },

/*
  _stats : function(filename, chain) {
    var args = ["-t", "wav", filename, "-n", "stat"];

    var child = spawn("sox.exe", args), body  = "";

    child.stderr.on("data", function(buf){ body += buf; });
    child.on("exit", function() {
      chain(null, self._parse(body));
    });
  },
*/

});


module.exports            = ClapTrigger;
module.exports.EVENT_CLAP = EVENT_CLAP;

