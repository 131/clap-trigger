Clap detection trigger
===

# Motivation
I just bought a Phillips Hue lamp. My son and i want to switch on / off by clapping hands.

This module conforms to "strict minimal composition" (use browserify and you'll get the tiniest possible code, with all underlying componants fully tested)



# API

```
var engine  = require('clap-trigger');

var trigger = new engine(); // options here

trigger.start(function(){
  console.log("Stopped")
});
 
trigger.stop(); //stop listening

trigger.on(engine.EVENT_CLAP, function() {
  console.log("Simple clap here");
});


```

# Testing
```
npm test

# current code coverage is 100%
```



# Credits
* Derived from https://github.com/tom-s/clap-detector
