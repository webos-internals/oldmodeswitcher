function LocationConfig() {
}

LocationConfig.prototype.version = function() {
	return "1.1";
}

LocationConfig.prototype.label = function() {
	return "GPS Location Trigger";
}

//

LocationConfig.prototype.activate = function() {
}

LocationConfig.prototype.deactivate = function() {
}

//

LocationConfig.prototype.setup = function(controller) {
	this.controller = controller;

	this.choicesRadiusSelector = [
		{'label': "100 Meters", 'value': 200},
		{'label': "250 Meters", 'value': 500},
		{'label': "500 Meters", 'value': 800},
		{'label': "1000 Meters", 'value': 1000},
		{'label': "1500 Meters", 'value': 1500},
		{'label': "2000 Meters", 'value': 2000}];  

	controller.setupWidget("LocationRadiusSelector", {'label': "Radius", 
		'labelPlacement': "left", 'modelProperty': "locationRadius",
		'choices': this.choicesRadiusSelector});
}

//

LocationConfig.prototype.config = function() {
	var config = {
		'locationRadius': 200,
		'locationLatitude': "(locating)",
		'locationLongitude': "(locating)" };

	this.fetchCurrentLocation(config, 0);
		
	return config;
}

//

LocationConfig.prototype.load = function(preferences) {
	var config = {
		'locationRadius': preferences.locationRadius,
		'locationLatitude': preferences.locationLatitude,
		'locationLongitude': preferences.locationLongitude };
	
	return config;
}

LocationConfig.prototype.save = function(config) {
	var preferences = {
		'locationRadius': config.locationRadius,
		'locationLatitude': config.locationLatitude,
		'locationLongitude': config.locationLongitude };
	
	return preferences;
}

//

LocationConfig.prototype.fetchCurrentLocation = function(config, retry) {
	Mojo.Log.error("Fetching current location: " + retry);

	if(retry < 20) {
		this.controller.serviceRequest("palm://com.palm.location/", {
			'method': "getCurrentPosition", 'parameters': {'Accuracy': 1},
			'onSuccess': this.handleCurrentLocation.bind(this, config, retry),
			'onFailure': this.fetchCurrentLocation.bind(this, config, ++retry)});
	}
	else {
		config.locationLatitude = "(failed)";
		config.locationLongitude = "(failed)";
		
		this.controller.get("TriggersList").mojo.invalidateItems(0);
	}
}

LocationConfig.prototype.handleCurrentLocation = function(config, retry, response) {
	if((response.horizAccuracy == -1) || (response.horizAccuracy > 100)) {	
		Mojo.Log.error("Insufficient location accuracy: " + response.horizAccuracy);

		this.fetchCurrentLocation(config, ++retry);
	}
	else {
		config.locationLatitude = Math.round(response.latitude*1000000)/1000000;
		config.locationLongitude = Math.round(response.longitude*1000000)/1000000;
			
		this.controller.get("TriggersList").mojo.invalidateItems(0);
	}
}

