function ConnectionConfig() {
}

//

ConnectionConfig.prototype.label = function() {
	return "Connection Settings";
}

//

ConnectionConfig.prototype.setup = function(controller) {
	// Wi-Fi, Bluetooth, GPS, Data and Phone toggle selectors

	this.choicesWIFISelector = [
		{'label': "Do Not Set", value: 0},
		{'label': "Enabled", value: 1},
		{'label': "Disabled", value: 2}];  

	controller.setupWidget("WIFISelector",	{'label': "Wi-Fi", 
		'labelPlacement': "left", 'modelProperty': "connectionWiFi",
		'choices': this.choicesWIFISelector});

	this.choicesBTSelector = [
		{'label': "Do Not Set", value: 0},
		{'label': "Enabled", 'value': 1},
		{'label': "Disabled", 'value': 2}];  

	controller.setupWidget("BTSelector", {'label': "Bluetooth", 
		'labelPlacement': "left", 'modelProperty': "connectionBT",
		'choices': this.choicesBTSelector});

	this.choicesGPSSelector = [
		{'label': "Do Not Set", value: 0},
		{'label': "Enabled", 'value': 1},
		{'label': "Disabled", 'value': 2}];  

	controller.setupWidget("GPSSelector",	{'label': "GPS", 
		'labelPlacement': "left", 'modelProperty': "connectionGPS",
		'choices': this.choicesGPSSelector});

	this.choicesDataSelector = [
		{'label': "Do Not Set", value: 0},
		{'label': "Enabled", 'value': 1},
		{'label': "Disabled", 'value': 2}];  

	controller.setupWidget("DataSelector",	{'label': "Data", 
		'labelPlacement': "left", 'modelProperty': "connectionData",
		'choices': this.choicesDataSelector});

	this.choicesPhoneSelector = [
		{'label': "Do Not Set", value: 0},
		{'label': "Enabled", 'value': 1},
		{'label': "Disabled", 'value': 2}];  

	controller.setupWidget("PhoneSelector", {'label': "Phone", 
		'labelPlacement': "left", 'modelProperty': "connectionPhone",
		'choices': this.choicesPhoneSelector});
}

//

ConnectionConfig.prototype.load = function(preferences) {
	var config = {
		'connectionWiFi': preferences.connectionWiFi,
		'connectionBT': preferences.connectionBT, 
		'connectionGPS': preferences.connectionGPS, 
		'connectionData': preferences.connectionData,
		'connectionPhone': preferences.connectionPhone };
	
	return config;
}

ConnectionConfig.prototype.save = function(config, preferences) {
	var preferences = {
		'connectionWiFi': config.connectionWiFi,
		'connectionBT': config.connectionBT, 
		'connectionGPS': config.connectionGPS, 
		'connectionData': config.connectionData,
		'connectionPhone': config.connectionPhone };
	
	return preferences;
}

//

ConnectionConfig.prototype.config = function() {
	var config = {
		'connectionWiFi': 0, 
		'connectionBT': 0, 
		'connectionGPS': 0, 
		'connectionData': 0, 
		'connectionPhone': 0 };
	
	return config;
}

