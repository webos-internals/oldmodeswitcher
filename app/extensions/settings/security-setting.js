function SecuritySetting(Control) {
	this.service = Control.service;
}

//

SecuritySetting.prototype.init = function(callback) {
	callback(true);
}

SecuritySetting.prototype.shutdown = function() {
}

//

SecuritySetting.prototype.get = function(callback) {
	var settings = {};
	
	this.getSystemSettings(0, settings, callback);
}

SecuritySetting.prototype.set = function(settings, callback) {
	this.setSystemSettings(0, settings, callback);
}

//

SecuritySetting.prototype.getSystemSettings = function(request, settings, callback) {
	var completeCallback = this.handleGetResponse.bind(this, request, settings, callback);
	
	if(request == 0) {
		this.service.request("palm://com.palm.systemmanager/", {'method': "getDeviceLockMode", 
			'parameters': {}, 'onComplete': completeCallback});
	}
	else
		callback(settings);
}

SecuritySetting.prototype.handleGetResponse = function(request, settings, callback, response) {
	if(response.returnValue) {
		if(request == 0) {
			if(response.lockMode == "pin")
				settings.securityLock = 1;
			else if(response.lockMode == "password")
				settings.securityLock = 2;
			else
				settings.securityLock = 0;
				
			settings.securitySecret = "";
		}
	}
			
	this.getSystemSettings(++request, settings, callback);
}

//

SecuritySetting.prototype.setSystemSettings = function(request, settings, callback) {
	var completeCallback = this.handleSetResponse.bind(this, request, settings, callback);
	
	if(request == 0) {
		if((settings.securityLock == undefined) || 
			((settings.securityLock != 0) && (settings.securitySecret == undefined)))
		{
			this.setSystemSettings(++request, settings, callback);
		}
		else {
			if(settings.securityLock == 1)
				var params = {'passCode': settings.securitySecret, 'lockMode': "pin"}
			else if(settings.securityLock == 2)
				var params = {'passCode': settings.securitySecret, 'lockMode': "password"}
			else
				var params = {'lockMode': "none"};
			
			this.service.request("palm://com.palm.systemmanager/", {'method': "setDevicePasscode", 
				'parameters': params, 'onComplete': completeCallback});
		}
	}
	else
		callback();
}

SecuritySetting.prototype.handleSetResponse = function(request, settings, callback, response) {
	this.setSystemSettings(++request, settings, callback);
}	

