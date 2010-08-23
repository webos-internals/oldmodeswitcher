function AirplaneConfig() {
}

AirplaneConfig.prototype.version = function() {
	return "1.1";
}

//

AirplaneConfig.prototype.label = function() {
	return $L("Airplane Settings");
}

//

AirplaneConfig.prototype.activate = function() {
}

AirplaneConfig.prototype.deactivate = function() {
}

//

AirplaneConfig.prototype.setup = function(sceneController) {
	this.choicesAirplaneModeSelector = [
		{'label': sceneController.defaultChoiseLabel, 'value': -1},
		{'label': $L("Enabled"), 'value': 1},
		{'label': $L("Disabled"), 'value': 0} ];  

	sceneController.setupWidget("AirplaneModeSelector", {'label': $L("Flight Mode"),	
		'labelPlacement': "left", 'modelProperty': "airplaneMode", 
		'choices': this.choicesAirplaneModeSelector});
}

//

AirplaneConfig.prototype.config = function() {
	var settingConfig = {
		'airplaneTitle': $L("Airplane"),
		'airplaneMode': -1 };
	
	return settingConfig;
}

//

AirplaneConfig.prototype.load = function(settingPreferences) {
	var settingConfig = this.config();

	if(settingPreferences.airplaneMode != undefined)
		settingConfig.airplaneMode = settingPreferences.airplaneMode;
	
	return settingConfig;
}

AirplaneConfig.prototype.save = function(settingConfig) {
	var settingPreferences = {};
	
	if(settingConfig.airplaneMode != -1)
		settingPreferences.airplaneMode = settingConfig.airplaneMode;
	
	return settingPreferences;
}

