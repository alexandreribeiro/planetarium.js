const QUARTER = Math.PI / 2;
const DEGREE = QUARTER / 90;
const ARCSEC = DEGREE / 3600;
const MS_PER_HOUR = 3600 * 1000;
const MS_PER_DAY = MS_PER_HOUR * 24;
const MS_PER_YEAR = MS_PER_DAY * 365.2422;
const JULIAN_DAY_OFFSET = 2440587.5; // JD at python time zero
const JULIAN_DAY_2000 = 2451545; // JD at 1/1/2000 (Epoch for RA-Dec)
const JULIAN_DAYS_PER_CENTURY = 36525;
const POLAR_TO_EQUATORIAL_RATE = 0.99664719;
const EARTH_RADIUS_IN_KM = 6378.14;
const SIDEREAL_DAY_IN_MS = 23.9344696 * MS_PER_HOUR;
const EARTH_SIDEREAL_ROTATION_IN_RADIANS_PER_MS = (2 * Math.PI) / SIDEREAL_DAY_IN_MS;
const MOON_PERIOD = 29.530588861 * MS_PER_DAY;
const EPS = 1 ^ (-12);

var OBSERVER_LATITUDE = -23;
var OBSERVER_LONGITUDE = -43;
var WIDTH = 960;
var HEIGHT = 720;
var INVERSE_ASPECT_RATIO = HEIGHT / WIDTH;
var HALF_HEIGHT = HEIGHT / 2;
var HALF_WIDTH = WIDTH / 2;
var FOV = 120;
var azimuthValue = 0;
var altitudeValue = 0;
var azimuthFOVLength = 0;
var isFullScreen = false;
var zeroMagnitudeRadius = 10;
var magnitudeDecayRate = 2;
var globalReferenceDateTime = new Date();
var isPaused = false;

var canvas = SVG('planetarium');

$(document).ready(function() {
	$('#planetarium').css('background', '#222');
	enterFullScreen();
	updatePlanetariumFrame(globalReferenceDateTime);
	$("#updateFrame").click(function(){
		updatePlanetariumFrame(globalReferenceDateTime);
	});
    var isDragging = false;
	var movementX, movementY, movementFinalX, movementFinalY, currentX, currentY = 0;
	var movementY = 0;

	$('#planetarium').mousedown(function(mousedownEvent) {
		mousedownEvent.preventDefault(); 
		currentX = mousedownEvent.pageX;
		currentY = mousedownEvent.pageY;
		isDragging = true;
	});
	$('#planetarium').mouseup(function() { isDragging = false });
	$('#planetarium').mouseleave(function() { isDragging = false });
	$('#planetarium').mousemove(function(event) {
		if(isDragging){
			lastX = currentX;
			lastY = currentY;
			currentX = event.pageX;
			currentY = event.pageY;
			updatePlanetariumForDisplacement(currentX - lastX, currentY - lastY);
		}
	});
});


setInterval(function() {
	globalReferenceDateTime = new Date();
	updatePlanetariumFrame(globalReferenceDateTime);
}, 100);


function updatePlanetariumForDisplacement(displacementX, displacementY) {
	var xDisplacement = displacementX * FOV / WIDTH;
	var yDisplacement =  displacementY * FOV * INVERSE_ASPECT_RATIO / HEIGHT;
	newAzimuth = azimuthValue - xDisplacement;
	if (newAzimuth >= 360) newAzimuth = newAzimuth % 360;
	while (newAzimuth < 0) newAzimuth += 360;
	azimuthValue = newAzimuth;
	newAltitude = altitudeValue + yDisplacement;
	if (newAltitude >= 0 && newAltitude <= 90) altitudeValue = newAltitude;
	updatePlanetariumFrame(globalReferenceDateTime);
}

$(window).resize(function() {
	if (isFullScreen) enterFullScreen();
});

function updatePlanetariumFrame(referenceDateTime) {
	azimuthValue = azimuthValue;
	altitudeValue = altitudeValue;
	azimuthFOVLength = WIDTH / (stereographicalProjectionCoordinates(azimuthValue+(FOV/2), 0, azimuthValue, 0)[0] - stereographicalProjectionCoordinates(azimuthValue-(FOV/2), 0, azimuthValue, 0)[0]);
	altitudeFOVLength = HEIGHT / (2*(stereographicalProjectionCoordinates(azimuthValue, altitudeValue, azimuthValue, 0)[1] - stereographicalProjectionCoordinates(azimuthValue, altitudeValue - ((FOV*(HEIGHT/WIDTH))/2), azimuthValue, 0)[1]));
	heightDisplacement = (altitudeFOVLength * stereographicalProjectionCoordinates(azimuthValue, altitudeValue, azimuthValue, 0)[1]);
	canvas.clear();
	updateStars(referenceDateTime);
	plotInformation();
}

