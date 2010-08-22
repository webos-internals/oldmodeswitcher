function TemplateConfig() {
}

TemplateConfig.prototype.version = function() {
	// This function should return the api version that this extension was made for.

	return "1.1";
}

//

TemplateConfig.prototype.label = function() {
	// This function should return the configuration UI label for this settings group.

	return "Template Settings";
}

//

TemplateConfig.prototype.activate = function() {
	// This function is called when application configuration scene is activated.
}

TemplateConfig.prototype.deactivate = function() {
	// This function is called when application configuration scene is activated.
}

//

TemplateConfig.prototype.setup = function(sceneController) {
	// This function should setup all the widgets in the extension-listitem file.

	this.choicesTemplateModeSelector = [
		{'label': controller.defaultChoiseLabel, 'value': -1},
		{'label': "Enabled", 'value': 1},
		{'label': "Disabled", 'value': 0}
	];  

	sceneController.setupWidget("TemplateModeSelector", {
		'label': "Template Mode",	'labelPlacement': "left",
		'modelProperty': "templateMode", 
		'choices': this.choicesTemplateModeSelector} );
}

//

TemplateConfig.prototype.config = function() {
	// This function is called when new settings group is added into the list.

	// Configuration returned here is the configuration for the UI part.
	
	var settingConfig = {
		'templateMode': -1 };
	
	return settingConfig;
}

//

TemplateConfig.prototype.load = function(settingPreferences) {
	// This function will do the parsing of the preferences stored by the main 
	// application into the wanted format for the UI part of the configuration.
	
	// The data in application preferences is set by the extension itself.

	var settingConfig = this.config();
	
	if(settingPreferences.templateMode != undefined)
		settingConfig.templateMode = settingPreferences.templateMode;
	
	return settingConfig;
}

TemplateConfig.prototype.save = function(settingConfig) {
	// This function will do the parsing of the configuration used in the UI 
	// part into the preferences format stored by the main application.
	
	// The data in the main application preferences should be kept to minimum.

	var settingPreferences = {};
	
	if(settingConfig.templateMode != -1)
		settingPreferences.templateMode = settingConfig.templateMode;
	
	return settingPreferences;
}

