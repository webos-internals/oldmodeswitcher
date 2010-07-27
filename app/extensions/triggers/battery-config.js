function BatteryConfig() {
}

BatteryConfig.prototype.version = function() {
	return "1.0";
}

//

BatteryConfig.prototype.label = function() {
	return "Battery Level Trigger";
}

//

BatteryConfig.prototype.setup = function(controller) {
	this.choicesHighLimitSelector = [
		{'label': "0%", 'value': 0}, {'label': "5%", 'value': 5},
		{'label': "10%", 'value': 10}, {'label': "15%", 'value': 15},
		{'label': "20%", 'value': 20}, {'label': "25%", 'value': 25},
		{'label': "30%", 'value': 30}, {'label': "35%", 'value': 35},
		{'label': "40%", 'value': 40}, {'label': "45%", 'value': 45},
		{'label': "50%", 'value': 50}, {'label': "55%", 'value': 55},
		{'label': "60%", 'value': 60}, {'label': "65%", 'value': 65},
		{'label': "70%", 'value': 70}, {'label': "75%", 'value': 75},
		{'label': "80%", 'value': 80}, {'label': "85%", 'value': 85},
		{'label': "90%", 'value': 90}, {'label': "95%", 'value': 95},
		{'label': "100%", 'value': 100}];  

	controller.setupWidget("BatteryHighSelector", {'label': "High Limit", 
		'labelPlacement': "left", 'modelProperty': "batteryHigh",
		'choices': this.choicesHighLimitSelector});
	
	this.choicesLowLimitSelector = [
		{'label': "0%", 'value': 0}, {'label': "5%", 'value': 5},
		{'label': "10%", 'value': 10}, {'label': "15%", 'value': 15},
		{'label': "20%", 'value': 20}, {'label': "25%", 'value': 25},
		{'label': "30%", 'value': 30}, {'label': "35%", 'value': 35},
		{'label': "40%", 'value': 40}, {'label': "45%", 'value': 45},
		{'label': "50%", 'value': 50}, {'label': "55%", 'value': 55},
		{'label': "60%", 'value': 60}, {'label': "65%", 'value': 65},
		{'label': "70%", 'value': 70}, {'label': "75%", 'value': 75},
		{'label': "80%", 'value': 80}, {'label': "85%", 'value': 85},
		{'label': "90%", 'value': 90}, {'label': "95%", 'value': 95},
		{'label': "100%", 'value': 100}];  

	controller.setupWidget("BatteryLowSelector", {'label': "Low Limit", 
		'labelPlacement': "left", 'modelProperty': "batteryLow",
		'choices': this.choicesLowLimitSelector});
}

//

BatteryConfig.prototype.load = function(preferences) {
	var config = {
		'batteryHigh': preferences.batteryHigh,
		'batteryLow': preferences.batteryLow };
	
	return config;
}

BatteryConfig.prototype.save = function(config) {
	var preferences = {
		'batteryHigh': config.batteryHigh,
		'batteryLow': config.batteryLow };
	
	return preferences;
}

//

BatteryConfig.prototype.config = function() {
	var config = {
		'batteryHigh': 100,
		'batteryLow': 0 };
	
	return config;
}

