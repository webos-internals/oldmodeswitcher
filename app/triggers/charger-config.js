function ChargerConfig() {
}

//

ChargerConfig.prototype.label = function() {
	return "Charger Event Trigger";
}

//

ChargerConfig.prototype.setup = function(controller) {
	this.choicesChargerSelector = [
		{'label': "Touchstone", 'value': 1},
		{'label': "Wall Charger", 'value': 2},
		{'label': "USB Charger", 'value': 3}];  

	controller.setupWidget("ChargerSelector",	{'label': "Charger", 
		'labelPlacement': "left", 'modelProperty': "chargerCharger",
		'choices': this.choicesChargerSelector});
	
	this.choicesDelaySelector = [
		{'label': "No Delay", 'value': 0},
		{'label': "3 Seconds", 'value': 3},
		{'label': "30 Seconds", 'value': 30},
		{'label': "60 Seconds", 'value': 60}];  

	controller.setupWidget("DelaySelector", {'label': "Delay", 
		'labelPlacement': "left", 'modelProperty': "chargerDelay",
		'choices': this.choicesDelaySelector});
}

//

ChargerConfig.prototype.load = function(config, data) {
	config.push({'chargerCharger': data.chargerCharger, 
		'chargerDelay': data.chargerDelay});
}

ChargerConfig.prototype.save = function(config, data) {
	data.push({'chargerCharger': config.chargerCharger, 
		'chargerDelay': config.chargerDelay});
}

//

ChargerConfig.prototype.append = function(config, saveCallback) {
	config.push({'chargerCharger': 1, 'chargerDelay': 3});
	
	saveCallback(true);
}

ChargerConfig.prototype.remove = function(config, index, saveCallback) {
	config.splice(index,1);

	saveCallback(true);
}

//

ChargerConfig.prototype.changed = function(config, event, saveCallback) {
	saveCallback();
}

ChargerConfig.prototype.tapped = function(config, event, saveCallback) {
}

