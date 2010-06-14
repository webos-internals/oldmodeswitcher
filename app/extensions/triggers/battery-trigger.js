function BatteryTrigger(ServiceRequestWrapper) {
	this.service = ServiceRequestWrapper;

	this.batteryLevel = 0;
	
	this.appid = "com.palm.org.e-lnx.wee.apps.modeswitcher";
}

//

BatteryTrigger.prototype.init = function(config) {
	this.config = config;

	this.subscribeBatteryStatus();
}

BatteryTrigger.prototype.reload = function(modes) {
}

BatteryTrigger.prototype.shutdown = function() {
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

	// Form a list of modes that the trigger involves and are valid.

	var modes = new Array();

	var close = false;

	for(var i = 0; i < this.config.currentMode.triggersList.length; i++) {
		if(this.config.currentMode.triggersList[i].type == "battery") {
			close = true;
			
			break;
		}		
	}
	
	for(var i = 0; i < this.config.modesConfig.length; i++) {
		for(var j = 0; j < this.config.modesConfig[i].triggersList.length; j++) {
			if(this.config.modesConfig[i].triggersList[j].type == "battery") {
				modes.push(this.config.modesConfig[i]);
				
				break;
			}
		}
	}

	launchCallback(modes, close);
}

//

BatteryTrigger.prototype.subscribeBatteryStatus = function() {
	// Subscribe to Battery Notifications
	
	this.subscribtionBatteryStatus = this.service.request('palm://com.palm.bus/signal/', {
		method: 'addmatch', parameters: {"category":"/com/palm/power","method":"batteryStatus"},
		onSuccess: this.handleBatteryStatus.bind(this)});

	// Get the Initial Value for battery status (returned as signals)
	
	this.requestBatteryStatus = this.service.request('palm://com.palm.power/com/palm/power/', {
		method: 'batteryStatusQuery',});
}

BatteryTrigger.prototype.handleBatteryStatus = function(payload) {
	if (payload.percent_ui != undefined) {
		
		//Save the Battery Level

		var oldLevel = this.batteryLevel;
		
		this.batteryLevel = payload.percent_ui;
		
		if((oldLevel != this.batteryLevel) && (((this.batteryLevel % 5) == 0) || 
			((this.batteryLevel % 5) == 1) || ((this.batteryLevel % 5) == 4))) {
			this.service.request("palm://com.palm.applicationManager", {'method': "launch", 
				'parameters': {'id': this.appid, 'params': {
					'action': "trigger", 'event': "battery", 'data': this.batteryLevel}} });
		}
	}
}

