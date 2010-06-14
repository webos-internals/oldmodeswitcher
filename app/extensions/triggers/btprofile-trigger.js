function BTProfileTrigger(ServiceRequestWrapper) {
	this.service = ServiceRequestWrapper;
	this.serviceCalls = [];
	this.profile = "none";
	this.triggertype = "btprofile";
	this.profileconnected = false;
	this.monitorNotificationHandler = this.handleMonitorNotifications.bind(this);
	this.profNotificationHandler = this.handleStatus.bind(this);
	
	this.appid = "com.palm.org.e-lnx.wee.apps.modeswitcher";
}

//

BTProfileTrigger.prototype.init = function(config) {
	this.config = config;
	this.log("init: config:",Object.toJSON(this.config));
	
	//Subscribe to bluetooth radio state notifications.
	this.subscribeMonitorNotifications("register");
}

BTProfileTrigger.prototype.reload = function(modes) {
}

BTProfileTrigger.prototype.shutdown = function() {
	//Cancel all notification subscriptions.
	this.subscribeStatus("");
	this.subscribeMonitorNotifications("");
}

//

BTProfileTrigger.prototype.check = function(config) {
	
	this.log("check: config",Object.toJSON(config));
	this.log("check: this.profile:",this.profile);
	this.log("check: this.profilestate:",this.profilestate);
	this.log("check: this.profileconnected:",this.profileconnected);
	
	if(this.profile == config.profile && (this.profilestate == config.profilestate || config.profilestate == 2)){
		this.log("check: true")
		return true;
	
	//Check for bluetooth switching off while profile is connected.
	}else if(this.profileconnected && (this.profilestate == 0 || config.profilestate == 2)){
		this.log("check: true2")
		return true;
	}
	this.log("check: false")
	return false;
}

//

BTProfileTrigger.prototype.execute = function(profile, launchCallback) {
	this.log("Bluetooth profile trigger received: " + profile);

	// Form a list of modes that the trigger involves and are valid.

	var modes = new Array();

	var close = false;

	for(var i = 0; i < this.config.currentMode.triggersList.length; i++) {
		if(this.config.currentMode.triggersList[i].type == this.triggertype) {
			close = true;
			
			break;
		}		
	}
	
	for(var i = 0; i < this.config.modesConfig.length; i++) {
		for(var j = 0; j < this.config.modesConfig[i].triggersList.length; j++) {
			if(this.config.modesConfig[i].triggersList[j].type == this.triggertype) {
				modes.push(this.config.modesConfig[i]);
				
				break;
			}
		}
	}

	launchCallback(modes, close);
}

//

BTProfileTrigger.prototype.subscribeMonitorNotifications = function(register) {
	// Subscribe / unsubscribe for radio state notifications
	if(register == "register"){
		if (!this.monitorServiceCall) {
			this.log("Subscribe to service notifications")
			this.monitorServiceCall = this.btMojoService("palm://com.palm.btmonitor/monitor/subscribenotifications", {
				subscribe: true
			    },
			this.monitorNotificationHandler, true);
			
		}
	}else{
		
		this.profileconnected = false;
		
		if (this.monitorServiceCall) {
		    this.log("Unsubscribing service notifications")
		    this.monitorServiceCall.cancel();
		    this.monitorServiceCall = null;
		}
	}

}

BTProfileTrigger.prototype.subscribeStatus = function(register) {
	// Subscribe to profile Notifications
	//Bluetooth radio must be on for these so only cal when you know it's on.
	
	this.log("subscribeStatus: register:", register);
	if(register == "register"){
		if (!this.subscribtionStatus) {
			this.log("Subscribe to profile notifications")
		    this.subscribtionStatus = this.btMojoService("palm://com.palm.bluetooth/prof/subscribenotifications", {
			subscribe: true
		    },
		    this.profNotificationHandler, true);
		}		
	}else{
		// Unsubscribe for profile notifications
		
		if (this.subscribtionStatus) {
		    this.log("Unsubscribing profile notifications")
		    this.subscribtionStatus.cancel();
		    this.subscribtionStatus = null;
		}
	}
}

