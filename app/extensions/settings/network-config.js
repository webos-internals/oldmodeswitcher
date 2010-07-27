function NetworkConfig() {
}

NetworkConfig.prototype.version = function() {
	return "1.0";
}

//

NetworkConfig.prototype.label = function() {
	return "Network Settings";
}

//

NetworkConfig.prototype.activate = function() {
}

NetworkConfig.prototype.deactivate = function() {
}

//

NetworkConfig.prototype.setup = function(controller) {
	this.choicesNetworkTypeSelector = [
		{'label': controller.defaultChoiseLabel, 'value': -1},
		{'label': "Automatic", 'value': 1},
		{'label': "2G Only", 'value': 2},
		{'label': "3G Only", 'value': 3} ];  

	controller.setupWidget("NetworkTypeSelector", {'label': "Network Type", 
		'labelPlacement': "left", 'modelProperty': "networkType",
		'choices': this.choicesNetworkTypeSelector});

	this.choicesDataRoamingSelector = [
		{'label': controller.defaultChoiseLabel, 'value': -1},
		{'label': "Enabled", 'value': 1},
		{'label': "Disabled", 'value': 2} ];  

	controller.setupWidget("NetworkDataSelector", {'label': "Data Roaming", 
		'labelPlacement': "left", 'modelProperty': "networkData",
		'choices': this.choicesDataRoamingSelector});

	this.choicesVoiceRoamingSelector = [
		{'label': controller.defaultChoiseLabel, 'value': -1},
		{'label': "Automatic", 'value': 1},
		{'label': "Home Only", 'value': 2},
		{'label': "Roam Only", 'value': 3} ];  

	controller.setupWidget("NetworkVoiceSelector", {'label': "Voice Roaming", 
		'labelPlacement': "left", 'modelProperty': "networkVoice",
		'choices': this.choicesVoiceRoamingSelector});
}

//

NetworkConfig.prototype.config = function() {
	var config = {
		'networkType': -1, 
		'networkData': -1, 
		'networkVoice': -1 };
	
	return config;
}

//

NetworkConfig.prototype.load = function(preferences) {
	var config = this.config();
	
	if(preferences.networkType != undefined)
		config.networkType = preferences.networkType;

	if(preferences.networkData != undefined)
		config.networkData = preferences.networkData;
	
	if(preferences.networkVoice != undefined)
		config.networkVoice = preferences.networkVoice;
	
	return config;
}

NetworkConfig.prototype.save = function(config) {
	var preferences = {};
	
	if(config.networkType != -1)
		preferences.networkType = config.networkType;

	if(config.networkData != -1)
		preferences.networkData = config.networkData;

	if(config.networkVoice != -1)
		preferences.networkVoice = config.networkVoice;
	
	return preferences;
}

