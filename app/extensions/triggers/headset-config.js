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
}

//

HeadsetConfig.prototype.config = function() {
	var config = {
		'headsetState': 0 };
	
	return config;
}

//

HeadsetConfig.prototype.load = function(preferences) {
	var config = {
		'headsetState': preferences.headsetState };
	
	return config;
}

HeadsetConfig.prototype.save = function(config) {
	var preferences = {
		'headsetState': config.headsetState };
	
	return preferences;
}

