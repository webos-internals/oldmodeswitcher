function BtprofileTrigger(ServiceRequestWrapper, SystemAlarmsWrapper, SystemNotifierWrapper) {
	this.service = ServiceRequestWrapper;

	this.callback = null;
	this.initialized = false;

	this.config = null;
	this.enabled = false;
		
	this.profile = "none";
	this.connected = false;
	this.profileState = 0;
}

//

BtprofileTrigger.prototype.init = function(callback) {
	this.callback = callback;

	this.initialized = false;
	
	this.checkRadioState();
}

BtprofileTrigger.prototype.shutdown = function() {
	this.initialized = false;

	this.profile = "none";
	this.connected = false;
	this.profileState = 0;

	this.subscribeRadioStatus("cancel");
	
	this.subscribeMonitorNotifications("cancel");
}

//

BtprofileTrigger.prototype.enable = function(config) {
	this.config = config;
	
	this.enabled = true;
}

BtprofileTrigger.prototype.disable = function() {
	this.enabled = false;
}

//

BtprofileTrigger.prototype.check = function(config) {
	this.log("check: config",Object.toJSON(config));
	this.log("check: this.profile:",this.profile);
	this.log("check: this.profileState:",this.profileState);
	this.log("check: this.connected:",this.connected);
	
	if((this.profile == config.profile) && 
		(this.profileState == config.profileState || config.profileState == 2))
	{
		this.log("check: true")
		
		return true;
	}
	else if((this.connected) && 
		(this.profileState == 0 || config.profileState == 2))
	{
		// Check for bluetooth switching off while profile is connected.

		this.log("check: true2")
		
		return true;
	}
	
	this.log("check: false")
	
	return false;
}

//

