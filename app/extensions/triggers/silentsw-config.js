function SilentswConfig() {
}

SilentswConfig.prototype.version = function() {
	return "1.1";
}

SilentswConfig.prototype.label = function() {
	return "Silent Switch Trigger";
}

//

SilentswConfig.prototype.activate = function() {
}

SilentswConfig.prototype.deactivate = function() {
}

//

SilentswConfig.prototype.setup = function(sceneController) {
	this.choicesSwitchStateSelector = [
		{'label': "Switch On", 'value': 0},
		{'label': "Switch Off", 'value': 1} ];  

	sceneController.setupWidget("SilentswStateSelector", {'label': "State", 
		'labelPlacement': "left", 'modelProperty': "silentswState",
		'choices': this.choicesSwitchStateSelector});
}

//

SilentswConfig.prototype.config = function() {
	var triggerConfig = {
		'silentswState': 0 };
	
	return triggerConfig;
}

//

SilentswConfig.prototype.load = function(triggerPreferences) {
	var triggerConfig = {
		'silentswState': triggerPreferences.silentswState };
	
	return triggerConfig;
}

SilentswConfig.prototype.save = function(triggerConfig) {
	var triggerPreferences = {
		'silentswState': triggerConfig.silentswState };
	
	return triggerPreferences;
}

