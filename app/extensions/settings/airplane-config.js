function AirplaneConfig() {
}

AirplaneConfig.prototype.version = function() {
	return "1.1";
}

//

AirplaneConfig.prototype.label = function() {
	return "Airplane Settings";
}

//

AirplaneConfig.prototype.activate = function() {
}

AirplaneConfig.prototype.deactivate = function() {
}

//

AirplaneConfig.prototype.setup = function(controller) {
	this.choicesAirplaneModeSelector = [
		{'label': controller.defaultChoiseLabel, 'value': -1},
		{'label': "Enabled", 'value': 1},
		{'label': "Disabled", 'value': 0} ];  

	controller.setupWidget("AirplaneModeSelector", {
		'label': "Flight Mode",	'labelPlacement': "left",
		'modelProperty': "airplaneMode", 
		'choices': this.choicesAirplaneModeSelector});
}

//

AirplaneConfig.prototype.config = function() {
	var config = {
		'airplaneMode': -1 };
	
	return config;
}

//

AirplaneConfig.prototype.load = function(preferences) {
	var config = this.config();

	if(preferences.airplaneMode != undefined)
		config.airplaneMode = preferences.airplaneMode;
	
	return config;
}

AirplaneConfig.prototype.save = function(config) {
	var preferences = {};
	
	if(config.airplaneMode != -1)
		preferences.airplaneMode = config.airplaneMode;
	
	return preferences;
}

