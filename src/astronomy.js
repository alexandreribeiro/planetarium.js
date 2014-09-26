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

function Astronomy() {
	
}

Astronomy.radianToDegree = function(radian) {
	return radian * (180 / Math.PI);
}

Astronomy.degreeToRadian = function (degree) {
	return degree * (Math.PI / 180);
}

Astronomy.modRadian = function(radian) {
	while (radian < 0) {
		radian = radian + (2 * Math.PI);
	}
	return radian % (2 * Math.PI);
}

Astronomy.modAngle = function(angle) {
	while (angle < 0) {
		angle = angle + 360;
	}
	return angle % 360;
}

Astronomy.julianDate = function(date) {
    return ((date / MS_PER_DAY) + 2440587.5);
}

Astronomy.centuriesSinceStartOfEpoch2000 = function(date) {
	return (Astronomy.julianDate(date) - JULIAN_DAY_2000) / JULIAN_DAYS_PER_CENTURY;
}

Astronomy.julianDaysSinceStartOfEpoch2000 = function(date) {
	return (Astronomy.julianDate(date) - JULIAN_DAY_2000);
}

Astronomy.greenwichSiderealTime = function(date) {
	d = Astronomy.julianDaysSinceStartOfEpoch2000(date);
	t = Astronomy.centuriesSinceStartOfEpoch2000(date);
	return Astronomy.modAngle((280.46061837) + (360.98564736629 * d) + (0.000387933 * t * t) - ((t * t * t) / 38710000));
}

Astronomy.localSiderealTime = function(date, longitude) {
	return Astronomy.modAngle(Astronomy.greenwichSiderealTime(date) + longitude);
}

Astronomy.equatorialCoordinatesToAltitudeAzimuthCoordinates = function(rightAscension, declination, longitude, latitude, date) {
	hourAngle = Astronomy.modAngle(rightAscension - Astronomy.localSiderealTime(date, longitude));
	altitude = Math.asin(Math.sin(latitude * DEGREE) * Math.sin(declination * DEGREE) + Math.cos(latitude * DEGREE) * Math.cos(declination * DEGREE) * Math.cos(hourAngle * DEGREE)) * 180 / Math.PI;
	azimuth = (Math.PI - Math.atan2(Math.sin(hourAngle * DEGREE), Math.cos(hourAngle * DEGREE) * Math.sin(latitude * DEGREE) - Math.tan(declination * DEGREE) * Math.cos(latitude * DEGREE))) * 180 / Math.PI;
	return [azimuth, altitude];
}

Astronomy.stereographicalProjectionCoordinates = function(objectAzimuth, objectAltitude, observerAzimuth, observerAltitude) {
	RADIUS = 1;
	objectAzimuth = Astronomy.degreeToRadian(objectAzimuth);
	objectAltitude = Astronomy.degreeToRadian(objectAltitude);
	observerAzimuth = Astronomy.degreeToRadian(observerAzimuth);
	observerAltitude = 0;
	var k = (2 * RADIUS) / (1 + Math.sin(observerAltitude) * Math.sin(objectAltitude) + Math.cos(observerAltitude) * Math.cos(objectAltitude) * Math.cos(objectAzimuth - observerAzimuth));
	var x = k * Math.cos(objectAltitude) * Math.sin(objectAzimuth - observerAzimuth);
	var y = k * (Math.cos(observerAltitude) * Math.sin(objectAltitude) - Math.sin(observerAltitude) * Math.cos(objectAltitude) * Math.cos(objectAzimuth - objectAzimuth));
	return [x, y];
}

Astronomy.prototype.azimuthToCardinalPoint = function(degree) {
	switch(degree) {
		case 0:
			return 'N';
		case 90:
			return 'E'
		case 180:
			return 'S';
		case 270:
			return 'W';
		default:
			return '?';
	}
}