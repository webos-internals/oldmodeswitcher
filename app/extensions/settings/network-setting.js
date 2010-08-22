function NetworkSetting(Control) {
	this.service = Control.service;
}

//

NetworkSetting.prototype.init = function(doneCallback) {
	doneCallback(true);
}

NetworkSetting.prototype.shutdown = function() {
}

//

NetworkSetting.prototype.get = function(doneCallback) {
	var systemSettings = {};
	
	this.getSystemSettings(0, systemSettings, doneCallback);
}

NetworkSetting.prototype.set = function(systemSettings, doneCallback) {
	var currentSettings = {};
	
	var applyCallback = this.apply.bind(this, currentSettings, systemSettings, doneCallback);
	
	this.getSystemSettings(0, currentSettings, applyCallback);
}

//

NetworkSetting.prototype.apply = function(currentSettings, requestedSettings, doneCallback) {
	var systemSettings = {};

	if((requestedSettings.networkType != undefined) && (currentSettings.networkType != requestedSettings.networkType))
		systemSettings.networkType = requestedSettings.networkType;
		
	if((requestedSettings.networkData != undefined) && (currentSettings.networkData != requestedSettings.networkData))
		systemSettings.networkData = requestedSettings.networkData;

	if((requestedSettings.networkVoice != undefined) && (currentSettings.networkVoice != requestedSettings.networkVoice))
		systemSettings.networkVoice = requestedSettings.networkVoice;

	this.setSystemSettings(0, systemSettings, doneCallback);
}

//

NetworkSetting.prototype.getSystemSettings = function(requestID, systemSettings, doneCallback) {
	var requestCallback = this.handleGetResponse.bind(this, requestID, systemSettings, doneCallback);
	
	if(requestID == 0) {
		this.service.request("palm://com.palm.telephony/", {'method': "ratQuery",
			'parameters': {'subscribe': false}, 'onComplete': requestCallback});
	}
	else if(requestID == 1) {
		this.service.request("palm://com.palm.preferences/appProperties/", {'method': "Get", 
			'parameters': {'appId': "com.palm.wan", 'key': "roamguard"}, 
			'onComplete': requestCallback});
	}
	else if(requestID == 2) {
		this.service.request("palm://com.palm.telephony/", {'method': "roamModeQuery", 
			'parameters': {'subscribe': false}, 'onComplete': requestCallback});
	}
	else
		doneCallback(systemSettings);
}

NetworkSetting.prototype.handleGetResponse = function(requestID, systemSettings, doneCallback, serviceResponse) {
	if(serviceResponse.returnValue) {
		if(requestID == 0) {
			if(serviceResponse.extended.mode == "automatic")
				systemSettings.networkType = 1;
			else if(serviceResponse.extended.mode == "gsm")
				systemSettings.networkType = 2;
			else
				systemSettings.networkType = 3;
		}
		else if(requestID == 1) {
			if(serviceResponse.roamguard.roamguard == "neverblock")
				systemSettings.networkData = 1;
			else
				systemSettings.networkData = 2;
		}
		else if(requestID == 2) {
			if(serviceResponse.extended) {
				if(serviceResponse.extended.mode == "homeonly")
					systemSettings.networkVoice = 2;
				else if(serviceResponse.extended.mode == "roamonly")
					systemSettings.networkVoice = 3;
				else
					systemSettings.networkVoice = 1;
			}
		}		
	}

	this.getSystemSettings(++requestID, systemSettings, doneCallback);
}

//

NetworkSetting.prototype.setSystemSettings = function(requestID, systemSettings, doneCallback) {
	var requestCallback = this.handleSetResponse.bind(this, requestID, systemSettings, doneCallback);
	
	if(requestID == 0) {
		if(systemSettings.networkType == undefined)
			this.setSystemSettings(++requestID, systemSettings, doneCallback);
		else {		
			if(systemSettings.networkType == 2)
				var mode = "gsm";
			else if(systemSettings.networkType == 3)
				var mode = "umts";
			else 
				var mode = "automatic";
	
			this.service.request("palm://com.palm.telephony/", {'method': "ratSet", 
				'parameters': {'mode': mode}, 'onComplete': requestCallback});
		}
	}
	else if(requestID == 1) {
		if(systemSettings.networkData == undefined)
			this.setSystemSettings(++requestID, systemSettings, doneCallback);
		else {	
			if(systemSettings.networkData == 1)
				var roamguard = "disable";
			else
				var roamguard = "enable";
	
			this.service.request("palm://com.palm.wan/", {'method': "set", 
				'parameters': {'roamguard': roamguard}, 
				'onComplete': requestCallback });
		}
	}
	else if(requestID == 2) {
		if(systemSettings.networkVoice == undefined)
			this.setSystemSettings(++requestID, systemSettings, doneCallback);
		else {
			if(systemSettings.networkVoice == 2)
				var roammode = "homeonly";
			else if(systemSettings.networkVoice == 3)
				var roammode = "roamonly";
			else
				var roammode = "any";
			
			this.service.request("palm://com.palm.telephony/", {'method': "roamModeSet", 
				'parameters': {'mode': roammode,	'client': Mojo.appName},
				'onComplete': requestCallback});
		}
	}
	else
		doneCallback();
}

NetworkSetting.prototype.handleSetResponse = function(requestID, systemSettings, doneCallback, serviceResponse) {
	this.setSystemSettings(++requestID, systemSettings, doneCallback);
}	

