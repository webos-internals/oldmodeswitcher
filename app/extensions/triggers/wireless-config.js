function WirelessConfig() {
}

WirelessConfig.prototype.version = function() {
	return "1.1";
}

WirelessConfig.prototype.label = function() {
	return $L("Wi-Fi Network Trigger");
}

//

WirelessConfig.prototype.activate = function() {
}

WirelessConfig.prototype.deactivate = function() {
}

//

WirelessConfig.prototype.setup = function(sceneController) {
	this.controller = sceneController;

	this.choicesWiFiStateSelector = [
		{'label': $L("Connected"), 'value': 0},
		{'label': $L("Disconnected"), 'value': 1},
		{'label': $L("Connected to"), 'value': 2},
		{'label': $L("Disconnected from"), 'value': 3} ];  

	sceneController.setupWidget("WirelessStateSelector", {'label': $L("State"), 
		'labelPlacement': "left", 'modelProperty': "wirelessState",
		'choices': this.choicesWiFiStateSelector});

	sceneController.setupWidget("WirelessSSIDText", {'hintText': $L("Wi-Fi Network Name (SSID)"), 
		'multiline': false, 'enterSubmits': false, 'focus': true, 
		'textCase': Mojo.Widget.steModeLowerCase, 'modelProperty': "wirelessSSID"}); 

	this.choicesWiFiDelaySelector = [
		{'label': $L("No Delay"), 'value': 0},
		{'label': "30 " + $L("Seconds"), 'value': 30},
		{'label': "60 " + $L("Seconds"), 'value': 60} ];  

	sceneController.setupWidget("WirelessDelaySelector", {'label': $L("Delay"), 
		'labelPlacement': "left", 'modelProperty': "wirelessDelay",
		'choices': this.choicesWiFiDelaySelector});

	// Listen for state selector change event

	sceneController.listen(sceneController.get("TriggersList"), Mojo.Event.propertyChange, 
		this.handleListChange.bind(this));
}

//

WirelessConfig.prototype.config = function() {
	var triggerConfig = {
		'wirelessTitle': $L("Wi-Fi Network"),
		'wirelessState': 0,
		'wirelessSSID': "",
		'wirelessDelay': 0,
		'wirelessSSIDDisplay': "none" };
	
	return triggerConfig;
}

//

WirelessConfig.prototype.load = function(triggerPreferences) {
	if(triggerPreferences.wirelessState >= 2)
		var display = "block";
	else
		var display = "none";

	var triggerConfig = {
		'wirelessTitle': $L("Wi-Fi Network"),
		'wirelessState': triggerPreferences.wirelessState,
		'wirelessSSID': triggerPreferences.wirelessSSID,
		'wirelessDelay': triggerPreferences.wirelessDelay,
		'wirelessSSIDDisplay': display };
	
	return triggerConfig;
}

WirelessConfig.prototype.save = function(triggerConfig) {
	var triggerPreferences = {
		'wirelessState': triggerConfig.wirelessState,
		'wirelessSSID': triggerConfig.wirelessSSID,
		'wirelessDelay': triggerConfig.wirelessDelay };
	
	return triggerPreferences;
}

//

WirelessConfig.prototype.handleListChange = function(changeEvent) {
	if(changeEvent.property == "wirelessState") {
		if(changeEvent.value >= 2)
			changeEvent.model.wirelessSSIDDisplay = "block";
		else
			changeEvent.model.wirelessSSIDDisplay = "none";

		var state = this.controller.get('mojo-scene-editmode-scene-scroller').mojo.getState();

		this.controller.get("TriggersList").mojo.invalidateItems(0);
		
		this.controller.get('mojo-scene-editmode-scene-scroller').mojo.setState(state);
	}
}

