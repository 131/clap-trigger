"use strict";

var spawn   = require('child_process').spawn;
var Class   = require('uclass');
var os      = require('os');

var ClapTrigger = new Class({
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
      //chain loop has ended
      chain();
    });
  },

  stop : function(){

    this._started = false;

    if(this.recorder) {
      this.recorder.kill();
      this.recorder = null;
    }
  },

  _timing : [],

  _gotClap : function(){
    var self = this;

    this._timing.push(Date.now());

    if(this._timing.length > 25) //toconfig
      this._timing.shift(); //keep

    this.clapsList.forEach(function(trigger){
      var slice = self._timing.slice(-trigger.nb), delay = slice[trigger.nb - 1] - slice[0];
      if(slice.length == trigger.nb && delay < trigger.timing)
        setTimeout(function(){ trigger.callback(delay) }, 0); //detach
    });
  },


  clapsList : [],

  claps : function() { // nb, [timing,] callback
    var args = [].slice.apply(arguments);
    var callback = args.pop();
    var nb       = args.shift();
    var timing   = args.shift() || 2000;

    this.clapsList.push({nb : nb, timing : timing, callback : callback});
  },


  clap : function(callback) {
    this.claps(1, callback);
  },


  _listen : function(chain) {
    var self = this;

    if(!this._started)
      return chain("Listener not running");

    var args = ({
      'Linux'      : ['-t', 'alsa', 'hw:1,0'],
      'Windows_NT' : ['-t', 'waveaudio', '-d'],
    }) [os.type()];

    args.push("-t",  "wav", "-n");
    args.push("--no-show-progress");
    args.push("silence", "1", "0.0001", this.config.DETECTION_PERCENTAGE_START, "1", "0.1", this.config.DETECTION_PERCENTAGE_END);
    args.push("stat");


    var child = spawn("sox", args), body  = "";

    self.recorder = child;
    child.stderr.on("data", function(buf){ body += buf; });

    child.on("exit", function() {
      var stats = self._parse(body), clap = self.isClap(stats);
      //console.log({stats:stats, clap:clap});

      if(clap)
        self._gotClap();
      self._listen(chain);
    });
  },


  isClap : function(stats) {

    var self = this;
    var duration = stats['Length (seconds)'],
        rms      = stats['RMS amplitude'],
        max      = stats['Maximum amplitude'];

    //console.log({duration:duration, rms:rms, max:max});

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

