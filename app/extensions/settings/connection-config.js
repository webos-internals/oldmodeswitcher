function ConnectionConfig() {
}

ConnectionConfig.prototype.version = function() {
	return "1.1";
}

//

ConnectionConfig.prototype.label = function() {
	return $L("Connection Settings");
}

//

ConnectionConfig.prototype.activate = function() {
}

ConnectionConfig.prototype.deactivate = function() {
}

//

ConnectionConfig.prototype.setup = function(sceneController) {
	this.choicesPhoneSelector = [
		{'label': sceneController.defaultChoiseLabel, value: -1},
		{'label': $L("Enabled"), 'value': 1},
		{'label': $L("Disabled"), 'value': 0} ];  

	sceneController.setupWidget("ConnectionPhoneSelector", {'label': $L("Phone"), 
		'labelPlacement': "left", 'modelProperty': "connectionPhone",
		'choices': this.choicesPhoneSelector});

	this.choicesDataSelector = [
		{'label': sceneController.defaultChoiseLabel, value: -1},
		{'label': $L("Enabled"), 'value': 1},
		{'label': $L("Disabled"), 'value': 0} ];  

	sceneController.setupWidget("ConnectionDataSelector",	{'label': $L("Data"), 
		'labelPlacement': "left", 'modelProperty': "connectionData",
		'choices': this.choicesDataSelector});

	this.choicesWIFISelector = [
		{'label': sceneController.defaultChoiseLabel, value: -1},
		{'label': $L("Enabled"), value: 1},
		{'label': $L("Disabled"), value: 0} ];  

	sceneController.setupWidget("ConnectionWIFISelector",	{'label': $L("Wi-Fi"), 
		'labelPlacement': "left", 'modelProperty': "connectionWiFi",
		'choices': this.choicesWIFISelector});

	this.choicesBTSelector = [
		{'label': sceneController.defaultChoiseLabel, value: -1},
		{'label': $L("Enabled"), 'value': 1},
		{'label': $L("Disabled"), 'value': 0} ];  

	sceneController.setupWidget("ConnectionBTSelector", {'label': $L("Bluetooth"), 
		'labelPlacement': "left", 'modelProperty': "connectionBT",
		'choices': this.choicesBTSelector});

	this.choicesGPSSelector = [
		{'label': sceneController.defaultChoiseLabel, value: -1},
		{'label': $L("Enabled"), 'value': 1},
		{'label': $L("Disabled"), 'value': 0} ];  

	sceneController.setupWidget("ConnectionGPSSelector",	{'label': $L("GPS"), 
		'labelPlacement': "left", 'modelProperty': "connectionGPS",
		'choices': this.choicesGPSSelector});
}

//

ConnectionConfig.prototype.config = function() {
	var settingConfig = {
		'connectionTitle': $L("Connections"),
		'connectionWiFi': -1, 
		'connectionBT': -1, 
		'connectionGPS': -1, 
		'connectionData': -1, 
		'connectionPhone': -1 };
	
	return settingConfig;
}

//

ConnectionConfig.prototype.load = function(settingPreferences) {
	var settingConfig = this.config();
	
	if(settingPreferences.connectionWiFi != undefined)
		settingConfig.connectionWiFi = settingPreferences.connectionWiFi;
	
	if(settingPreferences.connectionBT != undefined)
		settingConfig.connectionBT = settingPreferences.connectionBT;
	
	if(settingPreferences.connectionGPS != undefined)
		settingConfig.connectionGPS = settingPreferences.connectionGPS;
	
	if(settingPreferences.connectionData != undefined)
		settingConfig.connectionData = settingPreferences.connectionData;
	
	if(settingPreferences.connectionPhone != undefined)
		settingConfig.connectionPhone = settingPreferences.connectionPhone;
	
	return settingConfig;
}

ConnectionConfig.prototype.save = function(settingConfig) {
	var settingPreferences = {};
	
	if(settingConfig.connectionWiFi != -1)
		settingPreferences.connectionWiFi = settingConfig.connectionWiFi;
	
	if(settingConfig.connectionBT != -1)
		settingPreferences.connectionBT = settingConfig.connectionBT;
	
	if(settingConfig.connectionGPS != -1)
		settingPreferences.connectionGPS = settingConfig.connectionGPS;
	
	if(settingConfig.connectionData != -1)
		settingPreferences.connectionData = settingConfig.connectionData;
	
	if(settingConfig.connectionPhone != -1)
		settingPreferences.connectionPhone = settingConfig.connectionPhone;
	
	return settingPreferences;
}

