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

HeadsetConfig.prototype.setup = function(sceneController) {
	this.choicesStateSelector = [
		{'label': "Connected", 'value': 0}, 
		{'label': "Not Connected", 'value': 1} ];  

	sceneController.setupWidget("HeadsetStateSelector", {'label': "State", 
		'labelPlacement': "left", 'modelProperty': "headsetState",
		'choices': this.choicesStateSelector});

	this.choicesScenarioSelector = [
		{'label': "Any Scenario", 'value': 0}, 
		{'label': "Headset", 'value': 1},
		{'label': "Headset / Mic", 'value': 2} ];  

	sceneController.setupWidget("HeadsetScenarioSelector", {'label': "Scenario", 
		'labelPlacement': "left", 'modelProperty': "headsetScenario",
		'choices': this.choicesScenarioSelector});
}

//

HeadsetConfig.prototype.config = function() {
	var triggerConfig = {
		'headsetState': 0,
		'headsetScenario': 0 };
	
	return triggerConfig;
}

//

HeadsetConfig.prototype.load = function(triggerPreferences) {
	var triggerConfig = {
		'headsetState': triggerPreferences.headsetState,
		'headsetScenario': triggerPreferences.headsetScenario };
	
	return triggerConfig;
}

HeadsetConfig.prototype.save = function(triggerConfig) {
	var triggerPreferences = {
		'headsetState': triggerConfig.headsetState,
		'headsetScenario': triggerConfig.headsetScenario };
	
	return triggerPreferences;
}

