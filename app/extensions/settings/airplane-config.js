function AirplaneConfig() {
}

AirplaneConfig.prototype.label = function() {
	return "Airplane Settings";
}

AirplaneConfig.prototype.setup = function(controller) {
	this.choicesAirplaneSelector = [
		{'label': "Enabled", 'value': 1},
		{'label': "Disabled", 'value': 0}
	];  

	controller.setupWidget(
		"FlightModeSelector",
		{
			'label': "Flight Mode",
			'labelPlacement': "left",
			'modelProperty': "airplaneMode",
			'choices': this.choicesAirplaneSelector
		}
	);
}

AirplaneConfig.prototype.load = function(config, preferences){
	config.push({'airplaneMode': preferences.airplaneMode});
}

AirplaneConfig.prototype.save = function(config, preferences){
	preferences.push({'airplaneMode': config.airplaneMode});
}


AirplaneConfig.prototype.append = function(config, saveCallback){
	config.push({'airplaneMode': "(querying)"});
	saveCallback();
}

AirplaneConfig.prototype.remove = function(config, index, saveCallback){
	config.splice(index,1);
	
	saveCallback();
}

AirplaneConfig.prototype.changed = function(config, event, saveCallback){
	saveCallback();
}

AirplaneConfig.prototype.tapped = function(config, event, saveCallback){
	
}