var stars = [];

function degreeToRadian(degree) {
	return degree * (Math.PI / 180);
}

function radianToDegree(radian) {
	return radian * (180 / Math.PI);
}

Date.prototype.julianDate = function() {
    return ((this / MS_PER_DAY) + 2440587.5);
}

Date.prototype.centuriesSinceStartOfEpoch2000 = function() {
	return (this.julianDate() - JULIAN_DAY_2000) / JULIAN_DAYS_PER_CENTURY;
}

Date.prototype.julianDaysSinceStartOfEpoch2000 = function() {
	return (this.julianDate() - JULIAN_DAY_2000);
}

function modRadian(x) {
	while (x < 0) {
		x = x + (2 * Math.PI);
	}
	return x % (2 * Math.PI);
}

function modAngle(x) {
	while (x < 0) {
		x = x + 360;
	}
	return x % 360;
}

function greenwichSiderealTime(date) {
	var d = date.julianDaysSinceStartOfEpoch2000();
	var t = date.centuriesSinceStartOfEpoch2000();
	return modAngle((280.46061837) + (360.98564736629 * d) + (0.000387933 * t * t) - ((t * t * t) / 38710000));
}

function localSiderealTime(date, longitude) {
	return modAngle(greenwichSiderealTime(date) + longitude);
}

function equatorialToAltitudeAzimuth(rightAscension, declination, longitude, latitude, date) {
	var hourAngle = modAngle(rightAscension - localSiderealTime(date, longitude));
	var altitude = Math.asin(Math.sin(latitude * DEGREE) * Math.sin(declination * DEGREE) + Math.cos(latitude * DEGREE) * Math.cos(declination * DEGREE) * Math.cos(hourAngle * DEGREE)) * 180 / Math.PI;
	var azimuth = (Math.PI - Math.atan2(Math.sin(hourAngle * DEGREE), Math.cos(hourAngle * DEGREE) * Math.sin(latitude * DEGREE) - Math.tan(declination * DEGREE) * Math.cos(latitude * DEGREE))) * 180 / Math.PI;
	return [azimuth, altitude];
}

function stereographicalProjectionCoordinates(objectAzimuth, objectAltitude, observerAzimuth, observerAltitude) {
	const RADIUS = 1;
	objectAzimuth = degreeToRadian(objectAzimuth);
	objectAltitude = degreeToRadian(objectAltitude);
	observerAzimuth = degreeToRadian(observerAzimuth);
	observerAltitude = 0;
	var k = (2 * RADIUS) / (1 + Math.sin(observerAltitude)*Math.sin(objectAltitude) + Math.cos(observerAltitude)*Math.cos(objectAltitude)*Math.cos(objectAzimuth-observerAzimuth));
	var x = k * Math.cos(objectAltitude) * Math.sin(objectAzimuth-observerAzimuth);
	var y = k * (Math.cos(observerAltitude)*Math.sin(objectAltitude) - Math.sin(observerAltitude)*Math.cos(objectAltitude)*Math.cos(objectAzimuth-objectAzimuth));
	return [x, y];
}

function updateStars(referenceDateTime) {
	$.each(starCatalog, function(index, star) {
		var azAlt = equatorialToAltitudeAzimuth(star['ra'], star['dec'], OBSERVER_LONGITUDE, OBSERVER_LATITUDE, referenceDateTime);
		plotStar(azAlt[0], azAlt[1], star['mag'], star['type']);
	});
	plotAltitudeLines();
}

function plotStar(azimuth, altitude, magnitude, spectralType) {
	if (altitude >= 0) {
		var starRadius = zeroMagnitudeRadius-(magnitude*magnitudeDecayRate);
		if (starRadius > 0) {
			var starPosition = stereographicalProjectionCoordinates(azimuth, altitude, azimuthValue, altitudeValue);
			var planetariumStarPosition = [(starPosition[0] * azimuthFOVLength) + HALF_WIDTH, HALF_HEIGHT - ((starPosition[1] * altitudeFOVLength)) + heightDisplacement];
			
			if (planetariumStarPosition[0] >= 0 && planetariumStarPosition[0] <= WIDTH && planetariumStarPosition[1] >= 0 && planetariumStarPosition[1] <= HEIGHT) {
				canvas.circle(starRadius).center(planetariumStarPosition[0], planetariumStarPosition[1]).fill({color: starColor(spectralType)});
			}
		}
	}
}

