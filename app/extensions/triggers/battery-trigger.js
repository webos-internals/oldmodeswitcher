function BatteryTrigger(ServiceRequestWrapper, SystemAlarmsWrapper, SystemNotifierWrapper) {
	this.service = ServiceRequestWrapper;

	this.batteryLevel = 0;
	
	this.appid = "com.palm.org.e-lnx.wee.apps.modeswitcher";
}

//

BatteryTrigger.prototype.init = function(config) {
	this.config = config;

	this.subscribeBatteryStatus();
}

BatteryTrigger.prototype.shutdown = function(config) {
	this.config = config;

	if(this.subscribtionBatteryStatus)
		this.subscribtionBatteryStatus.cancel();
}

//

BatteryTrigger.prototype.check = function(config) {
	if((this.batteryLevel <= config.batteryHigh) && 
		(this.batteryLevel >= config.batteryLow))
	{
		return true;
	}

	return false;
}

//

BatteryTrigger.prototype.execute = function(level, launchCallback) {
	Mojo.Log.info("Battery trigger received: " + level);

	var startModes = new Array();
	var closeModes = new Array();
	
	for(var i = 0; i < this.config.modesConfig.length; i++) {
		for(var j = 0; j < this.config.modesConfig[i].triggersList.length; j++) {
			if(this.config.modesConfig[i].triggersList[j].extension == "battery") {
				if((this.config.modesConfig[i].name != this.config.currentMode.name) &&
					(this.config.modifierModes.indexOf(this.config.modesConfig[i].name) == -1))
				{
					startModes.push(this.config.modesConfig[i]);
				}
				else {
					closeModes.push(this.config.modesConfig[i]);
				}
				
				break;
			}
		}
	}

	launchCallback(startModes, closeModes);
}

//

BatteryTrigger.prototype.subscribeBatteryStatus = function() {
	// Subscribe to Battery Notifications
	
	this.subscribtionBatteryStatus = new Mojo.Service.Request("palm://com.palm.bus/signal/", {
		'method': "addmatch", 'parameters': {'category':"/com/palm/power",'method':"batteryStatus"},
		'onSuccess': this.handleBatteryStatus.bind(this)});

	// Get the Initial Value for battery status (returned as signals)
	
	this.requestBatteryStatus = new Mojo.Service.Request("palm://com.palm.power/com/palm/power/", {
		'method': "batteryStatusQuery"});
}

BatteryTrigger.prototype.handleBatteryStatus = function(response) {
	if (response.percent_ui != undefined) {
		
		// Save the Battery Level

		var oldLevel = this.batteryLevel;
		
		this.batteryLevel = response.percent_ui;
		
		if((oldLevel != this.batteryLevel) && (((this.batteryLevel % 5) == 0) || 
			((this.batteryLevel % 5) == 1) || ((this.batteryLevel % 5) == 4))) {
			new Mojo.Service.Request("palm://com.palm.applicationManager", {'method': "launch", 
				'parameters': {'id': this.appid, 'params': {'action': "trigger", 
					'event': "battery", 'data': this.batteryLevel}}});
		}
	}
}

