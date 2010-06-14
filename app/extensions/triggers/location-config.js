function LocationConfig() {
}

//

LocationConfig.prototype.label = function() {
	return "GPS Location Trigger";
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

	controller.setupWidget("RadiusSelector", {'label': "Radius", 
		'labelPlacement': "left", 'modelProperty': "locationRadius",
		'choices': this.choicesRadiusSelector});
}

//

LocationConfig.prototype.load = function(config, data) {
	config.push({"locationRadius": data.locationRadius, 
		"locationLatitude": data.locationLatitude,
		"locationLongitude": data.locationLongitude});
}

LocationConfig.prototype.save = function(config, data) {
	data.push({"locationRadius": config.locationRadius, 
		"locationLatitude": config.locationLatitude,
		"locationLongitude": config.locationLongitude});
}

//

LocationConfig.prototype.append = function(config, saveCallback) {
	var cfg = {"locationRadius": 200, "locationLatitude": "(locating)", "locationLongitude": "(locating)"};

	config.push(cfg);

	saveCallback(true);

	this.fetchCurrentLocation(cfg, saveCallback, 0);
}

LocationConfig.prototype.remove = function(config, index, saveCallback) {
	config.splice(index,1);

	saveCallback(true);
}

//

LocationConfig.prototype.changed = function(config, event, saveCallback) {
	saveCallback();
}

LocationConfig.prototype.tapped = function(config, event, saveCallback) {
}

//

LocationConfig.prototype.fetchCurrentLocation = function(cfg, saveCallback, retry) {
	if(retry < 10) {
		this.controller.serviceRequest("palm://com.palm.location/", {
			method:"getCurrentPosition",
			parameters:{Accuracy: 1},
			onSuccess: function(cfg, saveCallback, event){
				cfg.locationLatitude = Math.round(event.latitude*1000000)/1000000;
				cfg.locationLongitude = Math.round(event.longitude*1000000)/1000000;
					
				saveCallback(true);
			}.bind(this, cfg, saveCallback),
			onFailure: function(cfg, saveCallback, retry){
				this.fetchCurrentLocation(cfg, saveCallback, ++retry);
			}.bind(this, cfg, saveCallback, retry)});
	}
	else {
		cfg.locationLatitude = "(failed)";
		cfg.locationLongitude = "(failed)";
					
		saveCallback();
	}
}