BtprofileTrigger.prototype.execute = function(profile, launchCallback) {
	Mojo.Log.info("Btprofile trigger received: " + profile);

	var startModes = new Array();
	var closeModes = new Array();

	for(var i = 0; i < this.config.modesConfig.length; i++) {
		for(var j = 0; j < this.config.modesConfig[i].triggersList.length; j++) {
			if(this.config.modesConfig[i].triggersList[j].extension == "btprofile") {
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

BtprofileTrigger.prototype.checkRadioState = function() {
	new Mojo.Service.Request("palm://com.palm.btmonitor/monitor/", {
		'method': "getradiostate", 'parameters': {}, 
		'onSuccess': this.handleRadioState.bind(this),
		'onFailure': this.handleTriggerError.bind(this)});
}

BtprofileTrigger.prototype.handleRadioState = function(response) {
	this.log("handleInitRadioState:","response:", Object.toJSON(response));
	
	this.log("handleInitRadioState:","handleInitRadioState:", "Subscribing to radio state notifications.");
	
	if(!this.initialized) {
		this.initialized = true;
		this.callback(true);
		this.callback = null;
	}
	
	// Subscribe to bluetooth radio state notifications.

	this.subscribeMonitorNotifications("register");
	
	if(response.radio == "on"){
		// Radio already on so no notification have been recieved to start monitoring for profile messages.
		
		this.log("handleInitRadioState:","handleInitRadioState:", "Radio already on.");
		this.log("handleInitRadioState:","handleInitRadioState:", "Manually starting profile notifications");

		// Manually start profile monitoring notifications.
		
		this.subscribeRadioStatus("register");
	}
	else
		this.log("handleInitRadioState:","handleInitRadioState:", "Radio is not on");

	this.log("handleInitRadioState:","handleInitRadioState:", "done.");
}

BtprofileTrigger.prototype.handleTriggerError = function(response) {
	this.callback(false);
	this.callback = null;
}

//

BtprofileTrigger.prototype.subscribeMonitorNotifications = function(register) {
	// Subscribe / unsubscribe for radio state notifications.
	
	if(register == "register") {
		if(!this.monitorServiceCall) {
			this.log("Subscribe to service notifications")
			
			this.monitorServiceCall = new Mojo.Service.Request("palm://com.palm.btmonitor/monitor/", {
				'method': "subscribenotifications", 'parameters': {'subscribe': true},
				'onComplete': this.handleMonitorNotifications.bind(this)});
		}
	}
	else {
		this.connected = false;
		
		if(this.monitorServiceCall) {
			this.log("Unsubscribing service notifications")
			
			this.monitorServiceCall.cancel();
			this.monitorServiceCall = null;
		}
	}
}

BtprofileTrigger.prototype.handleMonitorNotifications = function(response) {
	// Bluetooth radio state notification handler.
	
	this.log("handleMonitorNotifications.");
	this.log("handleMonitorNotifications: continuing with valid response.", Object.toJSON(response));
	
	if(!response)
		return;
	
	// Samples:
	// {"returnValue": true, "subscribed": true, "radio": "on"}
	// {"notification": "notifnradiooff", "error": 0}
	
	if(response.notification || response.radio) {
		this.log("response.notification:",response.notification)
	    
		if(response.notification == "notifnradioon" || response.radio == "on") {
			this.log("Bluetooth radio is on. Requesting subscription for profile notifications.");
			
			this.subscribeRadioStatus("register");
			
			return;
		}
		else if(this.connected && response.notification == "notifnradioturningoff") {
    		/*
			Check for bluetooth switch off when connected to selected profile.
			When connected to a profile and the bluetooth radio is switched off
			we do not recieve the diconnect message.
			*/

			this.connected = false;
		    
			new Mojo.Service.Request("palm://com.palm.applicationManager", {'method': "launch", 
			    'parameters': {'id': Mojo.Controller.appInfo.id, 'params': {'action': "trigger", 
			    	'event': "btprofile", 'data': this.profile}}});

			return;
		}
	}

	this.log("Canceling subscription for profile notifications.");

	this.subscribeRadioStatus("cancel");
}

//


BtprofileTrigger.prototype.subscribeRadioStatus = function(register) {
	// Subscribe to profile Notifications.
	
	// Bluetooth radio must be on for these so only cal when you know it's on.
	
	this.log("subscribeRadioStatus: register:", register);
	
	if(register == "register") {
		if(!this.subscribtionStatus) {
			this.log("Subscribe to profile notifications")
			
			this.subscribtionStatus = new Mojo.Service.Request("palm://com.palm.bluetooth/prof/", {
				'method': "subscribenotifications", 'parameters': {'subscribe': true},
				'onComplete': this.handleRadioStatus.bind(this)});
		}
	}
	else {
		// Unsubscribe for profile notifications.
		
		if (this.subscribtionStatus) {
			this.log("Unsubscribing profile notifications")
		    
			this.subscribtionStatus.cancel();
			this.subscribtionStatus = null;
		}
	}
}

BtprofileTrigger.prototype.handleRadioStatus = function(response) {
	
	// Handle bluetooth profile notifications.
	
	// Samples:
	// {"returnValue": true, "subscribed": true}
	// {"notification": "notifnconnected", "profile": "hfg", "address": "40:2b:a1:5d:e9:82", "name": "Headset", "error": 0}
	// {"notification": "notifnconnected", "profile": "a2dp", "address": "40:2b:a1:5d:e9:82", "name": "Headset", "error": 0}
	// {"notification": "notifndisconnected", "profile": "a2dp", "address": "40:2b:a1:5d:e9:82", "name": "Headset", "error": 0}
	// {"notification": "notifndisconnected", "profile": "hfg", "address": "40:2b:a1:5d:e9:82", "name": "Headset", "error": 0}
	
	this.log("handleRadioStatus: response:", Object.toJSON(response));
	
	if((!response) ||	(!response.returnValue))
		return;
	
	if(response.profile) {
		var profile = response.profile;
		
		if(response.notification == "notifnconnected")
			var connected = true;
		else
			var connected = false;

		if(connected) {
			if(response.error){
				if(parseFloat(response.error) !== 0){
					this.log("handleRadioStatus: response: error:", response.error);
					
					connected = false;
				}
			}
		}
		
		if(response.notification == "notifndisconnected")
			var disconnected = true;
		else
			var disconnected = false;

		if((connected == true) || (disconnected == true))
			var activatetrigger = true;
		else
			var activatetrigger = false;
		
		this.log("handleRadioStatus: config:", Object.toJSON(this.config))
		this.log("handleRadioStatus: profile:" + profile,"handleRadioStatus: connected:" + connected,"handleRadioStatus: disconnected:" + disconnected,"handleRadioStatus: activatetrigger:" + activatetrigger);
		
		// Only act of connected or disconnected notifications.
		
		if(connected || disconnected) {
			this.profile = profile;
			this.connected = connected;
			
			this.log("connected || disconnected");
			
			// Store profile state.

			if(connected) 
				this.profileState = 1;
			else
				this.profileState = 0;

			this.log("this.profileState:",this.profileState);
			this.log("Sending trigger notification...")
			
			new Mojo.Service.Request("palm://com.palm.applicationManager", {'method': "launch", 
				'parameters': {'id': Mojo.Controller.appInfo.id, 'params': {'action': "trigger", 
					'event': "btprofile", 'data': this.profile}}});
		}
		
		return;
	}
	
	this.log("No action taken for status notification.");
}

//

BtprofileTrigger.prototype.log = function(param, param2, param3, param4) {
	//Mojo.Log.error("BtprofileTrigger DEBUG:", param, param2, param3, param4);
}
