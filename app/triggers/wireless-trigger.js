function WirelessTrigger(ServiceRequestWrapper) {
	this.service = ServiceRequestWrapper;

	this.ssid = "none";
	
	this.appid = "com.palm.org.e-lnx.wee.apps.modeswitcher";
}

//

WirelessTrigger.prototype.init = function(config) {
	this.config = config;

	this.subscribeWirelessStatus();
}

WirelessTrigger.prototype.reload = function(modes) {
}

WirelessTrigger.prototype.shutdown = function() {
	if(this.subscribtionWirelessStatus)
		this.subscribtionWirelessStatus.cancel();
}

//

WirelessTrigger.prototype.check = function(config) {
	if(this.ssid == config.wirelessSSID)
		return true;
	
	return false;
}

//

WirelessTrigger.prototype.execute = function(ssid, launchCallback) {
	Mojo.Log.info("Wireless trigger received: " + ssid);

	// Form a list of modes that the trigger involves and are valid.

	var modes = new Array();

	var close = false;

	for(var i = 0; i < this.config.currentMode.triggersList.length; i++) {
		if(this.config.currentMode.triggersList[i].type == "wireless") {
			close = true;
			
			break;
		}		
	}
	
	for(var i = 0; i < this.config.modesConfig.length; i++) {
		for(var j = 0; j < this.config.modesConfig[i].triggersList.length; j++) {
			if(this.config.modesConfig[i].triggersList[j].type == "wireless") {
				modes.push(this.config.modesConfig[i]);
				
				break;
			}
		}
	}

	launchCallback(modes, close);
}

//

WirelessTrigger.prototype.subscribeWirelessStatus = function() {
	// Subscribe to Wireless Notifications
	
	this.subscribtionWirelessStatus = this.service.request('palm://com.palm.wifi/', {
		method: 'getstatus', parameters: {"subscribe": true},
		onSuccess: this.handleWirelessStatus.bind(this)});
}

WirelessTrigger.prototype.handleWirelessStatus = function(payload) {
	if (payload.status == 'connectionStateChanged') {
		if(payload.networkInfo.connectState == "ipConfigured") {
			this.ssid = payload.networkInfo.ssid;
			
			this.service.request("palm://com.palm.applicationManager", {'method': "launch", 
				'parameters': {'id': this.appid, 'params': {
					'action': "trigger", 'event': "wireless", 'data': this.ssid}} });
		}
		else if(this.ssid != "none") {
			this.ssid = "none";
		
			this.service.request("palm://com.palm.applicationManager", {'method': "launch", 
				'parameters': {'id': this.appid, 'params': {
					'action': "trigger", 'event': "wireless", 'data': "none"}} });
		}
	}
}

