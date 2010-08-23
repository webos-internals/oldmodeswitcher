function ChargerConfig() {
}

ChargerConfig.prototype.version = function() {
	return "1.1";
}

ChargerConfig.prototype.label = function() {
	return $L("Charger Event Trigger");
}

//

ChargerConfig.prototype.activate = function() {
}

ChargerConfig.prototype.deactivate = function() {
}

//

ChargerConfig.prototype.setup = function(sceneController) {
	this.controller = sceneController;

	this.choicesChargerSelector = [
		{'label': $L("No Charger"), 'value': 0},
		{'label': $L("Touchstone"), 'value': 1},
		{'label': $L("Wall Charger"), 'value': 2},
		{'label': $L("USB Charger"), 'value': 3} ];  

	sceneController.setupWidget("ChargerSourceSelector",	{'label': $L("Charger"), 
		'labelPlacement': "left", 'modelProperty': "chargerCharger",
		'choices': this.choicesChargerSelector});

	this.choicesOrientationSelector = [
		{'label': $L("Any"), 'value': 0},
		{'label': $L("Left"), 'value': 1},
		{'label': $L("Right"), 'value': 2},
		{'label': $L("Up"), 'value': 3},
		{'label': $L("Down"), 'value': 4} ];  

	sceneController.setupWidget("ChargerOrientationSelector", {'label': $L("Orientation"), 
		'labelPlacement': "left", 'modelProperty': "chargerOrientation",
		'choices': this.choicesOrientationSelector});
	
	this.choicesDelaySelector = [
		{'label': $L("No Delay"), 'value': 0},
		{'label': "3 " + $L("Seconds"), 'value': 3},
		{'label': "30 " + $L("Seconds"), 'value': 30},
		{'label': "60 " + $L("Seconds"), 'value': 60} ];  

	sceneController.setupWidget("ChargerDelaySelector", {'label': $L("Delay"), 
		'labelPlacement': "left", 'modelProperty': "chargerDelay",
		'choices': this.choicesDelaySelector});

	// Listen for change event for charger selector
	
	sceneController.listen(sceneController.get("TriggersList"), Mojo.Event.propertyChange, 
		this.handleListChange.bind(this));
}

//

ChargerConfig.prototype.config = function() {
	var triggerConfig = {
		'chargerTitle': $L("Charger Event"),
		'chargerCharger': 1,
		'chargerOrientation': 0,
		'chargerDelay': 3,
		'chargerOrientationDisplay': "block" };
	
	return triggerConfig;
}

//

ChargerConfig.prototype.load = function(triggerPreferences) {
	if(triggerPreferences.chargerCharger == 1)
		var display = "block";
	else
		var display = "none";

	var triggerConfig = {
		'chargerTitle': $L("Charger Event"),
		'chargerCharger': triggerPreferences.chargerCharger,
		'chargerOrientation': triggerPreferences.chargerOrientation,
		'chargerDelay': triggerPreferences.chargerDelay,
		'chargerOrientationDisplay': display };
	
	return triggerConfig;
}

ChargerConfig.prototype.save = function(triggerConfig) {
	if(triggerConfig.chargerCharger != 1)
		var orientation = 0;
	else
		var orientation = triggerConfig.chargerOrientation;

	var triggerPreferences = {
		'chargerCharger': triggerConfig.chargerCharger,
		'chargerOrientation': orientation,
		'chargerDelay': triggerConfig.chargerDelay };
	
	return triggerPreferences;
}

//

ChargerConfig.prototype.handleListChange = function(changeEvent) {
	if(changeEvent.property == "chargerCharger") {
		if(changeEvent.model.chargerCharger == 1)
			changeEvent.model.chargerOrientationDisplay = "block";
		else
			changeEvent.model.chargerOrientationDisplay = "none";
	
		var state = this.controller.get('mojo-scene-editmode-scene-scroller').mojo.getState();

		this.controller.get("TriggersList").mojo.invalidateItems(0);
		
		this.controller.get('mojo-scene-editmode-scene-scroller').mojo.setState(state);
	}
}

