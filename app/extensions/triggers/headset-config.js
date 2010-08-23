function HeadsetConfig() {
}

HeadsetConfig.prototype.version = function() {
	return "1.1";
}

HeadsetConfig.prototype.label = function() {
	return $L("Headset State Trigger");
}

//

HeadsetConfig.prototype.activate = function() {
}

HeadsetConfig.prototype.deactivate = function() {
}

//

HeadsetConfig.prototype.setup = function(sceneController) {
	this.choicesStateSelector = [
		{'label': $L("Connected"), 'value': 0}, 
		{'label': $L("Not Connected"), 'value': 1} ];  

	sceneController.setupWidget("HeadsetStateSelector", {'label': $L("State"), 
		'labelPlacement': "left", 'modelProperty': "headsetState",
		'choices': this.choicesStateSelector});

	this.choicesScenarioSelector = [
		{'label': $L("Any Scenario"), 'value': 0}, 
		{'label': $L("Headset"), 'value': 1},
		{'label': $L("Headset / Mic"), 'value': 2} ];  

	sceneController.setupWidget("HeadsetScenarioSelector", {'label': $L("Scenario"), 
		'labelPlacement': "left", 'modelProperty': "headsetScenario",
		'choices': this.choicesScenarioSelector});
}

//

HeadsetConfig.prototype.config = function() {
	var triggerConfig = {
		'headsetTitle': $L("Headset State"),
		'headsetState': 0,
		'headsetScenario': 0 };
	
	return triggerConfig;
}

//

HeadsetConfig.prototype.load = function(triggerPreferences) {
	var triggerConfig = {
		'headsetTitle': $L("Headset State"),
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

