function HeadsetTrigger(Config, Control) {
	this.config = Config;

	this.service = Control.service;

	this.initialized = false;

	this.startupCallback = null;
	this.executeCallback = null;

	this.connected = "none";
}

//

HeadsetTrigger.prototype.init = function(startupCallback) {
	this.initialized = true;

	startupCallback(true);
}

HeadsetTrigger.prototype.shutdown = function() {
	this.initialized = false;

	this.connected = "none";
}


//

HeadsetTrigger.prototype.enable = function(executeCallback) {
	this.executeCallback = executeCallback;
	
	this.subscribeHeadsetStatus(true);
}

HeadsetTrigger.prototype.disable = function() {
	this.executeCallback = null;
	
	if(this.subscribtionHeadsetStatus)
		this.subscribtionHeadsetStatus.cancel();
}

//

HeadsetTrigger.prototype.check = function(triggerConfig, modeName) {
	if((triggerConfig.headsetState == 0) && (((triggerConfig.headsetScenario == 0) && (this.connected != "none")) ||
		((triggerConfig.headsetScenario == 1) && (this.connected == "media_headset")) ||
		((triggerConfig.headsetScenario == 2) && (this.connected == "media_headset_mic"))))
	{
		return true;
	}
	
	if((triggerConfig.headsetState == 1) && (((triggerConfig.headsetScenario == 0) && (this.connected == "none")) ||
		((triggerConfig.headsetScenario == 1) && (this.connected != "media_headset")) ||
		((triggerConfig.headsetScenario == 2) && (this.connected != "media_headset_mic"))))
	{
		return true;
	}

	return false;
}

//

HeadsetTrigger.prototype.execute = function(triggerData, manualLaunch) {
	Mojo.Log.error("Headset trigger received: " + Object.toJSON(triggerData));

	var startModes = new Array();
	var closeModes = new Array();

	if((triggerData.connected) && (triggerData.connected != this.connected)) {
		this.connected = triggerData.connected;
			
		for(var i = 0; i < this.config.modesConfig.length; i++) {
			for(var j = 0; j < this.config.modesConfig[i].triggersList.length; j++) {
				if(this.config.modesConfig[i].triggersList[j].extension == "headset") {
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
				
					break;
				}
			}
		}

		if((this.executeCallback) && ((startModes.length > 0) || (closeModes.length > 0)))
			this.executeCallback(startModes, closeModes);
	}
}

//

HeadsetTrigger.prototype.subscribeHeadsetStatus = function(subscribeRequest) {
	this.subscribtionHeadsetStatus = this.service.request("palm://com.palm.audio/media/", {
		'method': "status", 'parameters': {"subscribe": subscribeRequest},
		'onSuccess': this.handleHeadsetStatus.bind(this)});
}

HeadsetTrigger.prototype.handleHeadsetStatus = function(serviceResponse) {
	if((serviceResponse.scenario) && (serviceResponse.action) && 
		((serviceResponse.scenario == "media_headset") ||
		(serviceResponse.scenario == "media_headset_mic")))
	{
		var connected = this.connected;

		if(serviceResponse.action == "enabled")
			connected = serviceResponse.scenario;
		else if(serviceResponse.action == "disabled")
			connected = "none";
	
		if(connected != this.connected) {
			this.execute({'connected': connected}, false);
		}
	}
}

