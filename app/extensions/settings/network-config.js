function NetworkConfig() {
}

NetworkConfig.prototype.version = function() {
	return "1.1";
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

NetworkConfig.prototype.setup = function(sceneController) {
	this.choicesNetworkTypeSelector = [
		{'label': sceneController.defaultChoiseLabel, 'value': -1},
		{'label': "Automatic", 'value': 1},
		{'label': "2G Only", 'value': 2},
		{'label': "3G Only", 'value': 3} ];  

	sceneController.setupWidget("NetworkTypeSelector", {'label': "Network Type", 
		'labelPlacement': "left", 'modelProperty': "networkType",
		'choices': this.choicesNetworkTypeSelector});

	this.choicesDataRoamingSelector = [
		{'label': sceneController.defaultChoiseLabel, 'value': -1},
		{'label': "Enabled", 'value': 1},
		{'label': "Disabled", 'value': 2} ];  

	sceneController.setupWidget("NetworkDataSelector", {'label': "Data Roaming", 
		'labelPlacement': "left", 'modelProperty': "networkData",
		'choices': this.choicesDataRoamingSelector});

	this.choicesVoiceRoamingSelector = [
		{'label': sceneController.defaultChoiseLabel, 'value': -1},
		{'label': "Automatic", 'value': 1},
		{'label': "Home Only", 'value': 2},
		{'label': "Roam Only", 'value': 3} ];  

	sceneController.setupWidget("NetworkVoiceSelector", {'label': "Voice Roaming", 
		'labelPlacement': "left", 'modelProperty': "networkVoice",
		'choices': this.choicesVoiceRoamingSelector});
}

//

NetworkConfig.prototype.config = function() {
	var settingConfig = {
		'networkType': -1, 
		'networkData': -1, 
		'networkVoice': -1 };
	
	return settingConfig;
}

//

NetworkConfig.prototype.load = function(settingPreferences) {
	var settingConfig = this.config();
	
	if(settingPreferences.networkType != undefined)
		settingConfig.networkType = settingPreferences.networkType;

	if(settingPreferences.networkData != undefined)
		settingConfig.networkData = settingPreferences.networkData;
	
	if(settingPreferences.networkVoice != undefined)
		settingConfig.networkVoice = settingPreferences.networkVoice;
	
	return settingConfig;
}

NetworkConfig.prototype.save = function(settingConfig) {
	var settingPreferences = {};
	
	if(settingConfig.networkType != -1)
		settingPreferences.networkType = settingConfig.networkType;

	if(settingConfig.networkData != -1)
		settingPreferences.networkData = settingConfig.networkData;

	if(settingConfig.networkVoice != -1)
		settingPreferences.networkVoice = settingConfig.networkVoice;
	
	return settingPreferences;
}

