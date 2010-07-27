function WirelessTrigger(ServiceRequestWrapper, SystemAlarmsWrapper, SystemNotifierWrapper) {
	this.service = ServiceRequestWrapper;

	this.ssid = "unknown";
	
	this.appid = "com.palm.org.e-lnx.wee.apps.modeswitcher";

	this.timeoutTrigger = null;
}

//

WirelessTrigger.prototype.init = function(config) {
	this.config = config;

	this.subscribeWirelessStatus();
}

WirelessTrigger.prototype.shutdown = function(config) {
	this.config = config;
	
	if(this.subscribtionWirelessStatus)
		this.subscribtionWirelessStatus.cancel();
}

//

WirelessTrigger.prototype.check = function(config) {
	if((this.ssid != "none") && (config.wirelessState == 0))
		return true;

	if((this.ssid == "none") && (config.wirelessState == 1))
		return true;

	if((this.ssid == config.wirelessSSID) && (config.wirelessState == 2))
		return true;

	if((this.ssid != config.wirelessSSID) && (config.wirelessState == 3))
		return true;
			
	if(this.ssid == "unknown")
		return true;
	
	return false;
}

//

WirelessTrigger.prototype.execute = function(ssid, launchCallback) {
	Mojo.Log.info("Wireless trigger received: " + ssid);

	var startModes = new Array();
	var closeModes = new Array();

	for(var i = 0; i < this.config.modesConfig.length; i++) {
		for(var j = 0; j < this.config.modesConfig[i].triggersList.length; j++) {
			if(this.config.modesConfig[i].triggersList[j].extension == "wireless") {
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

	launchCallback(startModes, closeModes);}

//

WirelessTrigger.prototype.subscribeWirelessStatus = function() {
	this.subscribtionWirelessStatus = new Mojo.Service.Request("palm://com.palm.wifi/", {
		'method': "getstatus", 'parameters': {'subscribe': true},
		'onSuccess': this.handleWirelessStatus.bind(this)});
}

WirelessTrigger.prototype.handleWirelessStatus = function(response) {
	if (response.status == "connectionStateChanged") {
		if(response.networkInfo.connectState == "ipConfigured") {
			this.handleWirelessEvent(response.networkInfo.ssid);
		}
		else if(this.ssid != "none") {
			this.handleWirelessEvent("none");
		}
	}
}

WirelessTrigger.prototype.handleWirelessEvent = function(ssid) {
	var timeout = 0;

	if(this.timeoutTrigger)
		clearTimeout(this.timeoutTrigger);

	if((ssid == "none") && (this.ssid != "none")) {
		for(var i = 0; i < this.config.modesConfig.length; i++) {
			if(this.config.modesConfig[i].name == this.config.currentMode.name) {
				for(var j = 0; j < this.config.modesConfig[i].triggersList.length; j++) {
					if(this.config.modesConfig[i].triggersList[j].extension == "wireless") {
						if(this.config.modesConfig[i].triggersList[j].wirelessSSID == this.ssid) {
							timeout = this.config.modesConfig[i].triggersList[j].wirelessDelay * 1000;
				
							break;
						}
					}		
				}
			
				break;
			}
		}
	}
	
	this.timeoutTrigger = setTimeout(this.handleWirelessTrigger.bind(this, ssid), timeout);
}

WirelessTrigger.prototype.handleWirelessTrigger = function(ssid) {
	if((ssid != "none") && (ssid != "unknown")) {
		this.ssid = ssid;
			
		new Mojo.Service.Request("palm://com.palm.applicationManager", {'method': "launch", 
			'parameters': {'id': this.appid, 'params': {'action': "trigger", 
				'event': "wireless", 'data': this.ssid}} });
	}
	else {
		this.ssid = "none";
		
		new Mojo.Service.Request("palm://com.palm.applicationManager", {'method': "launch", 
			'parameters': {'id': this.appid, 'params': {'action': "trigger", 
				'event': "wireless", 'data': "none"}} });
	}
}

