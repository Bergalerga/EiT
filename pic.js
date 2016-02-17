var arDrone = require('ar-drone');
var fs = require('fs');
var autonomy = require('ardrone-autonomy');
var mission = autonomy.createMission();
var pngStream = mission.client().getPngStream()

var pictureTime = 5000;
var lastDataTime = 0;
var lastNavdataTime = 0;
var frameCounter = 0;

mission.client().config('general:navdata_options', 777060865); // turn on GPS
mission.client().config('video:video_channel', 3); //Switch to bottom camera
mission.client().config('control:altitude_max', 30000);

fs.writeFile('navdata.txt', "", function(err) {
	if (err) {
		console.log("Error creating file" + err);
	}
})

mission.takeoff()
		.zero()
		.forward(1)
		.backward(2)
		.forward(2)
		.hover(1000)
		.land();

mission.run(function (err, result) {
    if (err) {
        console.trace("Oops, something bad happened: %s", err.message);
        mission.client().stop();
        mission.client().land();
    } else {
        console.log("Mission success!");
        process.exit(0);
    }
});

pngStream.on('data', function(pngBuffer) {
	var now = (new Date()).getTime();
	if (now - lastDataTime > pictureTime) {
		frameCounter ++;
		lastDataTime = now
		console.log("taking picture")
		fs.writeFile('frame' + frameCounter + '.png', pngBuffer, function(err) {
	        if (err) {
	   			console.log('Error saving PNG: ' + err);
     		}
	    });
	}
})

mission.client().on('navdata', function(navdata) {
	var now = (new Date()).getTime();
	if (now - lastNavdataTime > pictureTime && navdata.gps !== undefined) {
		lastNavdataTime = now;
		console.log("got navdata")
		var latitude = navdata.gps.latitude;
	    var longitude = navdata.gps.longitude;
	    var elevation = navdata.gps.elevation;
	    fs.appendFile('navdata.txt', 
	      	"latitude = " + latitude + "\n" 
	      	+ "longitude = " + longitude + "\n"
	   		+ "elevation = " + elevation + "\n \n",
   			function(err) {
	      		if (err) {
	      			console.log("Error writing data" + err);
	      		}
	      	}
	    );
	};
});
