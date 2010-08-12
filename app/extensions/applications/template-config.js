function TemplateConfig() {
}

TemplateConfig.prototype.version = function() {
	// This function should return the api version that this extension was made for.
	
	return "1.1";
}

TemplateConfig.prototype.appid = function() {
	// This function should return the application id that this extension is for.

	return "org.example.appid";
}

//

TemplateConfig.prototype.activate = function() {
	// This function is called when application configuration scene is activated.
}

TemplateConfig.prototype.deactivate = function() {
	// This function is called when application configuration scene is deactivated.
}

//

TemplateConfig.prototype.setup = function(controller) {
	// This function should setup all the widgets in the extension-listitem file.
	
	this.choicesTemplateLaunchSelector = [
		{'label': "On Mode Start", value: "start"},
		{'label': "On Mode Close", value: "close"} ];  

	controller.setupWidget("TemplateLaunchSelector", {'label': "Launch", 
		'labelPlacement': "left", 'modelProperty': "launchMode",
		'choices': this.choicesTemplateLaunchSelector} );
}

//

TemplateConfig.prototype.config = function(launchPoint) {
	// This function is called when new application (launchpoint) is added.

	// Configuration returned here is the configuration for the UI part.

	// The simplest configuration is to use the preferences format.

	var config = {
		'name': launchPoint.title,
		'launchMode': "start" };
	
	return config;
}

//

TemplateConfig.prototype.load = function(preferences) {
	// This function will do the parsing of the preferences stored by the main 
	// application into the wanted format for the UI part of the configuration.
	
	// The preferences stored by the main application holds the following: 
	// name, appid, launchMode, launchDelay, startParams and closeParams.

	// The most simple loading would be just to copy the configuration:

	var config = {
		'name': preferences.name,
		'launchMode': preferences.event };
	
	return config;
}

TemplateConfig.prototype.save = function(config) {
	// This function will do the parsing of the configuration used in the UI 
	// part into the preferences format stored by the main application.
		
	// The preferences used by the main application has to hold the following: 
	// name, appid, launchMode, launchDelay, startParams and closeParams.

	// The most simple saving would be just to copy the configuration:
	
	var preferences = {
		'type': "app",
		'name': config.name,
		'event': config.launchMode, 
		'delay': 0, 
		'appid': this.appid(), 
		'params': "" };

	return preferences;
}

