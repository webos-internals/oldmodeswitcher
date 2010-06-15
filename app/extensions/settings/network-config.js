function NetworkConfig() {
}

//

NetworkConfig.prototype.label = function() {
	return "Network Settings";
}

//

NetworkConfig.prototype.setup = function(controller) {
	// Network type and data roaming selectors.
	
	this.choicesNetworkTypeSelector = [
		{'label': "Do Not Set", 'value': 0},
		{'label': "Automatic", 'value': 1},
		{'label': "2G Only", 'value': 2},
		{'label': "3G Only", 'value': 3} ];  

	controller.setupWidget("NetworkTypeSelector", {'label': "Network Type", 
		'labelPlacement': "left", 'modelProperty': "networkType",
		'choices': this.choicesNetworkTypeSelector});

	this.choicesDataRoamingSelector = [
		{'label': "Do Not Set", 'value': 0},
		{'label': "Enabled", 'value': 1},
		{'label': "Disabled", 'value': 2} ];  

	controller.setupWidget("DataRoamingSelector", {'label': "Data Roaming", 
		'labelPlacement': "left", 'modelProperty': "networkData",
		'choices': this.choicesDataRoamingSelector});

	this.choicesVoiceRoamingSelector = [
		{'label': "Do Not Set", 'value': 0},
		{'label': "Automatic", 'value': 1},
		{'label': "Home Only", 'value': 2},
		{'label': "Roam Only", 'value': 3} ];  

	controller.setupWidget("VoiceRoamingSelector", {'label': "Voice Roaming", 
		'labelPlacement': "left", 'modelProperty': "networkVoice",
		'choices': this.choicesVoiceRoamingSelector});
}

//

NetworkConfig.prototype.load = function(preferences) {
	var config = {
		'networkType': preferences.networkType,
		'networkData': preferences.networkData, 
		'networkVoice': preferences.networkVoice };
	
	return config;
}

NetworkConfig.prototype.save = function(config) {
	var preferences = {
		'networkType': config.networkType,
		'networkData': config.networkData, 
		'networkVoice': config.networkVoice };
	
	return preferences;
}

//

NetworkConfig.prototype.config = function() {
	var config = {
		'networkType': 0, 
		'networkData': 0, 
		'networkVoice': 0 };
	
	return config;
}

