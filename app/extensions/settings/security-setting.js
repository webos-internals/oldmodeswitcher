function SecuritySetting(Control) {
	this.service = Control.service;
}

//

SecuritySetting.prototype.init = function(doneCallback) {
	doneCallback(true);
}

SecuritySetting.prototype.shutdown = function() {
}

//

SecuritySetting.prototype.get = function(doneCallback) {
	var systemSettings = {};
	
	this.getSystemSettings(0, systemSettings, doneCallback);
}

SecuritySetting.prototype.set = function(systemSettings, doneCallback) {
	this.setSystemSettings(0, systemSettings, doneCallback);
}

//

SecuritySetting.prototype.getSystemSettings = function(requestID, systemSettings, doneCallback) {
	var requestCallback = this.handleGetResponse.bind(this, requestID, systemSettings, doneCallback);
	
	if(requestID == 0) {
		this.service.request("palm://com.palm.systemmanager/", {'method': "getDeviceLockMode", 
			'parameters': {}, 'onComplete': requestCallback});
	}
	else
		doneCallback(systemSettings);
}

SecuritySetting.prototype.handleGetResponse = function(requestID, systemSettings, doneCallback, serviceResponse) {
	if(serviceResponse.returnValue) {
		if(requestID == 0) {
			if(serviceResponse.lockMode == "pin")
				systemSettings.securityLock = 1;
			else if(serviceResponse.lockMode == "password")
				systemSettings.securityLock = 2;
			else
				systemSettings.securityLock = 0;
				
			systemSettings.securitySecret = "";
		}
	}
			
	this.getSystemSettings(++requestID, systemSettings, doneCallback);
}

//

SecuritySetting.prototype.setSystemSettings = function(requestID, systemSettings, doneCallback) {
	var requestCallback = this.handleSetResponse.bind(this, requestID, systemSettings, doneCallback);
	
	if(requestID == 0) {
		if((systemSettings.securityLock == undefined) || 
			((systemSettings.securityLock != 0) && (systemSettings.securitySecret == undefined)))
		{
			this.setSystemSettings(++requestID, systemSettings, doneCallback);
		}
		else {
			if(systemSettings.securityLock == 1)
				var params = {'passCode': systemSettings.securitySecret, 'lockMode': "pin"}
			else if(systemSettings.securityLock == 2)
				var params = {'passCode': systemSettings.securitySecret, 'lockMode': "password"}
			else
				var params = {'lockMode': "none"};
			
			this.service.request("palm://com.palm.systemmanager/", {'method': "setDevicePasscode", 
				'parameters': params, 'onComplete': requestCallback});
		}
	}
	else
		doneCallback();
}

SecuritySetting.prototype.handleSetResponse = function(requestID, systemSettings, doneCallback, serviceResponse) {
	this.setSystemSettings(++requestID, systemSettings, doneCallback);
}	

