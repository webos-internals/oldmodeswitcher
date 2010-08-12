function HeadsetConfig() {
}

HeadsetConfig.prototype.version = function() {
	return "1.1";
}

HeadsetConfig.prototype.label = function() {
	return "Headset State Trigger";
}

//

HeadsetConfig.prototype.activate = function() {
}

HeadsetConfig.prototype.deactivate = function() {
}

//

HeadsetConfig.prototype.setup = function(controller) {
	this.choicesStateSelector = [
		{'label': "Connected", 'value': 0}, 
		{'label': "Not Connected", 'value': 1} ];  

	controller.setupWidget("HeadsetStateSelector", {'label': "State", 
		'labelPlacement': "left", 'modelProperty': "headsetState",
		'choices': this.choicesStateSelector});

	this.choicesScenarioSelector = [
		{'label': "Any Scenario", 'value': 0}, 
		{'label': "Headset", 'value': 1},
		{'label': "Headset / Mic", 'value': 2} ];  

	controller.setupWidget("HeadsetScenarioSelector", {'label': "Scenario", 
		'labelPlacement': "left", 'modelProperty': "headsetScenario",
		'choices': this.choicesScenarioSelector});
}

//

HeadsetConfig.prototype.config = function() {
	var config = {
		'headsetState': 0,
		'headsetScenario': 0 };
	
	return config;
}

//

HeadsetConfig.prototype.load = function(preferences) {
	var config = {
		'headsetState': preferences.headsetState,
		'headsetScenario': preferences.headsetScenario };
	
	return config;
}

HeadsetConfig.prototype.save = function(config) {
	var preferences = {
		'headsetState': config.headsetState,
		'headsetScenario': config.headsetScenario };
	
	return preferences;
}

