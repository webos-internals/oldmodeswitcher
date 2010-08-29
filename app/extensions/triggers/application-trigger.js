function ApplicationTrigger(Config, Control) {
	this.config = Config;

	this.service = Control.service;

	this.initialized = false;

	this.startupCallback = null;
	this.executeCallback = null;

	this.currentAppid = "none";
	
	this.closeTimer = null;
}

//

ApplicationTrigger.prototype.init = function(startupCallback) {
	this.initialized = false;

	this.startupCallback = startupCallback;

	this.subscribeForegroundApp(false);
}

ApplicationTrigger.prototype.shutdown = function() {
	this.initialized = false;
	
	this.startupCallback = null;

	this.currentAppid = "none";
	
	this.closeTimer = null;
}


//

ApplicationTrigger.prototype.enable = function(executeCallback) {
	this.executeCallback = executeCallback;

	this.subscribeForegroundApp(true);
}

ApplicationTrigger.prototype.disable = function() {
	this.executeCallback = null;

	if(this.subscribtionForegroundApp)
		this.subscribtionForegroundApp.cancel();
}

//

ApplicationTrigger.prototype.check = function(triggerConfig, modeName) {
	if((triggerConfig.applicationState == 0) && (triggerConfig.applicationId == this.currentAppid))
		return true;
		
	if((triggerConfig.applicationState == 1) && (triggerConfig.applicationId != this.currentAppid))
		return true;

	return false;
}

//

ApplicationTrigger.prototype.execute = function(triggerData, manualLaunch) {
	Mojo.Log.info("Application trigger received: " + Object.toJSON(triggerData));

	var delay = null;

	var startModes = new Array();
	var closeModes = new Array();
	
	if((triggerData.appid) && (triggerData.appid != this.currentAppid)) {
		this.currentAppid = triggerData.appid;

		for(var i = 0; i < this.config.modesConfig.length; i++) {
			for(var j = 0; j < this.config.modesConfig[i].triggersList.length; j++) {
				if(this.config.modesConfig[i].triggersList[j].extension == "application") {
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
							delay = this.config.modesConfig[i].triggersList[j].applicationDelay;

							closeModes.push(this.config.modesConfig[i]);
						
							break;
						}
					}
				}
			}
		}

		if(this.closeTimeout)
			clearTimeout(this.closeTimeout);

		if((this.executeCallback) && ((startModes.length > 0) || (closeModes.length > 0))) {
			if(!delay) {
				this.executeCallback(startModes, closeModes);
			}
			else {
				var func = this.executeCallback.bind(this, startModes, closeModes);
		
				this.closeTimeout = setTimeout(func, delay * 1000);
			}
		}
	}
}

//

ApplicationTrigger.prototype.subscribeForegroundApp = function(subscribeRequest) {
	this.subscriptionForegroundApp = this.service.request("palm://com.palm.systemmanager/", {
		'method': "getForegroundApplication", 'parameters': {'subscribe': subscribeRequest},
		'onSuccess': this.handleForegroundApp.bind(this),
		'onFailure': this.handleTriggerError.bind(this)});
}

ApplicationTrigger.prototype.handleForegroundApp = function(serviceResponse) {
	if(serviceResponse.id != undefined)
		var currentAppid = serviceResponse.id;
	else
		var currentAppid = "none";

	if(!this.initialized) {
		this.currentAppid = currentAppid;
	
		this.initialized = true;
		this.startupCallback(true);
		this.startupCallback = null;
	}
	else {
		if(this.currentAppid != currentAppid)
			this.execute({'appid': currentAppid}, false);
	}
}

//

ApplicationTrigger.prototype.handleTriggerError = function(serviceResponse) {
	if(this.startupCallback) {
		this.startupCallback(false);
		this.startupCallback = null;
	}
}

