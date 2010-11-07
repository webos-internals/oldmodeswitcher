function BluetoothTrigger(Config, Control) {
	this.config = Config;

	this.service = Control.service;

	this.initialized = false;

	this.startupCallback = null;
	this.executeCallback = null;

	this.btConnected = new Array();
}

//

BluetoothTrigger.prototype.init = function(startupCallback) {
	this.initialized = false;

	this.startupCallback = startupCallback;

	this.checkRadioState(false);
}

BluetoothTrigger.prototype.shutdown = function() {
	this.initialized = false;

	this.startupCallback = null;
	
	this.btConnected = new Array();
}

//

BluetoothTrigger.prototype.enable = function(executeCallback) {
	this.executeCallback = executeCallback;

	this.checkRadioState(true);
	
	this.subscribeMonitorStatus();
}

BluetoothTrigger.prototype.disable = function() {
	this.executeCallback = null;

	if(this.subscribtionProfileStatus)
		this.subscribtionProfileStatus.cancel();

	if(this.subscribtionMonitorStatus)
		this.subscribtionMonitorStatus.cancel();
}

//

BluetoothTrigger.prototype.check = function(triggerConfig, modeName) {
	for(var i = 0; i < this.btConnected.length; i++) {
		if((triggerConfig.bluetoothState == 0) && ((triggerConfig.bluetoothProfile == "any") || 
			(triggerConfig.bluetoothProfile == this.btConnected[i].profile)))
		{
			return true;
		}
		else if((triggerConfig.bluetoothState == 1) && ((triggerConfig.bluetoothProfile != "any") && 
			(triggerConfig.bluetoothProfile == this.btConnected[i].profile)))
		{
			return false;
		}
		else if((triggerConfig.bluetoothState == 2) && ((triggerConfig.bluetoothProfile == "any") || 
			(triggerConfig.bluetoothProfile == this.btConnected[i].profile)) && 
			(triggerConfig.bluetoothDevice.toLowerCase() == this.btConnected[i].name.toLowerCase()))
		{
			return true;
		}
		else if((triggerConfig.bluetoothState == 3) && ((triggerConfig.bluetoothProfile != "any") && 
			(triggerConfig.bluetoothProfile == this.btConnected[i].profile)) &&
			(triggerConfig.bluetoothDevice.toLowerCase() == this.btConnected[i].name.toLowerCase()))
		{
			return false;
		}
	}

	if((triggerConfig.bluetoothState == 0) || (triggerConfig.bluetoothState == 2))
		return false;
	else 
		return true;
}

//

BluetoothTrigger.prototype.execute = function(triggerData, manualLaunch) {
	Mojo.Log.error("Bluetooth trigger received: " + Object.toJSON(triggerData));

	var oldConnected = Object.toJSON(this.btConnected);

	var startModes = new Array();
	var closeModes = new Array();

	if(triggerData.reset)
		this.btConnected = new Array();
	
	if(triggerData.connected) {
		var index = -1;
	
		for(var i = 0; i < this.btConnected.length; i++) {
			if((this.btConnected[i].profile == triggerData.connected.profile) &&
				(this.btConnected[i].name == triggerData.connected.name))
			{
				index = i;
				break;
			}
		}	

		if(index == -1)
			this.btConnected.push(triggerData.connected);
	}

	if(triggerData.disconnected) {
		for(var i = 0; i < this.btConnected.length; i++) {
			if((this.btConnected[i].profile == triggerData.disconnected.profile) &&
				(this.btConnected[i].name == triggerData.disconnected.name))
			{
				this.btConnected.splice(i, 1);
				break;
			}
		}
	}

	if(oldConnected != Object.toJSON(this.btConnected)) {
		for(var i = 0; i < this.config.modesConfig.length; i++) {
			for(var j = 0; j < this.config.modesConfig[i].triggersList.length; j++) {
				if(this.config.modesConfig[i].triggersList[j].extension == "bluetooth") {
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

BluetoothTrigger.prototype.checkRadioState = function(subscribeRequest) {
	this.service.request("palm://com.palm.btmonitor/monitor/", {
		'method': "getradiostate", 'parameters': {}, 
		'onSuccess': this.handleRadioState.bind(this, subscribeRequest),
		'onFailure': this.handleTriggerError.bind(this)});
}

BluetoothTrigger.prototype.handleRadioState = function(subscribeRequest, serviceResponse) {
	if(serviceResponse.radio == "on"){
		// Radio on so start monitoring for profile messages.
		
		this.subscribeProfileStatus(subscribeRequest);
	}
	else if(!this.initialized) {
		this.initialized = true;
		this.startupCallback(true);
		this.startupCallback = null;
	}
}

//

BluetoothTrigger.prototype.subscribeMonitorStatus = function() {
	// Subscribe / unsubscribe for radio state notifications.
	
	this.subscribtionMonitorStatus = this.service.request("palm://com.palm.btmonitor/monitor/", {
		'method': "subscribenotifications", 'parameters': {'subscribe': true},
		'onComplete': this.handleMonitorNotifications.bind(this)});
}

BluetoothTrigger.prototype.handleMonitorNotifications = function(serviceResponse) {
	// Bluetooth radio state notification handler.
	
	if((serviceResponse) && ((serviceResponse.notification) || (serviceResponse.radio))) {
		if(serviceResponse.notification == "notifnradioon" || serviceResponse.radio == "on") {
			this.subscribeProfileStatus(true);
		}
		else if(serviceResponse.notification == "notifnradioturningoff") {
			if (this.subscribtionProfileStatus)
				this.subscribtionProfileStatus.cancel();

			this.execute({'reset': true}, false);
		}
	}
}

//

BluetoothTrigger.prototype.subscribeProfileStatus = function(subscripeRequest) {
	// Bluetooth radio must be on for these so only cal when you know it's on.
	
	this.subscribtionProfileStatus = this.service.request("palm://com.palm.bluetooth/prof/", {
		'method': "subscribenotifications", 'parameters': {'subscribe': subscripeRequest},
		'onComplete': this.handleProfileStatus.bind(this)});
}

BluetoothTrigger.prototype.handleProfileStatus = function(serviceResponse) {
	if((serviceResponse) && (serviceResponse.profile)) {
		if(serviceResponse.notification == "notifnconnected")
			var connected = true;
		else
			var connected = false;

		if((connected) && (serviceResponse.error)) {
			if(parseFloat(serviceResponse.error) !== 0)
				connected = false;
		}
		
		if(serviceResponse.notification == "notifndisconnected")
			var disconnected = true;
		else
			var disconnected = false;

		// Only act of connected or disconnected notifications.
		
		if(connected)
			this.execute({'connected': {'profile': serviceResponse.profile, 'name': serviceResponse.name}});
		else if(disconnected)
			this.execute({'disconnected': {'profile': serviceResponse.profile, 'name': serviceResponse.name}});
	}
	
	if(!this.initialized) {
		this.initialized = true;
		this.startupCallback(true);
		this.startupCallback = null;
	}
}

//

BluetoothTrigger.prototype.handleTriggerError = function(serviceResponse) {
	if(this.startupCallback) {
		this.startupCallback(false);
		this.startupCallback = null;
	}
}

