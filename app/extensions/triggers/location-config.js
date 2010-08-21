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

	this.choicesActiveSelector = [
		{'label': "When In Location", 'value': 0},
		{'label': "When Not In Location", 'value': 1}];  

	controller.setupWidget("LocationActiveSelector", {'label': "Active", 
		'labelPlacement': "left", 'modelProperty': "locationActive",
		'choices': this.choicesActiveSelector});

	this.choicesLocationSelector = [
		{'label': "Select Location", 'value': "select"},
		{'label': "Current Location", 'value': "current"}];  

	controller.setupWidget("LocationLocationSelector", {'label': "Location", 
		'labelPlacement': "left", 'modelProperty': "locationLocation",
		'choices': this.choicesLocationSelector});

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
		
	// Listen for change event for location selector
	
	controller.listen(controller.get("TriggersList"), Mojo.Event.propertyChange, 
		this.handleListChange.bind(this));
}

//

LocationConfig.prototype.config = function() {
	var config = {
		'locationActive': 0,
		'locationLocation': "No Location Set",
		'locationRadius': 200 };

	return config;
}

//

LocationConfig.prototype.load = function(preferences) {
	var latitude = -1;
	var longitude = -1;

	var location = "No Location Set";

	if(preferences.locationLatitude != undefined)
		latitude = preferences.locationLatitude;

	if(preferences.locationLongitude != undefined)
		longitude = preferences.locationLongitude;
		
	if((latitude != -1) || (longitude != -1)) {
		location = (Math.round(latitude*1000)/1000).toFixed(3) + 
			" ; " + (Math.round(longitude*1000)/1000).toFixed(3);
	}

	var config = {
		'locationActive': preferences.locationActive,		
		'locationLatitude': latitude,
		'locationLongitude': longitude,
		'locationLocation':  location,
		'locationRadius': preferences.locationRadius};
	
	return config;
}

LocationConfig.prototype.save = function(config) {
	var latitude = -1;
	var longitude = -1;

	if((config.locationLocation != "No Location Set") ||
		(config.locationLocation != "Failed to Locate") ||
		(config.locationLocation != "Querying Location"))
	{
		latitude = config.locationLatitude;
		longitude = config.locationLongitude;
	}
		
	var preferences = {
		'locationActive': config.locationActive,
		'locationLatitude': latitude,
		'locationLongitude': longitude,
		'locationRadius': config.locationRadius };
	
	return preferences;
}

//

LocationConfig.prototype.handleListChange = function(event) {
	if(event.property == "locationLocation") {
		if(event.value == "select") {
			var coords = null;

			event.model.locationLocation = "No Location Set";

			if((event.model.locationLatitude != -1) && (event.model.locationLongitude != -1)) {
				var coords = {lat: event.model.locationLatitude, lng: event.model.locationLongitude};
				
				event.model.locationLocation = event.model.locationLatitude + " ; " + event.model.locationLongitude;
			}

			this.controller.modelChanged(event.model, this);
			
			var callback = this.handleLocationSelect.bind(this, event.model);
	
			this.controller.stageController.pushScene("scene", "pickLocation", coords, callback);
		}
		else if(event.value == "current") {
			event.model.locationLocation = "Querying Location";

			this.controller.modelChanged(event.model, this);			

			this.fetchCurrentLocation(event.model, 0);
		}
	}
}

LocationConfig.prototype.handleLocationSelect = function(model, latitude, longitude, returnValue) {
	if(returnValue) {
		model.locationLocation = (Math.round(latitude*1000)/1000).toFixed(3) + 
			" ; " + (Math.round(longitude*1000)/1000).toFixed(3);
		
		model.locationLatitude = latitude;
		model.locationLongitude = longitude;
		
		this.controller.modelChanged(model, this);					
	}
}

//

LocationConfig.prototype.fetchCurrentLocation = function(model, retry) {
	Mojo.Log.error("Fetching current location: " + retry);

	if(retry < 20) {
		this.controller.serviceRequest("palm://com.palm.location/", {
			'method': "getCurrentPosition", 'parameters': {'Accuracy': 1},
			'onSuccess': this.handleCurrentLocation.bind(this, model, retry),
			'onFailure': this.fetchCurrentLocation.bind(this, model, ++retry)});
	}
	else {
		model.locationLocation = "Failed to Locate";
	
		model.locationLatitude = -1;
		model.locationLongitude = -1;
		
		this.controller.modelChanged(model, this);
	}
}

LocationConfig.prototype.handleCurrentLocation = function(model, retry, response) {
	if((response.horizAccuracy == -1) || (response.horizAccuracy > 100)) {	
		Mojo.Log.error("Insufficient location accuracy: " + response.horizAccuracy);

		this.fetchCurrentLocation(model, ++retry);
	}
	else {
		model.locationLocation = (Math.round(response.latitude*1000)/1000).toFixed(3) + 
			" ; " + (Math.round(response.longitude*1000)/1000).toFixed(3);
	
		model.locationLatitude = Math.round(response.latitude*1000000)/1000000;
		model.locationLongitude = Math.round(response.longitude*1000000)/1000000;
			
		this.controller.modelChanged(model, this);
	}
}

