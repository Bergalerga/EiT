//Import requirements
var arDrone = require('ar-drone');
var fs = require('fs');
var autonomy = require('ardrone-autonomy');
require('events').EventEmitter.prototype._maxListeners = 100;

//Set variables and drone configuration
var mission = autonomy.createMission();
var pngStream = mission.client().getPngStream();
var frameCounter = 0;
var period = 5000; // Time between each image.
var lastFrameTime = 0;
var baseElevation = 0;

mission.client().config('general:navdata_demo', 'FALSE'); // get back all data the copter can send
mission.client().config('general:navdata_options', 777060865); // turn on GPS
mission.client().config('video:video_channel', 3); //Switch to bottom camera
mission.client().config('control:altitude_max', 30000);

fs.writeFile('navdata.txt', "", function(err) {
	if (err) {
		console.log("Error creating file" + err);
	}
})

//Take and store images and image data.
pngStream
	.on('data', function(pngBuffer) {
	    var now = (new Date()).getTime();
	    mission.client().on('navdata', function(navdata) {
	    	if (baseElevation == 0) {
	    		baseElevation = navdata.gps.elevation;
	    	}
	    	//console.log(navdata)
	    	if (now - lastFrameTime > period) {
	    		frameCounter++;
	    		lastFrameTime = now;
	    		console.log('Saving frame');
	      		var latitude = navdata.gps.latitude;
	      		var longitude = navdata.gps.longitude;
	      		var elevation = navdata.gps.elevation - baseElevation;
	      		fs.appendFile('navdata.txt', 
	      			"latitude = " + latitude + "\n" 
	      			+ "longitude = " + longitude + "\n"
	      			+ "elevation = " + elevation + "\n \n",
	      			function(err) {
	      				if (err) {
	      					console.log("Error writing data" + err);
	      				}
	      			});
	      		fs.writeFile('frame' + frameCounter + '.png', pngBuffer, function(err) {
	        		if (err) {
	        			console.log('Error saving PNG: ' + err);
	        		}
	        	});
	      	}
		});
	});
//Flight sequence
mission.takeoff()
	.zero()
	.go({x: 1, y: 0, z: 0, yaw: 0})
	.go({x: -1, y: 0, z: 1, yaw: 90})
	.land();

console.log("Executing");

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