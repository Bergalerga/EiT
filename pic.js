var arDrone = require('ar-drone'); //Required AR-drone client
var fs = require('fs'); //Module for using local file system
var autonomy = require('ardrone-autonomy'); //Module to simplify drone navigation. Eg: mission.takeoff().land();
var mission = autonomy.createMission();
var pngStream = mission.client().getPngStream();

var pictureTime = 5000; //Time between each picture in milliseconds
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

//Function used to write data to the filesystem, this will only run after a successful mission. Thus, data
//will not be stored if the drone crashes or the fails in some way. 
//Data will be written when "Mission success" is printed to console.
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
//Incoming images are handled here. They are stored based in intervals based on the pictureTime variable
pngStream.on('data', function(pngBuffer) {
	var now = (new Date()).getTime();
	if (now - lastDataTime > pictureTime) {
		frameCounter ++;
		lastDataTime = now;
		imageData.push(pngBuffer);
	}
})
//Incoming navigational data are handled here. Stored based on pictureTime as well.
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

//START NAVIGATIONAL MISSION
//The method takes variables as meters. F.eks, forward(10) sends the drone forward 10 meters.
mission.client().ftrim();
mission.takeoff().up(3).forward(10).left(10).backward(10).right(10).land();
//END NAVIGATIONAL MISSION.

//Run method
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
