function Star(name, rightAscension, declination, magnitude, spectralType) {
	this.name = name;
	this.rightAscension = rightAscension;
	this.declination = declination;
	this.magnitude = magnitude;
	this.spectralType = spectralType;
}

Star.prototype.render = function(planetarium) {
	starRadius = planetarium.zeroMagnitudeRadius - (this.getMagnitude() * planetarium.magnitudeDecayRate);
	azimuthAltitudeCoordinates =
		Astronomy.equatorialCoordinatesToAltitudeAzimuthCoordinates(this.getRightAscension(), this.getDeclination(),
			planetarium.observerLongitude, planetarium.observerLatitude, planetarium.date);
	canvasPosition = planetarium.getCanvasPosition(azimuthAltitudeCoordinates[0], azimuthAltitudeCoordinates[1]);
	planetarium.canvas.circle(starRadius).center(canvasPosition[0],
			canvasPosition[1]).fill({color: this.getRGBColor(this.getSpectralType())});
}

Star.prototype.getName = function() {
	return this.name;
}

Star.prototype.getRightAscension = function() {
	return this.rightAscension;
}

Star.prototype.getDeclination = function() {
	return this.declination;
}

Star.prototype.getMagnitude = function() {
	return this.magnitude;
}

Star.prototype.getSpectralType = function() {
	return this.spectralType;
}

Star.prototype.getRGBColor = function(spectralType) {
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