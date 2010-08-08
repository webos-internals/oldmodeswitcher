function ChargerConfig() {
}

ChargerConfig.prototype.version = function() {
	return "1.1";
}

ChargerConfig.prototype.label = function() {
	return "Charger Event Trigger";
}

//

ChargerConfig.prototype.activate = function() {
}

ChargerConfig.prototype.deactivate = function() {
}

//

ChargerConfig.prototype.setup = function(controller) {
	this.controller = controller;

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

	// Listen for change event for charger selector
	
	Mojo.Event.listen(controller.get("TriggersList"), Mojo.Event.propertyChange, 
		this.handleListChange.bind(this));
}

//

ChargerConfig.prototype.config = function() {
	var config = {
		'chargerCharger': 1,
		'chargerOrientation': 0,
		'chargerDelay': 3,
		'chargerOrientationDisplay': "block" };
	
	return config;
}

//

ChargerConfig.prototype.load = function(preferences) {
	if(preferences.chargerCharger == 1)
		var display = "block";
	else
		var display = "none";

	var config = {
		'chargerCharger': preferences.chargerCharger,
		'chargerOrientation': preferences.chargerOrientation,
		'chargerDelay': preferences.chargerDelay,
		'chargerOrientationDisplay': display };
	
	return config;
}

ChargerConfig.prototype.save = function(config) {
	if(config.chargerCharger != 1)
		var orientation = 0;
	else
		var orientation = config.chargerOrientation;

	var preferences = {
		'chargerCharger': config.chargerCharger,
		'chargerOrientation': orientation,
		'chargerDelay': config.chargerDelay };
	
	return preferences;
}

//

ChargerConfig.prototype.handleListChange = function(event) {
	if(event.property == "chargerCharger") {
		if(event.model.chargerCharger == 1)
			event.model.chargerOrientationDisplay = "block";
		else
			event.model.chargerOrientationDisplay = "none";
	
		var state = this.controller.get('mojo-scene-editmode-scene-scroller').mojo.getState();

		this.controller.get("TriggersList").mojo.invalidateItems(0);
		
		this.controller.get('mojo-scene-editmode-scene-scroller').mojo.setState(state);
	}
}


