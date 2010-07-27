function ChargerConfig() {
}

ChargerConfig.prototype.version = function() {
	return "1.0";
}

//

ChargerConfig.prototype.label = function() {
	return "Charger Event Trigger";
}

//

ChargerConfig.prototype.setup = function(controller) {
	this.choicesChargerSelector = [
		{'label': "No Charger", 'value': 0},
		{'label': "Touchstone", 'value': 1},
		{'label': "Wall Charger", 'value': 2},
		{'label': "USB Charger", 'value': 3} ];  

	controller.setupWidget("ChargerSourceSelector",	{'label': "Charger", 
		'labelPlacement': "left", 'modelProperty': "chargerCharger",
		'choices': this.choicesChargerSelector});

	this.choicesOrientationSelector = [
		{'label': "Any", 'value': 0},
		{'label': "Left", 'value': 1},
		{'label': "Right", 'value': 2},
		{'label': "Up", 'value': 3},
		{'label': "Down", 'value': 4} ];  

	controller.setupWidget("ChargerOrientationSelector", {'label': "Orientation", 
		'labelPlacement': "left", 'modelProperty': "chargerOrientation",
		'choices': this.choicesOrientationSelector});
	
	this.choicesDelaySelector = [
		{'label': "No Delay", 'value': 0},
		{'label': "3 Seconds", 'value': 3},
		{'label': "30 Seconds", 'value': 30},
		{'label': "60 Seconds", 'value': 60} ];  

	controller.setupWidget("ChargerDelaySelector", {'label': "Delay", 
		'labelPlacement': "left", 'modelProperty': "chargerDelay",
		'choices': this.choicesDelaySelector});
}

//

ChargerConfig.prototype.load = function(preferences) {
	var config = {
		'chargerCharger': preferences.chargerCharger,
		'chargerOrientation': preferences.chargerOrientation,
		'chargerDelay': preferences.chargerDelay };
	
	return config;
}

ChargerConfig.prototype.save = function(config) {
	var preferences = {
		'chargerCharger': config.chargerCharger,
		'chargerOrientation': config.chargerOrientation,
		'chargerDelay': config.chargerDelay };
	
	return preferences;
}

//

ChargerConfig.prototype.config = function() {
	var config = {
		'chargerCharger': 1,
		'chargerOrientation': 0,
		'chargerDelay': 3 };
	
	return config;
}

