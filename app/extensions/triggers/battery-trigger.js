function BatteryTrigger(Config, Control) {
	this.config = Config;
	
	this.service = Control.service;

	this.initialized = false;
	
	this.startupCallback = null;
	this.executeCallback = null;
	
	this.batteryLevel = 0;
}

//

BatteryTrigger.prototype.init = function(startupCallback) {
	this.initialized = false;

	this.startupCallback = startupCallback;

	this.subscribeBatteryStatus();
}

BatteryTrigger.prototype.shutdown = function() {
	this.initialized = false;

	this.startupCallback = null;

	this.batteryLevel = 0;

	if(this.subscribtionBatteryStatus)
		this.subscribtionBatteryStatus.cancel();
}


//

BatteryTrigger.prototype.enable = function(executeCallback) {
	this.executeCallback = executeCallback;
}

BatteryTrigger.prototype.disable = function() {
	this.executeCallback = null;
}

//

BatteryTrigger.prototype.check = function(triggerConfig, modeName) {
	if((this.batteryLevel <= triggerConfig.batteryHigh) && 
		(this.batteryLevel >= triggerConfig.batteryLow))
	{
		return true;
	}

	return false;
}

//

BatteryTrigger.prototype.execute = function(triggerData, manualLaunch) {
	Mojo.Log.info("Battery trigger received: " + Object.toJSON(triggerData));

	var startModes = new Array();
	var closeModes = new Array();
	
	if((triggerData.level) && (triggerData.level != this.batteryLevel)) {
		this.batteryLevel = triggerData.level;
	
		for(var i = 0; i < this.config.modesConfig.length; i++) {
			for(var j = 0; j < this.config.modesConfig[i].triggersList.length; j++) {
				if(this.config.modesConfig[i].triggersList[j].extension == "battery") {
					if((this.config.modesConfig[i].name != this.config.currentMode.name) &&
						(this.config.modifierModes.indexOf(this.config.modesConfig[i].name) == -1))
					{
						if(this.check(this.config.modesConfig[i].triggersList[j])) {
							startModes.push(this.config.modesConfig[i]);
							break;
						}
					}
					else {
						if(!this.check(this.config.modesConfig[i].triggersList[j])) {
							closeModes.push(this.config.modesConfig[i]);
							break;
						}
					}
				}
			}
		}

		if((this.executeCallback) && ((startModes.length > 0) || (closeModes.length > 0)))
			this.executeCallback(startModes, closeModes);
	}
}

//

BatteryTrigger.prototype.subscribeBatteryStatus = function() {
	this.subscribtionBatteryStatus = this.service.request("palm://com.palm.bus/signal/", {
		'method': "addmatch", 'parameters': {'category':"/com/palm/power",'method':"batteryStatus"},
		'onSuccess': this.handleBatteryStatus.bind(this),
		'onFailure': this.handleTriggerError.bind(this)});

	this.requestBatteryStatus = this.service.request("palm://com.palm.power/com/palm/power/", {
		'method': "batteryStatusQuery"});
}

BatteryTrigger.prototype.handleBatteryStatus = function(serviceResponse) {
	if(!this.initialized) {
		if (serviceResponse.percent_ui != undefined)
			this.batteryLevel = serviceResponse.percent_ui;

		this.initialized = true;
		this.startupCallback(true);
		this.startupCallback = null;
	}
	else if((serviceResponse.percent_ui != undefined) &&
		(serviceResponse.percent_ui != this.batteryLevel))
	{
		this.execute({'level': serviceResponse.percent_ui}, false);
	}
}

//

BatteryTrigger.prototype.handleTriggerError = function(serviceResponse) {
	if(this.startupCallback) {
		this.startupCallback(false);
		this.startupCallback = null;
	}
}

