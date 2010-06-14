function WirelessConfig() {
}

//

WirelessConfig.prototype.label = function() {
	return "Wi-Fi Network Trigger";
}

//

WirelessConfig.prototype.setup = function(controller) {
	controller.setupWidget("WiFiSSIDTextField", {hintText: "WiFi Network Name (SSID)", 
		multiline: false, enterSubmits: false, focus: true, modelProperty: "wirelessSSID"}); 

	this.choicesWiFiDelaySelector = [
		{'label': "No Delay", 'value': 0},
		{'label': "30 Seconds", 'value': 30},
		{'label': "60 Seconds", 'value': 60}];  

	controller.setupWidget("WiFiDelaySelector", {'label': "Delay", 
		'labelPlacement': "left", 'modelProperty': "wirelessDelay",
		'choices': this.choicesWiFiDelaySelector});
}

//

WirelessConfig.prototype.load = function(config, data) {
	config.push({'wirelessSSID': data.wirelessSSID,
		'wirelessDelay': data.wirelessDelay});
}

WirelessConfig.prototype.save = function(config, data) {
	data.push({'wirelessSSID': config.wirelessSSID,
		'wirelessDelay': config.wirelessDelay});
}

//

WirelessConfig.prototype.append = function(config, saveCallback) {
	config.push({'wirelessSSID': "", 'wirelessDelay': 0});
	
	saveCallback(true);
}

WirelessConfig.prototype.remove = function(config, index, saveCallback) {
	config.splice(index,1);

	saveCallback(true);
}

//

WirelessConfig.prototype.changed = function(config, event, saveCallback) {
	saveCallback();
}

WirelessConfig.prototype.tapped = function(config, event, saveCallback) {
}

