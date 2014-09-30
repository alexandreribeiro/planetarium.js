function PlanetariumMenu(planetarium, options) {
	this.planetarium = planetarium;
	this.div = null;
}

PlanetariumMenu.prototype.render = function() {
	thisMenu = this;
	this.createStyles();

	this.div = document.createElement('div');
	this.div.style.position = 'relative';
	this.div.style.background = 'rgba(255, 255, 255, 0.1)';
	this.div.style.height = '60px';
	this.div.style.marginTop = '-60px';

	button = document.createElement('button');
	button.style.margin = '10px 0 0 10px';
	button.style.position = 'relative';
	button.style.top = 0;
	button.style.bottom = 0;
	button.appendChild(document.createTextNode('Change Location'));
	button.onclick = function() {
		thisMenu.openLocationCoordinatesModal();
	}
	this.div.appendChild(button);

	button = document.createElement('button');
	button.style.margin = '10px 0 0 10px';
	button.style.position = 'relative';
	button.style.top = 0;
	button.style.bottom = 0;
	button.appendChild(document.createTextNode('Show/Hide Alt/Az Grid'));
	button.onclick = function() {
		thisMenu.toogleAltAzGrid();
	}
	this.div.appendChild(button);

	this.planetarium.div.appendChild(this.div);
}

PlanetariumMenu.prototype.openLocationCoordinatesModal = function() {
	thisMenu = this;

	modal = document.getElementById('modal');
	if (modal) this.planetarium.div.removeChild(modal);
	modal = document.createElement('div');
	modal.setAttribute('id', 'modal');
	modal.style.margin = 'auto';
	modal.style.position = 'absolute';
	modal.style.top = 0;
	modal.style.bottom = 0;
	modal.style.left = 0;
	modal.style.right = 0;
	modal.style.height = '40px';
	modal.style.width = '640px';
	modal.style.fontSize = '16px';
	modal.style.color = '#FFF';
	modal.style.background = 'rgba(255, 255, 255, 0.1)';
	modal.style.padding = '20px';

	modal.appendChild(document.createTextNode('Latitude'));

	observerLatitudeInput = document.createElement('input');
	observerLatitudeInput.setAttribute('id', 'observerLatitude');
	observerLatitudeInput.style.width = '140px';
	observerLatitudeInput.type = 'text';
	// using Function.prototype.bind to access 'this' at runtime
	observerLatitudeInput.value = this.planetarium.getObserverLatitude.bind(this.planetarium)();
	observerLatitudeInput.style.padding = '10px';
	observerLatitudeInput.style.margin = '0 10px';
	observerLatitudeInput.style.color = '#777';
	modal.appendChild(observerLatitudeInput);

	modal.appendChild(document.createTextNode('Longitude'));

	observerLongitudeInput = document.createElement('input');
	observerLongitudeInput.setAttribute('id', 'observerLongitude');
	observerLongitudeInput.style.width = '140px';
	observerLongitudeInput.type = 'text';
	// using Function.prototype.bind to access 'this' at runtime
	observerLongitudeInput.value = this.planetarium.getObserverLongitude.bind(this.planetarium)();
	observerLongitudeInput.style.padding = '10px';
	observerLongitudeInput.style.margin = '0 10px';
	observerLongitudeInput.style.color = '#777';
	modal.appendChild(observerLongitudeInput);

	button = document.createElement('button');
	button.style.padding = '0 20px';
	button.appendChild(document.createTextNode('Update'));
	button.onclick = function() {
		thisMenu.setPlanetariumAttribute('setObserverLatitude', observerLatitudeInput.value);
		thisMenu.setPlanetariumAttribute('setObserverLongitude', observerLongitudeInput.value);
		thisMenu.closeLocationCoordinatesModal();
	}

	modal.appendChild(button);

	button = document.createElement('button');
	button.style.marginLeft = '10px';
	button.appendChild(document.createTextNode('Close'));
	button.onclick = function() {
		thisMenu.closeLocationCoordinatesModal();
	}

	modal.appendChild(button);

	this.planetarium.div.appendChild(modal);
}

PlanetariumMenu.prototype.closeLocationCoordinatesModal = function() {
	modal = document.getElementById('modal');
	if (modal) this.planetarium.div.removeChild(modal);
}

PlanetariumMenu.prototype.toogleAltAzGrid = function() {
	this.setPlanetariumAttribute('setShowAltAzGrid', !this.planetarium.getShowAltAzGrid.bind(this.planetarium)());
}

PlanetariumMenu.prototype.setPlanetariumAttribute = function(attribute, value) {
	if (attribute in this.planetarium) {
		_function = this.planetarium[attribute].bind(this.planetarium);
		_function.call(attribute, value);
	}
}

PlanetariumMenu.prototype.createStyles = function() {
	style = document.createElement('style');
	style.type = 'text/css';
	style.innerHTML = 'button { padding: 0 20px; height: 40px; border: 0; cursor: pointer; font-weight: bold; margin: auto; }';
	document.getElementsByTagName('head')[0].appendChild(style);
}