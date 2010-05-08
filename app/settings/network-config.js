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
		{'label': "Automatic", 'value': 1},
		{'label': "2G Only", 'value': 2},
		{'label': "3G Only", 'value': 3}];  

	controller.setupWidget("NetworkTypeSelector", {'label': "Network Type", 
		'labelPlacement': "left", 'modelProperty': "networkType",
		'choices': this.choicesNetworkTypeSelector});

	this.choicesDataRoamingSelector = [
		{'label': "Enabled", 'value': 1},
		{'label': "Disabled", 'value': 0}];  

	controller.setupWidget("DataRoamingSelector", {'label': "Data Roaming", 
		'labelPlacement': "left", 'modelProperty': "networkData",
		'choices': this.choicesDataRoamingSelector});
/*		
	this.choicesVoiceRoamingSelector = [
		{'label': "Enabled", 'value': 1},
		{'label': "Disabled", 'value': 0}];  

	controller.setupWidget("VoiceRoamingSelector", {'label': "Voice Roaming", 
		'labelPlacement': "left", 'modelProperty': "networkVoice",
		'choices': this.choicesVoiceRoamingSelector});
		*/
}

//

NetworkConfig.prototype.load = function(config, preferences) {
	config.push({'networkType': preferences.networkType,
		'networkData': preferences.networkData, 
		'networkVoice': preferences.networkVoice});
}

NetworkConfig.prototype.save = function(config, preferences) {
	preferences.push({'networkType': config.networkType,
		'networkData': config.networkData, 
		'networkVoice': config.networkVoice});
}

//

NetworkConfig.prototype.append = function(config, saveCallback) {
	config.push({'networkType': "(querying)", 'networkData': "(querying)", 
		'networkVoice': 0});
	
// FIXME: muuta 0 querying kun tuki voice roamingille!
	
	saveCallback();
}

NetworkConfig.prototype.remove = function(config, index, saveCallback) {
	config.splice(index,1);
	
	saveCallback();
}

//

NetworkConfig.prototype.changed = function(config, event, saveCallback) {
	saveCallback();
}

NetworkConfig.prototype.tapped = function(config, event, saveCallback) {
}

