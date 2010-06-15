function AirplaneConfig() {
}

//

AirplaneConfig.prototype.label = function() {
	return "Airplane Settings";
}

//

AirplaneConfig.prototype.setup = function(controller) {
	this.choicesAirplaneModeSelector = [
		{'label': "Do Not Set", 'value': 0},
		{'label': "Enabled", 'value': 1},
		{'label': "Disabled", 'value': 2}
	];  

	controller.setupWidget("AirplaneModeSelector", {
		'label': "Flight Mode",	'labelPlacement': "left",
		'modelProperty': "airplaneMode", 
		'choices': this.choicesAirplaneModeSelector} );
}

//

AirplaneConfig.prototype.load = function(preferences) {
	var config = {
		'airplaneMode': preferences.airplaneMode };
	
	return config;
}

AirplaneConfig.prototype.save = function(config) {
	var preferences = {
		'airplaneMode': config.airplaneMode };
	
	return preferences;
}

//

AirplaneConfig.prototype.config = function() {
	var config = {
		'airplaneMode': 0 };
	
	return config;
}