// Mojo service wrapper function
BTProfileTrigger.prototype.btMojoService = function(url, params, cb) {
    this.serviceCalls[url] = new Mojo.Service.Request(url, {
        onSuccess: cb,
        onFailure: cb,
        parameters: params,
    });
    return this.serviceCalls[url];
}

BTProfileTrigger.prototype.handleMonitorNotifications = function(payload) {
	//Bluetooth radio state notification handler.
	
	this.log("handleMonitorNotifications.");
	this.log("handleMonitorNotifications: continuing with valid payload.", Object.toJSON(payload));
	
	if(!payload){return};
	
	//Samples:
	//{"returnValue": true, "subscribed": true, "radio": "on"}
	//{"notification": "notifnradiooff", "error": 0}
	
	if(payload.notification){
	    this.log("payload.notification:",payload.notification)
	    if(payload.notification == "notifnradioon"){
		    this.log("Bluetooth radio is on. Requesting subscription for profile notifications.");
		    this.subscribeStatus("register");
		    return;
	    
	    /*
	     Check for bluetooth switch off when connected to selected profile.
	     When connected to a profile and the bluetooth radio is switched off
	     we do not recieve the diconnect message.
	    */
	    }else if(this.profileconnected && payload.notification == "notifnradioturningoff"){
		    
		    this.profileconnected = false;
		    
		    this.service.request("palm://com.palm.applicationManager", {'method': "launch", 
			    'parameters': {'id': this.appid, 'params': {
				    'action': "trigger", 'event': this.triggertype, 'data': this.profile}}
		    });
		    
		    return;
	    }
	}
	this.log("Canceling subscription for profile notifications.");
	this.subscribeStatus("");
}

BTProfileTrigger.prototype.handleStatus = function(payload) {
	
	//Handle bluetooth profile notifications.
	
	//Samples:
	//
	// {"returnValue": true, "subscribed": true}
	// {"notification": "notifnconnected", "profile": "hfg", "address": "40:2b:a1:5d:e9:82", "name": "Headset", "error": 0}
	// {"notification": "notifnconnected", "profile": "a2dp", "address": "40:2b:a1:5d:e9:82", "name": "Headset", "error": 0}
	// {"notification": "notifndisconnected", "profile": "a2dp", "address": "40:2b:a1:5d:e9:82", "name": "Headset", "error": 0}
	// {"notification": "notifndisconnected", "profile": "hfg", "address": "40:2b:a1:5d:e9:82", "name": "Headset", "error": 0}
	//
	
	this.log("handleStatus: payload:", Object.toJSON(payload));
	
	if(!payload){return};
	if(payload.returnValue){return};
	
	if(payload.profile){
		
		var profile = payload.profile;
		var connected = payload.notification == "notifnconnected";
		var disconnected = payload.notification == "notifndisconnected";
		var activatetrigger = connected == true || disconnected == true;
		
		this.log("handleStatus: config:", Object.toJSON(this.config))
		this.log("handleStatus: profile:" + profile,"handleStatus: connected:" + connected,"handleStatus: disconnected:" + disconnected,"handleStatus: activatetrigger:" + activatetrigger);
		
		//Only act of connected or disconnected notifications.
		if(connected || disconnected){
			
			this.profile = profile;
			this.profileconnected = connected;
			
			this.log("connected || disconnected");
			
			//Store profile state
			if(connected){
				this.profilestate = 1;
			}else{
				//Disconnected
				this.profilestate = 0;
			}
			this.log("this.profilestate:",this.profilestate);
			this.log("Sending trigger notification...")
			this.service.request("palm://com.palm.applicationManager", {'method': "launch", 
				'parameters': {'id': this.appid, 'params': {
					'action': "trigger", 'event': this.triggertype, 'data': this.profile}} });
		}
		
		return;
	}
	this.log("No action taken for status notification.");
}

BTProfileTrigger.prototype.log = function(param, param2, param3, param4) {
	Mojo.Log.error("BTProfileTrigger DEBUG:", param, param2, param3, param4);
}
