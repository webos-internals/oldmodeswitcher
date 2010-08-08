function CaleventConfig() {
}

CaleventConfig.prototype.version = function() {
	return "1.1";
}

CaleventConfig.prototype.label = function() {
	return "Calendar Event Trigger";
}

//

CaleventConfig.prototype.activate = function() {
}

CaleventConfig.prototype.deactivate = function() {
}

//

CaleventConfig.prototype.setup = function(controller) {
	controller.setupWidget("CaleventMatchText", {'hintText': "Text to Match in Events", 
		'multiline': false, 'enterSubmits': false, 'focus': true, 
		'textCase': Mojo.Widget.steModeLowerCase, 'modelProperty': "caleventMatch"}); 
}

//

CaleventConfig.prototype.config = function() {
	var config = {
		'caleventMatch': "" };
	
	return config;
}

//

CaleventConfig.prototype.load = function(preferences) {
	var config = {
		'caleventMatch': preferences.caleventMatch };
	
	return config;
}

CaleventConfig.prototype.save = function(config) {
	var preferences = {
		'caleventMatch': config.caleventMatch };
	
	return preferences;
}

