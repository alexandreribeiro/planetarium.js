function Planetarium(div, options) {
	this.uiColor = '#ddd';
	this.uiFontSize = '14px';
	this.div = div;
	this.azimuth = 0;
	this.altitude = 0;
	this.observerLatitude = -23;
	this.observerLongitude = -43;
	this.observerAltitude = 0;
	this.azimuthFOVLength = 0;
	this.altitudeFOVLength = 0;
	this.zeroMagnitudeRadius = 10;
	this.magnitudeDecayRate = 2;
	this.fov = 120;
	this.date = new Date();
	this.windowInterval = null;
	this.showFloor = true;
	this.canvas = SVG(div);
	this.fullScreen = (options && options.hasOwnProperty('full-screen')) ? options['full-screen'] : false;
	this.setWidth((options && options.hasOwnProperty('width')) ? options['width'] : 960);
	this.setHeight((options && options.hasOwnProperty('height')) ? options['height'] : 720);
	this.originalWidth = (options && options.hasOwnProperty('width')) ? options['width'] : 960;
	this.originalHeight = (options && options.hasOwnProperty('height')) ? options['height'] : 720;
	this.objects = [];
	this.visibleObjectsList = [];
}

Planetarium.prototype.getCanvasPosition = function(azimuth, altitude) {
	position = Astronomy.stereographicalProjectionCoordinates(azimuth, altitude, this.azimuth, this.altitude);
	return [(position[0] * this.azimuthFOVLength) + this.halfWidth,
	        this.halfHeight - ((position[1] * this.altitudeFOVLength)) + this.heightDisplacement];
}

Planetarium.prototype.setWidth = function(width) {
	this.width = width;
	this.halfWidth = width / 2;
	this.inverseAspectRatio = (this.height && this.width) ? (this.height / this.width) : 1;
}

Planetarium.prototype.setHeight = function(height) {
	this.height = height;
	this.halfHeight = height / 2;
	this.inverseAspectRatio = (this.height && this.width) ? (this.height / this.width) : 1;
}

Planetarium.prototype.setDate = function(date) {
	this.date = date;
}

Planetarium.prototype.init = function() {
	thisPlanetarium = this;
	if (this.fullScreen) {
		this.enterFullScreen();
	} else {
		this.updateCanvasSize(this.width, this.height);
	}

	this.updateCanvas();

	var isDragging = false;
	var movementX, movementY, movementFinalX, movementFinalY, currentX, currentY = 0;
	var movementY = 0;

	$('#' + this.div).css('background', '#222');
	$('#' + this.div).mousedown(function(mousedownEvent) {
		mousedownEvent.preventDefault(); 
		currentX = mousedownEvent.pageX;
		currentY = mousedownEvent.pageY;
		isDragging = true;
	});

	$('#' + this.div).mouseup(function() { isDragging = false });
	$('#' + this.div).mouseleave(function() { isDragging = false });
	$('#' + this.div).mousemove(function(event) {
		if(isDragging){
			lastX = currentX;
			lastY = currentY;
			currentX = event.pageX;
			currentY = event.pageY;
			thisPlanetarium.move(currentX - lastX, currentY - lastY);
		}
	});

	$(window).on('resize', function() {
		if (thisPlanetarium.fullScreen) thisPlanetarium.enterFullScreen();
	});
}

Planetarium.prototype.pause = function() {
	window.clearInterval(this.windowInterval);
	this.windowInterval = null;
}

Planetarium.prototype.play = function() {
	thisPlanetarium = this;
	this.windowInterval = window.setInterval(function() {
		thisPlanetarium.updateCanvas();
	}, 100);
}

Planetarium.prototype.plotAltitudeLines = function() {
	for (var i = 0; i <= 85; i = i + 10 ) {
		var zeroCurvePosition = this.getCanvasPosition(this.azimuth - (180 / 2), i);
		var middleCurvePosition = this.getCanvasPosition(this.azimuth, i);
		var finalCurvePosition = this.getCanvasPosition(this.azimuth + (180 / 2), i);
		drawLine = 'M' + zeroCurvePosition[0] + ',' + zeroCurvePosition[1] + 'Q'+ middleCurvePosition[0] + ','
					+ (zeroCurvePosition[1] - 2 * (zeroCurvePosition[1] - middleCurvePosition[1])) + ','
					+ finalCurvePosition[0] +','+ finalCurvePosition[1];
		this.canvas.text(i + 'o').move(planetarium.halfWidth,
				middleCurvePosition[1] + 10).font({size: '8px'}).fill({color: this.uiColor});
		this.canvas.path(drawLine).fill('none').stroke({ width: 0.1, color: this.uiColor});
	}
}

