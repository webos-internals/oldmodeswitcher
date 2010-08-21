function DisplayConfig() {
}

DisplayConfig.prototype.version = function() {
	return "1.1";
}

DisplayConfig.prototype.label = function() {
	return "Display State Trigger";
}

//

DisplayConfig.prototype.activate = function() {
}

DisplayConfig.prototype.deactivate = function() {
}

//

DisplayConfig.prototype.setup = function(sceneController) {
	this.controller = sceneController;

	this.choicesStateSelector = [
		{'label': "Display On", 'value': 0},
		{'label': "Display Off", 'value': 1},
		{'label': "Screen Locked", 'value': 2} ];  

	sceneController.setupWidget("DisplayStateSelector", {'label': "State", 
		'labelPlacement': "left", 'modelProperty': "displayState",
		'choices': this.choicesStateSelector});
/*
	this.choicesOrientationSelector = [
		{'label': "Any", 'value': 0},
		{'label': "Face Up", 'value': 1},
		{'label': "Face Down", 'value': 2} ];  

	sceneController.setupWidget("DisplayOrientationSelector", {'label': "Orientation", 
		'labelPlacement': "left", 'modelProperty': "displayOrientation",
		'choices': this.choicesOrientationSelector});
*/	
	this.choicesDelaySelector = [
		{'label': "15 Seconds", 'value': 15},
		{'label': "30 Seconds", 'value': 30},
		{'label': "60 Seconds", 'value': 60} ];  

	sceneController.setupWidget("DisplayDelaySelector", {'label': "Delay", 
		'labelPlacement': "left", 'modelProperty': "displayDelay",
		'choices': this.choicesDelaySelector});
}

//

DisplayConfig.prototype.config = function() {
	var triggerConfig = {
		'displayState': 1,
/*		'displayOrientation': 0, */
		'displayDelay': 15 };
	
	return triggerConfig;
}

//

DisplayConfig.prototype.load = function(triggerPreferences) {
	var triggerConfig = {
		'displayState': triggerPreferences.displayState,
/*		'displayOrientation': triggerPreferences.displayOrientation, */
		'displayDelay': triggerPreferences.displayDelay };
	
	return triggerConfig;
}

DisplayConfig.prototype.save = function(triggerConfig) {
	var triggerPreferences = {
		'displayState': triggerConfig.displayState,
/*		'displayOrientation': triggerConfig.displayOrientation, */
		'displayDelay': triggerConfig.displayDelay };
	
	return triggerPreferences;
}

