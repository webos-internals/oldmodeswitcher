function WirelessTrigger(Config, Control) {
	this.config = Config;

	this.service = Control.service;

	this.initialized = false;
	
	this.startupCallback = null;
	this.executeCallback = null;

	this.currentSSID = "unknown";
	this.activeSSID = "unknown";
	
	this.timeoutTrigger = null;
}

//

WirelessTrigger.prototype.init = function(startupCallback) {
	this.initialized = false;
	
	this.startupCallback = startupCallback;

	this.subscribeWirelessStatus(false);
}

WirelessTrigger.prototype.shutdown = function() {
	this.initialized = false;

	this.startupCallback = null;
	
	this.currentSSID = "unknown";
	this.activeSSID = "unknown";
}

//

WirelessTrigger.prototype.enable = function(executeCallback) {
	this.executeCallback = executeCallback;

	this.subscribeWirelessStatus(true);
}

WirelessTrigger.prototype.disable = function() {
	this.executeCallback = null;

	if(this.subscribtionWirelessStatus)
		this.subscribtionWirelessStatus.cancel();
}

//

WirelessTrigger.prototype.check = function(triggerConfig, modeName) {
	if((this.currentSSID != "none") && (triggerConfig.wirelessState == 0))
		return true;

	if((this.currentSSID == "none") && (triggerConfig.wirelessState == 1))
		return true;

	if((this.currentSSID == triggerConfig.wirelessSSID.toLowerCase()) && 
		(triggerConfig.wirelessState == 2))
	{
		return true;
	}
	
	if((this.currentSSID != triggerConfig.wirelessSSID.toLowerCase()) && 
		(triggerConfig.wirelessState == 3))
	{
		return true;
	}
	
	return false;
}

//

WirelessTrigger.prototype.execute = function(triggerData, manualLaunch) {
	Mojo.Log.error("Wireless trigger received: " + Object.toJSON(triggerData));

	var startModes = new Array();
	var closeModes = new Array();

	if(triggerData.ssid) {
		if(manualLaunch) {
			this.currentSSID = triggerData.ssid;
			this.activeSSID = "unknown";
		}

		if(this.activeSSID != triggerData.ssid) {
			this.activeSSID = triggerData.ssid;
			
			for(var i = 0; i < this.config.modesConfig.length; i++) {
				for(var j = 0; j < this.config.modesConfig[i].triggersList.length; j++) {
					if(this.config.modesConfig[i].triggersList[j].extension == "wireless") {
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
}

//

WirelessTrigger.prototype.subscribeWirelessStatus = function(subscribeRequest) {
	this.subscribtionWirelessStatus = this.service.request("palm://com.palm.wifi/", {
		'method': "getstatus", 'parameters': {'subscribe': subscribeRequest},
		'onSuccess': this.handleWirelessStatus.bind(this),
		'onFailure': this.handleTriggerError.bind(this)});
}

WirelessTrigger.prototype.handleWirelessStatus = function(serviceResponse) {
	if(!this.initialized) {
		if((serviceResponse) && (serviceResponse.networkInfo) && (serviceResponse.networkInfo.ssid))
			this.currentSSID = serviceResponse.networkInfo.ssid.toLowerCase();
	
		this.initialized = true;
		this.startupCallback(true);
		this.startupCallback = null;
	}
	else if(serviceResponse) {
		if (serviceResponse.status == "connectionStateChanged") {
			if(serviceResponse.networkInfo.connectState == "ipConfigured") {
				if(this.currentSSID != serviceResponse.networkInfo.ssid.toLowerCase())
					this.handleWirelessEvent(serviceResponse.networkInfo.ssid.toLowerCase());
			}
			else if(this.currentSSID != "none") {
				this.handleWirelessEvent("none");
			}
		}
	}
}

//

WirelessTrigger.prototype.handleWirelessEvent = function(connectedSSID) {
	var timeout = 0;

	if(this.timeoutTrigger)
		clearTimeout(this.timeoutTrigger);

	if((connectedSSID == "none") && (this.currentSSID != "none")) {
		for(var i = 0; i < this.config.modesConfig.length; i++) {
			if((this.config.modesConfig[i].name == this.config.currentMode.name) ||
				(this.config.modifierModes.indexOf(this.config.modesConfig[i].name) != -1))
			{
				for(var j = 0; j < this.config.modesConfig[i].triggersList.length; j++) {
					if(this.config.modesConfig[i].triggersList[j].extension == "wireless") {
						if(this.config.modesConfig[i].triggersList[j].wirelessSSID.toLowerCase() == this.currentSSID) {
							if(timeout < this.config.modesConfig[i].triggersList[j].wirelessDelay * 1000)
								timeout = this.config.modesConfig[i].triggersList[j].wirelessDelay * 1000;
						}
					}		
				}		
			}
		}
	}

	this.currentSSID = connectedSSID;
	
	this.timeoutTrigger = setTimeout(this.execute.bind(this, {'ssid': connectedSSID}, false), timeout);
}

//

WirelessTrigger.prototype.handleTriggerError = function(serviceResponse) {
	if(this.startupCallback) {
		this.startupCallback(false);
		this.startupCallback = null;
	}
}