function plotAltitudeLines() {
	for (var i = 0; i <= 85; i = i + 10 ) {
		var zeroAzimuthPosition = stereographicalProjectionCoordinates(azimuthValue-(180/2), i, azimuthValue, altitudeValue);
		var zeroAzimuthPlanetaryPosition = [(zeroAzimuthPosition[0] * azimuthFOVLength) + HALF_WIDTH, HALF_HEIGHT - ((zeroAzimuthPosition[1] * altitudeFOVLength)) + heightDisplacement];
		var middleAzimuthPosition = stereographicalProjectionCoordinates(azimuthValue, i, azimuthValue, altitudeValue);
		var middleAzimuthPlanetaryPosition = [(middleAzimuthPosition[0] * azimuthFOVLength) + HALF_WIDTH, HALF_HEIGHT - ((middleAzimuthPosition[1] * altitudeFOVLength)) + heightDisplacement];
		var finalAzimuthPosition = stereographicalProjectionCoordinates(azimuthValue+(180/2), i, azimuthValue, altitudeValue);
		var finalAzimuthPlanetaryPosition = [(finalAzimuthPosition[0] * azimuthFOVLength) + HALF_WIDTH, HALF_HEIGHT - ((finalAzimuthPosition[1] * altitudeFOVLength)) + heightDisplacement];
		drawLine = 'M' + zeroAzimuthPlanetaryPosition[0]+","+zeroAzimuthPlanetaryPosition[1]+"Q"+ middleAzimuthPlanetaryPosition[0] +","+ (zeroAzimuthPlanetaryPosition[1] - 2*(zeroAzimuthPlanetaryPosition[1] - middleAzimuthPlanetaryPosition[1])) +","+ finalAzimuthPlanetaryPosition[0] +","+ finalAzimuthPlanetaryPosition[1];
		canvas.text(i + "o").move(HALF_WIDTH, middleAzimuthPlanetaryPosition[1] + 10).font({size: '8px'}).fill({color: '#ddd'});
		canvas.path(drawLine).fill('none').stroke({ width: 0.1, color: '#ddd'});
	}
}

function plotInformation() {
	var informationText = "Field of View: " + FOV.toFixed(2) + " degrees";
	canvas.text(informationText).move(20, 20).font({size: '14px'}).fill({color: '#ddd'});
	var informationText = "Altitude: " + altitudeValue.toFixed(2) + " degrees";
	canvas.text(informationText).move(20, 40).font({size: '14px'}).fill({color: '#ddd'});
	var informationText = "Azimuth: " + azimuthValue.toFixed(2) + " degrees";
	canvas.text(informationText).move(20, 60).font({size: '14px'}).fill({color: '#ddd'});
	var informationText = "Current Time: " + globalReferenceDateTime.toString();
	canvas.text(informationText).move(20, 80).font({size: '14px'}).fill({color: '#ddd'});
}

function starColor(spectralType) {
	switch(spectralType[0]) {
		case 'O':
			return '#99F';
		case 'B':
			return '#BBF'
		case 'A':
			return '#DDF';
		case 'F':
			return '#FFF';
		case 'G':
			return '#FFA';
		case 'K':
			return '#FC0';
		case 'M':
			return '#F90';
		case '*':
			return '#0F0';
		default:
			return '#FFF';
	}
}

function updatePlanetariumSize(width, height) {
	WIDTH = window.innerWidth;
	HEIGHT = window.innerHeight;
	INVERSE_ASPECT_RATIO = HEIGHT / WIDTH;
	HALF_HEIGHT = HEIGHT / 2;
	HALF_WIDTH = WIDTH / 2;
	$('#planetarium').width(WIDTH);
	$('#planetarium').height(HEIGHT);
	$('#planetarium').css('position', 'fixed');
	$('#planetarium').css('top', 0);
	$('#planetarium').css('left', 0);
	$('#planetarium').css('margin', 0);
	updatePlanetariumFrame(globalReferenceDateTime);
}

function enterFullScreen() {
	isFullScreen = true;
	updatePlanetariumSize(window.innerWidth, window.innerHeight);
}
