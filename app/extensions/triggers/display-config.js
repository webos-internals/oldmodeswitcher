function DisplayConfig() {
}

DisplayConfig.prototype.version = function() {
	return "1.1";
}

DisplayConfig.prototype.label = function() {
	return $L("Display State Trigger");
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
		{'label': $L("Display On"), 'value': 0},
		{'label': $L("Display Off"), 'value': 1},
		{'label': $L("Screen Locked"), 'value': 2} ];  

	sceneController.setupWidget("DisplayStateSelector", {'label': $L("State"), 
		'labelPlacement': "left", 'modelProperty': "displayState",
		'choices': this.choicesStateSelector});
/*
	this.choicesOrientationSelector = [
		{'label': $L("Any"), 'value': 0},
		{'label': $L("Face Up"), 'value': 1},
		{'label': $L("Face Down"), 'value': 2} ];  

	sceneController.setupWidget("DisplayOrientationSelector", {'label': $L("Orientation"), 
		'labelPlacement': "left", 'modelProperty': "displayOrientation",
		'choices': this.choicesOrientationSelector});
*/	
	this.choicesDelaySelector = [
		{'label': "15 " + $L("Seconds"), 'value': 15},
		{'label': "30 " + $L("Seconds"), 'value': 30},
		{'label': "60 " + $L("Seconds"), 'value': 60} ];  

	sceneController.setupWidget("DisplayDelaySelector", {'label': $L("Delay"), 
		'labelPlacement': "left", 'modelProperty': "displayDelay",
		'choices': this.choicesDelaySelector});
}

//

DisplayConfig.prototype.config = function() {
	var triggerConfig = {
		'displayTitle': $L("Display State"),
		'displayState': 1,
/*		'displayOrientation': 0, */
		'displayDelay': 15 };
	
	return triggerConfig;
}

//

DisplayConfig.prototype.load = function(triggerPreferences) {
	var triggerConfig = {
		'displayTitle': $L("Display State"),
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

