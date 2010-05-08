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
		{'label': "Enabled", value: 1},
		{'label': "Disabled", value: 0}];  

	controller.setupWidget("WIFISelector",	{'label': "Wi-Fi", 
		'labelPlacement': "left", 'modelProperty': "connectionWiFi",
		'choices': this.choicesWIFISelector});

	this.choicesBTSelector = [
		{'label': "Enabled", 'value': 1},
		{'label': "Disabled", 'value': 0}];  

	controller.setupWidget("BTSelector", {'label': "Bluetooth", 
		'labelPlacement': "left", 'modelProperty': "connectionBT",
		'choices': this.choicesBTSelector});

	this.choicesGPSSelector = [
		{'label': "Enabled", 'value': 1},
		{'label': "Disabled", 'value': 0}];  

	controller.setupWidget("GPSSelector",	{'label': "GPS", 
		'labelPlacement': "left", 'modelProperty': "connectionGPS",
		'choices': this.choicesGPSSelector});

	this.choicesDataSelector = [
		{'label': "Enabled", 'value': 1},
		{'label': "Disabled", 'value': 0}];  

	controller.setupWidget("DataSelector",	{'label': "Data", 
		'labelPlacement': "left", 'modelProperty': "connectionData",
		'choices': this.choicesDataSelector});

	this.choicesPhoneSelector = [
		{'label': "Enabled", 'value': 1},
		{'label': "Disabled", 'value': 0}];  

	controller.setupWidget("PhoneSelector", {'label': "Phone", 
		'labelPlacement': "left", 'modelProperty': "connectionPhone",
		'choices': this.choicesPhoneSelector});
}

//

ConnectionConfig.prototype.load = function(config, preferences) {
	config.push({'connectionWiFi': preferences.connectionWiFi,
		'connectionBT': preferences.connectionBT, 
		'connectionGPS': preferences.connectionGPS, 
		'connectionData': preferences.connectionData,
		'connectionPhone': preferences.connectionPhone});
}

ConnectionConfig.prototype.save = function(config, preferences) {
	preferences.push({'connectionWiFi': config.connectionWiFi,
		'connectionBT': config.connectionBT, 
		'connectionGPS': config.connectionGPS, 
		'connectionData': config.connectionData,
		'connectionPhone': config.connectionPhone});
}

//

ConnectionConfig.prototype.append = function(config, saveCallback) {
	config.push({'connectionWiFi': "(querying)", 'connectionBT': "(querying)", 
		'connectionGPS': "(querying)", 'connectionData': "(querying)", 
		'connectionPhone': "(querying)"});
	
	saveCallback();
}

ConnectionConfig.prototype.remove = function(config, index, saveCallback) {
	config.splice(index,1);

	saveCallback();
}

//

ConnectionConfig.prototype.changed = function(config, event, saveCallback) {
	saveCallback();
}

ConnectionConfig.prototype.tapped = function(config, event, saveCallback) {
}

