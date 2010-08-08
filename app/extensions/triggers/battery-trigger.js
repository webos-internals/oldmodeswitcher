function BatteryTrigger(ServiceRequestWrapper, SystemAlarmsWrapper) {
	this.service = ServiceRequestWrapper;

	this.callback = null;
	this.initialized = false;

	this.config = null;
	this.enabled = false;
	
	this.batteryLevel = 0;
}

//

BatteryTrigger.prototype.init = function(callback) {
	this.callback = callback;

	this.initialized = false;

	this.subscribeBatteryStatus();
}

BatteryTrigger.prototype.shutdown = function() {
	this.initialized = false;

	this.batteryLevel = 0;

	if(this.subscribtionBatteryStatus)
		this.subscribtionBatteryStatus.cancel();
}


//

BatteryTrigger.prototype.enable = function(config) {
	this.config = config;
	
	this.enabled = true;
}

BatteryTrigger.prototype.disable = function() {
	this.enabled = false;
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
	
	this.subscribtionBatteryStatus = this.service.request("palm://com.palm.bus/signal/", {
		'method': "addmatch", 'parameters': {'category':"/com/palm/power",'method':"batteryStatus"},
		'onSuccess': this.handleBatteryStatus.bind(this),
		'onFailure': this.handleTriggerError.bind(this)});

	// Get the Initial Value for battery status (returned as signals)
	
	this.requestBatteryStatus = this.service.request("palm://com.palm.power/com/palm/power/", {
		'method': "batteryStatusQuery"});
}

BatteryTrigger.prototype.handleBatteryStatus = function(response) {
	if(!this.initialized) {
		if (response.percent_ui != undefined)
			this.batteryLevel = response.percent_ui;

		this.initialized = true;
		this.callback(true);
		this.callback = null;
	}
	else if((this.enabled) && (response.percent_ui != undefined)) {
		// Save the Battery Level

		var oldLevel = this.batteryLevel;
	
		this.batteryLevel = response.percent_ui;

		if((oldLevel != this.batteryLevel) && (((this.batteryLevel % 5) == 0) || 
			((this.batteryLevel % 5) == 1) || ((this.batteryLevel % 5) == 4))) {
			this.service.request("palm://com.palm.applicationManager", {'method': "launch", 
				'parameters': {'id': Mojo.Controller.appInfo.id, 'params': {'action': "trigger", 
					'event': "battery", 'data': this.batteryLevel}}});
		}
	}
}

BatteryTrigger.prototype.handleTriggerError = function(response) {
	if(this.callback) {
		this.callback(false);
		this.callback = null;
	}
}

