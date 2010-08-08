function BluetoothTrigger(ServiceRequestWrapper, SystemAlarmsWrapper) {
	this.service = ServiceRequestWrapper;

	this.callback = null;
	this.initialized = false;

	this.config = null;
	this.enabled = false;
		
	this.connected = new Array();
}

//

BluetoothTrigger.prototype.init = function(callback) {
	this.callback = callback;

	this.initialized = false;
	
	this.checkRadioState();
}

BluetoothTrigger.prototype.shutdown = function() {
	this.initialized = false;

	this.connected = new Array();

	if(this.subscribtionMonitorStatus)
		this.subscribtionMonitorStatus.cancel();
	
	this.subscribeProfileStatus("cancel");
}

//

BluetoothTrigger.prototype.enable = function(config) {
	this.config = config;
	
	this.enabled = true;
}

BluetoothTrigger.prototype.disable = function() {
	this.enabled = false;
}

//

BluetoothTrigger.prototype.check = function(config) {
	for(var i = 0; i < this.connected.length; i++) {
		if((config.bluetoothState == 0) && ((config.bluetoothProfile == "any") || 
			(config.bluetoothProfile == this.connected[i].profile)))
		{
			return true;
		}
		else if((config.bluetoothState == 1) && ((config.bluetoothProfile != "any") && 
			(config.bluetoothProfile == this.connected[i].profile)))
		{
			return false;
		}
		else if((config.bluetoothState == 2) && ((config.bluetoothProfile == "any") || 
			(config.bluetoothProfile == this.connected[i].profile)) && 
			(config.bluetoothDevice == this.connected[i].name))
		{
			return true;
		}
		else if((config.bluetoothState == 3) && ((config.bluetoothProfile != "any") && 
			(config.bluetoothProfile == this.connected[i].profile)) &&
			(config.bluetoothDevice == this.connected[i].name))
		{
			return false;
		}
	}

	if((config.bluetoothState == 0) | (config.bluetoothState == 2))
		return false;
	else 
		return true;
}

//

BluetoothTrigger.prototype.execute = function(connected, launchCallback) {
	Mojo.Log.error("Btprofile trigger received: " + connected);

	var startModes = new Array();
	var closeModes = new Array();

	for(var i = 0; i < this.config.modesConfig.length; i++) {
		for(var j = 0; j < this.config.modesConfig[i].triggersList.length; j++) {
			if(this.config.modesConfig[i].triggersList[j].extension == "bluetooth") {
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

BluetoothTrigger.prototype.checkRadioState = function() {
	this.service.request("palm://com.palm.btmonitor/monitor/", {
		'method': "getradiostate", 'parameters': {}, 
		'onSuccess': this.handleRadioState.bind(this),
		'onFailure': this.handleTriggerError.bind(this)});
}

BluetoothTrigger.prototype.handleRadioState = function(response) {
	// Subscribe to bluetooth radio state notifications.

	if(response.radio == "on"){
		// Radio on so start monitoring for profile messages.
		
		this.subscribeProfileStatus();
	}
	else if(!this.initialized) {
		this.initialized = true;
		this.callback(true);
		this.callback = null;
	}

	this.subscribeMonitorStatus();
}

//

BluetoothTrigger.prototype.subscribeMonitorStatus = function() {
	// Subscribe / unsubscribe for radio state notifications.
	
	this.subscribtionMonitorStatus = this.service.request("palm://com.palm.btmonitor/monitor/", {
		'method': "subscribenotifications", 'parameters': {'subscribe': true},
		'onComplete': this.handleMonitorNotifications.bind(this)});
}

BluetoothTrigger.prototype.handleMonitorNotifications = function(response) {
	// Bluetooth radio state notification handler.
	
	if((response) && ((response.notification) || (response.radio))) {
		if(response.notification == "notifnradioon" || response.radio == "on") {
			this.subscribeProfileStatus();
		}
		else if(response.notification == "notifnradioturningoff") {
			if (this.subscribtionProfileStatus)
				this.subscribtionProfileStatus.cancel();

			this.connected = new Array();
					   
		   if(this.enabled){
				this.service.request("palm://com.palm.applicationManager", {'method': "launch", 
					 'parameters': {'id': Mojo.Controller.appInfo.id, 'params': {'action': "trigger", 
					 	'event': "bluetooth", 'data': false}}});
			}
		}
	}
}

//

BluetoothTrigger.prototype.subscribeProfileStatus = function() {
	// Bluetooth radio must be on for these so only cal when you know it's on.
	
	this.subscribtionStatus = this.service.request("palm://com.palm.bluetooth/prof/", {
		'method': "subscribenotifications", 'parameters': {'subscribe': true},
		'onComplete': this.handleProfileStatus.bind(this)});
}

BluetoothTrigger.prototype.handleProfileStatus = function(response) {
	if((response) && (response.profile)) {

	Mojo.Log.error("AAA " + Object.toJSON(response));
	
		if(response.notification == "notifnconnected")
			var connected = true;
		else
			var connected = false;

		if((connected) && (response.error)) {
			if(parseFloat(response.error) !== 0)
				connected = 0;
		}
		
		if(response.notification == "notifndisconnected")
			var disconnected = true;
		else
			var disconnected = false;

		// Only act of connected or disconnected notifications.
		
		if(connected || disconnected) {
			var index = -1;
		
			for(var i = 0; i < this.connected.length; i++) {
				if((this.connected[i].profile == response.profile) &&
					(this.connected[i].name == response.name))
				{
					index = i;
					break;
				}
			}
			
			if((index == -1) && (connected))
				this.connected.push({'profile': response.profile, 'name': response.name});

			if((index != -1) && (disconnected))
				this.connected.splice(index, 1);
			
			if(this.enabled) {
				this.service.request("palm://com.palm.applicationManager", {'method': "launch", 
					'parameters': {'id': Mojo.Controller.appInfo.id, 'params': {'action': "trigger", 
						'event': "bluetooth", 'data': connected}}});
			}
		}
	}
	
	if(!this.initialized) {
		this.initialized = true;
		this.callback(true);
		this.callback = null;
	}
}

//

BluetoothTrigger.prototype.handleTriggerError = function(response) {
	if(this.callback) {
		this.callback(false);
		this.callback = null;
	}
}