Planetarium.prototype.updateCanvasMetrics = function() {
	this.azimuthFOVLength = this.width /
		(Astronomy.stereographicalProjectionCoordinates(this.azimuth + (this.fov / 2), 0, this.azimuth, 0)[0]
		- Astronomy.stereographicalProjectionCoordinates(this.azimuth - (this.fov / 2), 0, this.azimuth, 0)[0]);
	this.altitudeFOVLength = this.height /
		(2 * (Astronomy.stereographicalProjectionCoordinates(this.azimuth, this.altitude, this.azimuth, 0)[1]
		- Astronomy.stereographicalProjectionCoordinates(this.azimuth,
				this.altitude - ((this.fov * (this.height / this.width)) / 2), this.azimuth, 0)[1]));
	this.heightDisplacement = (this.altitudeFOVLength * Astronomy.stereographicalProjectionCoordinates(this.azimuth,
			this.altitude, this.azimuth, 0)[1]);
}

Planetarium.prototype.updateDate = function() {
	this.date = new Date();
}

Planetarium.prototype.updateCanvas = function() {
	this.updateDate();
	this.updateCanvasMetrics();
	this.canvas.clear();
	this.plotAltitudeLines();
	this.plotObjects();
	this.plotInformation();
}

Planetarium.prototype.plotInformation = function() {
	informationText = 'Field of View: ' + this.fov.toFixed(2) + ' degrees';
	this.canvas.text(informationText).move(20, 20).font({size: this.uiFontSize}).fill({color: this.uiColor});
	informationText = 'Altitude: ' + this.altitude.toFixed(2) + ' degrees';
	this.canvas.text(informationText).move(20, 40).font({size: this.uiFontSize}).fill({color: this.uiColor});
	informationText = 'Azimuth: ' + this.azimuth.toFixed(2) + ' degrees';
	this.canvas.text(informationText).move(20, 60).font({size: this.uiFontSize}).fill({color: this.uiColor});
	informationText = 'Current Time: ' + this.date.toString();
	this.canvas.text(informationText).move(20, 80).font({size: this.uiFontSize}).fill({color: this.uiColor});
}


Planetarium.prototype.move = function(displacementX, displacementY) {
	xDisplacement = displacementX * this.fov / this.width;
	yDisplacement =  displacementY * this.fov * this.inverseAspectRatio / this.height;
	newAzimuth = this.azimuth - xDisplacement;
	if (newAzimuth >= 360) newAzimuth = newAzimuth % 360;
	while (newAzimuth < 0) newAzimuth += 360;
	this.azimuth = newAzimuth;
	newAltitude = this.altitude + yDisplacement;
	if (newAltitude >= 0 && newAltitude <= 90) this.altitude = newAltitude;
	this.updateCanvas();
}

Planetarium.prototype.updateCanvasSize = function(width, height) {
	this.setWidth(width);
	this.setHeight(height);
	$('#' + this.div).width(width);
	$('#' + this.div).height(height);
	this.updateCanvas();
}

Planetarium.prototype.enterFullScreen = function() {
	$('#' + this.div).css('position', 'fixed');
	$('#' + this.div).css('top', 0);
	$('#' + this.div).css('left', 0);
	$('#' + this.div).css('margin', 0);
	this.updateCanvasSize(window.innerWidth, window.innerHeight);
}

Planetarium.prototype.leaveFullScreen = function() {
	$('#' + this.div).css('position', '');
	$('#' + this.div).css('top', '');
	$('#' + this.div).css('left', '');
	$('#' + this.div).css('margin', '');
	this.updateCanvasSize(this.originalWidth, this.originalHeight);
}

Planetarium.prototype.shouldUpdateVisibleObjectsList = function() {
	return true;
}


Planetarium.prototype.updateVisibleObjectsList = function() {
	if (this.shouldUpdateVisibleObjectsList()) {
		this.visibleObjectsList = [];
		for (i in this.objects) {
			azimuthAltitudeCoordinates =
				Astronomy.equatorialCoordinatesToAltitudeAzimuthCoordinates(this.objects[i].getRightAscension(),
					this.objects[i].getDeclination(), this.observerLongitude, this.observerLatitude, this.date);
			if (!this.showFloor || (this.showFloor && azimuthAltitudeCoordinates[1] >= 0)) {
				canvasPosition = this.getCanvasPosition(azimuthAltitudeCoordinates[0], azimuthAltitudeCoordinates[1]);
				if (canvasPosition[0] >= 0 && canvasPosition[0] <= this.width
						&& canvasPosition[1] >= 0 && canvasPosition[1] <= this.height) {
					this.visibleObjectsList.push(this.objects[i]);
				}
			}
		}
	}
}

Planetarium.prototype.loadStars = function(stars) {
	for (i in starCatalog) {
		this.objects.push(new Star(stars[i][0], stars[i][1], stars[i][2], stars[i][3], stars[i][4]));
	}
}

Planetarium.prototype.plotObjects = function() {
	this.updateVisibleObjectsList();
	for (i in this.visibleObjectsList) {
		this.visibleObjectsList[i].render(this);
	}
}
