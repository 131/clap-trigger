var expect = require('expect.js');

var engine = require('../');

//this is NOT unattended (for now on)

describe("Initial scenario", function(){
  this.timeout(10 * 1000);

  
  it("Should find a clap", function(done) {
    console.log("Please clap NOW, timeout in 5s");

    var trigger = new engine();
    var claps   = 0;

    trigger.stop(); //no effect
    trigger.stop();

    trigger.start(function(){
      expect(claps).to.be(1);
      done();
    });

    trigger.start(function(err){
      expect(err).to.be("Already running")
    });

    trigger.on("clap", function(){
      claps ++;
      console.log("GOT CLAP (claps : %d)", claps);
    });

    setTimeout(trigger.stop, 5000);

  });

});