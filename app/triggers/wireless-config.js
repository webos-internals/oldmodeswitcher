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
}

//

WirelessConfig.prototype.load = function(config, data) {
	config.push({'wirelessSSID': data.wirelessSSID});
}

WirelessConfig.prototype.save = function(config, data) {
	data.push({'wirelessSSID': config.wirelessSSID});
}

//

WirelessConfig.prototype.append = function(config, saveCallback) {
	config.push({'wirelessSSID': ""});
	
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

