var arDrone = require('ar-drone');
var fs = require('fs');
var autonomy = require('ardrone-autonomy');
var mission = autonomy.createMission();
var pngStream = mission.client().getPngStream();

var pictureTime = 5000;
var lastDataTime = 0;
var lastNavdataTime = 0;
var frameCounter = 0;

var data = []; //Store navigational data
var imageData = []; //Store images

mission.client().config('general:navdata_options', 777060865); // turn on GPS
mission.client().config('video:video_channel', 3); //Switch to bottom camera
mission.client().config('control:altitude_max', 30000); //Max altitude

fs.writeFile("navdata.txt", "", function(err) {
	if (err) {
		console.log("Error creating file");
	}
});

var writeToFile = function() {
	for (i = 0; i < imageData.length; i ++) {
		fs.writeFile('frame' + i + '.png', imageData[i], function(err) {
	        if (err) {
	   			console.log('Error saving PNG: ' + err);
     		}
	    });
	}
	for (var i = 0; i < data.length; i ++) {
		fs.appendFile('navdata.txt', 
	      	"heading = " + data[i][0] + "\n" 
	      	+ "mz = " + data[i][1] + "\n"
	      	+ "mx = " + data[i][2] + "\n"
	      	+ "latitude = " + data[i][3] + "\n"
	      	+ "longitude = " + data[i][4] + "\n"
	   		+ "elevation = " + data[i][5] + "\n \n",
   			function(err) {
	      		if (err) {
	      			console.log("Error writing data" + err);
	      		}
	      	}
	    );
	}
	console.log("Written files");
}

pngStream.on('data', function(pngBuffer) {
	var now = (new Date()).getTime();
	if (now - lastDataTime > pictureTime) {
		frameCounter ++;
		lastDataTime = now;
		imageData.push(pngBuffer);
	}
})

mission.client().on('navdata', function(navdata) {
	var now = (new Date()).getTime();
	if (now - lastNavdataTime > pictureTime && navdata.gps !== undefined) {
		lastNavdataTime = now;
		console.log("got navdata");
		var temp = [];
		temp.push(navdata.magneto.heading.unwrapped);
		temp.push(navdata.magneto.mz);
		temp.push(navdata.magneto.mx);
		temp.push(navdata.gps.latitude);
	    temp.push(navdata.gps.longitude);
	    temp.push(navdata.demo.altitude);
	    data.push(temp);
	};
});

mission.client().ftrim();
mission.takeoff().up(3).forward(10).left(10).backward(10).right(10).land();

mission.run(function (err, result) {
    if (err) {
        console.trace("Oops, something bad happened: %s", err.message);
        mission.client().stop();
        mission.client().land();
    } else {
        console.log("Mission success!");
        writeToFile();
        //process.exit(0);
    }
});
