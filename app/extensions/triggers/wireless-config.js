function WirelessConfig() {
}

WirelessConfig.prototype.version = function() {
	return "1.0";
}

//

WirelessConfig.prototype.label = function() {
	return "Wi-Fi Network Trigger";
}

//

WirelessConfig.prototype.setup = function(controller) {
	this.controller = controller;

	this.choicesWiFiStateSelector = [
		{'label': "Connected", 'value': 0},
		{'label': "Disconnected", 'value': 1},
		{'label': "Connected to", 'value': 2},
		{'label': "Disconnected from", 'value': 3} ];  

	controller.setupWidget("WirelessStateSelector", {'label': "State", 
		'labelPlacement': "left", 'modelProperty': "wirelessState",
		'choices': this.choicesWiFiStateSelector});

	controller.setupWidget("WirelessSSIDText", {hintText: "WiFi Network Name (SSID)", 
		multiline: false, enterSubmits: false, focus: true, modelProperty: "wirelessSSID"}); 

	this.choicesWiFiDelaySelector = [
		{'label': "No Delay", 'value': 0},
		{'label': "30 Seconds", 'value': 30},
		{'label': "60 Seconds", 'value': 60} ];  

	controller.setupWidget("WirelessDelaySelector", {'label': "Delay", 
		'labelPlacement': "left", 'modelProperty': "wirelessDelay",
		'choices': this.choicesWiFiDelaySelector});

	// Listen for keyboard event for ssid text field

	Mojo.Event.listen(controller.get("TriggersList"), Mojo.Event.propertyChange, 
		this.handleListChange.bind(this));
}

//

WirelessConfig.prototype.config = function() {
	var config = {
		'wirelessState': 0,
		'wirelessSSID': "",
		'wirelessDelay': 0,
		'wirelessDisplaySSID': "none" };
	
	return config;
}

//

WirelessConfig.prototype.load = function(preferences) {
	if(preferences.wirelessState >= 2)
		var display = "block";
	else
		var display = "none";

	var config = {
		'wirelessState': preferences.wirelessState,
		'wirelessSSID': preferences.wirelessSSID,
		'wirelessDelay': preferences.wirelessDelay,
		'wirelessDisplaySSID': display };
	
	return config;
}

WirelessConfig.prototype.save = function(config) {
	var preferences = {
		'wirelessState': config.wirelessState,
		'wirelessSSID': config.wirelessSSID,
		'wirelessDelay': config.wirelessDelay };
	
	return preferences;
}

//

WirelessConfig.prototype.handleListChange = function(event) {
	if(event.property == "wirelessState") {
		if(event.value >= 2)
			event.model.wirelessDisplaySSID = "block";
		else
			event.model.wirelessDisplaySSID = "none";

		var state = this.controller.get('mojo-scene-editmode-scene-scroller').mojo.getState();

		this.controller.get("TriggersList").mojo.invalidateItems(0);
		
		this.controller.get('mojo-scene-editmode-scene-scroller').mojo.setState(state);
	}
}

