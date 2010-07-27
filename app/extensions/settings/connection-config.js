function ConnectionConfig() {
}

ConnectionConfig.prototype.version = function() {
	return "1.0";
}

//

ConnectionConfig.prototype.label = function() {
	return "Connection Settings";
}

//

ConnectionConfig.prototype.activate = function() {
}

ConnectionConfig.prototype.deactivate = function() {
}

//

ConnectionConfig.prototype.setup = function(controller) {
	this.choicesPhoneSelector = [
		{'label': controller.defaultChoiseLabel, value: -1},
		{'label': "Enabled", 'value': 1},
		{'label': "Disabled", 'value': 0} ];  

	controller.setupWidget("ConnectionPhoneSelector", {'label': "Phone", 
		'labelPlacement': "left", 'modelProperty': "connectionPhone",
		'choices': this.choicesPhoneSelector});

	this.choicesDataSelector = [
		{'label': controller.defaultChoiseLabel, value: -1},
		{'label': "Enabled", 'value': 1},
		{'label': "Disabled", 'value': 0} ];  

	controller.setupWidget("ConnectionDataSelector",	{'label': "Data", 
		'labelPlacement': "left", 'modelProperty': "connectionData",
		'choices': this.choicesDataSelector});

	this.choicesWIFISelector = [
		{'label': controller.defaultChoiseLabel, value: -1},
		{'label': "Enabled", value: 1},
		{'label': "Disabled", value: 0} ];  

	controller.setupWidget("ConnectionWIFISelector",	{'label': "Wi-Fi", 
		'labelPlacement': "left", 'modelProperty': "connectionWiFi",
		'choices': this.choicesWIFISelector});

	this.choicesBTSelector = [
		{'label': controller.defaultChoiseLabel, value: -1},
		{'label': "Enabled", 'value': 1},
		{'label': "Disabled", 'value': 0} ];  

	controller.setupWidget("ConnectionBTSelector", {'label': "Bluetooth", 
		'labelPlacement': "left", 'modelProperty': "connectionBT",
		'choices': this.choicesBTSelector});

	this.choicesGPSSelector = [
		{'label': controller.defaultChoiseLabel, value: -1},
		{'label': "Enabled", 'value': 1},
		{'label': "Disabled", 'value': 0} ];  

	controller.setupWidget("ConnectionGPSSelector",	{'label': "GPS", 
		'labelPlacement': "left", 'modelProperty': "connectionGPS",
		'choices': this.choicesGPSSelector});
}

//

ConnectionConfig.prototype.config = function() {
	var config = {
		'connectionWiFi': -1, 
		'connectionBT': -1, 
		'connectionGPS': -1, 
		'connectionData': -1, 
		'connectionPhone': -1 };
	
	return config;
}

//

ConnectionConfig.prototype.load = function(preferences) {
	var config = this.config();
	
	if(preferences.connectionWiFi != undefined)
		config.connectionWiFi = preferences.connectionWiFi;
	
	if(preferences.connectionBT != undefined)
		config.connectionBT = preferences.connectionBT;
	
	if(preferences.connectionGPS != undefined)
		config.connectionGPS = preferences.connectionGPS;
	
	if(preferences.connectionData != undefined)
		config.connectionData = preferences.connectionData;
	
	if(preferences.connectionPhone != undefined)
		config.connectionPhone = preferences.connectionPhone;
	
	return config;
}

ConnectionConfig.prototype.save = function(config, preferences) {
	var preferences = {};
	
	if(config.connectionWiFi != -1)
		preferences.connectionWiFi = config.connectionWiFi;
	
	if(config.connectionBT != -1)
		preferences.connectionBT = config.connectionBT;
	
	if(config.connectionGPS != -1)
		preferences.connectionGPS = config.connectionGPS;
	
	if(config.connectionData != -1)
		preferences.connectionData = config.connectionData;
	
	if(config.connectionPhone != -1)
		preferences.connectionPhone = config.connectionPhone;
	
	return preferences;
}

