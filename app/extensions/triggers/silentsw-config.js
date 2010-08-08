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

SilentswConfig.prototype.setup = function(controller) {
	this.choicesSwitchStateSelector = [
		{'label': "Switch On", 'value': 0},
		{'label': "Switch Off", 'value': 1} ];  

	controller.setupWidget("SilentswStateSelector", {'label': "State", 
		'labelPlacement': "left", 'modelProperty': "silentswState",
		'choices': this.choicesSwitchStateSelector});
}

//

SilentswConfig.prototype.config = function() {
	var config = {
		'silentswState': 0 };
	
	return config;
}

//

SilentswConfig.prototype.load = function(preferences) {
	var config = {
		'silentswState': preferences.silentswState };
	
	return config;
}

SilentswConfig.prototype.save = function(config) {
	var preferences = {
		'silentswState': config.silentswState };
	
	return preferences;
}

