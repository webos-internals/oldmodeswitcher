function TemplateConfig() {
}

TemplateConfig.prototype.version = function() {
	// This function should return the api version that this extension was made for.

	return "1.0";
}

TemplateConfig.prototype.label = function() {
	// This function should return the configuration UI label for this trigger.
	
	return "Template Trigger";
}

//

TemplateConfig.prototype.activate = function() {
	// This function is called when application configuration scene is activated.
}

TemplateConfig.prototype.deactivate = function() {
	// This function is called when application configuration scene is activated.
}

//

TemplateConfig.prototype.setup = function(controller) {
	// This function should setup all the widgets in the extension-listitem file.

	this.choicesTemplateOptionSelector = [
		{'label': "Enabled", 'value': 1},
		{'label': "Disabled", 'value': 0}
	];  

	controller.setupWidget("TemplateOptionSelector", {
		'label': "Template Option",	'labelPlacement': "left",
		'modelProperty': "templateOption", 
		'choices': this.choicesTemplateOptionSelector} );
}

//

TemplateConfig.prototype.config = function() {
	// This function is called when new settings group is added into the list.

	// Configuration returned here is the configuration for the UI part.
	
	var config = {
		'templateOption': 0 };
	
	return config;
}

//

TemplateConfig.prototype.load = function(preferences) {
	// This function will do the parsing of the preferences stored by the main 
	// application into the wanted format for the UI part of the configuration.
	
	// The data in application preferences is set by the extension itself.

	var config = {
		'templateOption': preferences.templateOption };
	
	return config;
}

TemplateConfig.prototype.save = function(config) {
	// This function will do the parsing of the configuration used in the UI 
	// part into the preferences format stored by the main application.
	
	// The data in the main application preferences should be kept to minimum.

	var preferences = {
		'templateOption': config.templateOption };
	
	return preferences;
}

