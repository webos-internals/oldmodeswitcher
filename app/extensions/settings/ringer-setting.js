function RingerSetting(Control) {
	this.service = Control.service;
}

//

RingerSetting.prototype.init = function(doneCallback) {
	doneCallback(true);
}

RingerSetting.prototype.shutdown = function() {
}

//

RingerSetting.prototype.get = function(doneCallback) {
	var systemSettings = {};
	
	this.getSystemSettings(0, systemSettings, doneCallback);
}

RingerSetting.prototype.set = function(systemSettings, doneCallback) {
	this.setSystemSettings(0, systemSettings, doneCallback);
}

//

RingerSetting.prototype.getSystemSettings = function(requestID, systemSettings, doneCallback) {
	var requestCallback = this.handleGetResponse.bind(this, requestID, systemSettings, doneCallback);
	
	if(requestID == 0) {
		this.service.request("palm://com.palm.audio/vibrate/", {'method': "get",
			'parameters': {}, 'onComplete': requestCallback});
	}
	else if(requestID == 1) {
		this.service.request("palm://com.palm.systemservice/", {'method': "getPreferences", 
			'parameters': {'subscribe': false, 'keys': ["ringtone"]}, 
			'onComplete': requestCallback });
	}
	else
		doneCallback(systemSettings);
}

RingerSetting.prototype.handleGetResponse = function(requestID, systemSettings, doneCallback, serviceResponse) {
	if(serviceResponse.returnValue) {
		if(requestID == 0) {
			if(serviceResponse.VibrateWhenRingerOn == false)
				systemSettings.ringerRingerOn = 0;
			else
				systemSettings.ringerRingerOn = 1;

			if(serviceResponse.VibrateWhenRingerOff == false)
				systemSettings.ringerRingerOff = 0;
			else
				systemSettings.ringerRingerOff = 1;
		}
		else if(requestID == 1) {
			systemSettings.ringerRingtone = {
				'name': serviceResponse.ringtone.name,
				'path': serviceResponse.ringtone.fullPath };
		}
	}

	this.getSystemSettings(++requestID, systemSettings, doneCallback);
}

//

RingerSetting.prototype.setSystemSettings = function(requestID, systemSettings, doneCallback) {
	var requestCallback = this.handleSetResponse.bind(this, requestID, systemSettings, doneCallback);
	
	if(requestID == 0) {
		if((systemSettings.ringerRingerOn == undefined) && (systemSettings.ringerRingerOff == undefined))
			this.setSystemSettings(++requestID, systemSettings, doneCallback);
		else {
			var params = {};

			if(systemSettings.ringerRingerOn != undefined) {
				if(systemSettings.ringerRingerOn == 1)
					params.VibrateWhenRingerOn = true;
				else
					params.VibrateWhenRingerOn  = false;
			}
			
			if(systemSettings.ringerRingerOff != undefined) {			
				if(systemSettings.ringerRingerOff == 1)
					params.VibrateWhenRingerOff = true;
				else
					params.VibrateWhenRingerOff = false;
			}
			
			this.service.request("palm://com.palm.audio/vibrate/", {'method': "set", 
				'parameters': params, 'onComplete': requestCallback});
		}
	}
	else if(requestID == 1) {
		if(systemSettings.ringerRingtone == undefined)
			this.setSystemSettings(++requestID, systemSettings, doneCallback);
		else {
			var ringtone = {
				'name': systemSettings.ringerRingtone.name,
				'fullPath': systemSettings.ringerRingtone.path };
			
			this.service.request("palm://com.palm.systemservice/", {'method': "setPreferences", 
				'parameters': {'ringtone': ringtone}, 'onComplete': requestCallback});
		}
	}
	else
		doneCallback();
}

RingerSetting.prototype.handleSetResponse = function(requestID, systemSettings, doneCallback, serviceResponse) {
	this.setSystemSettings(++requestID, systemSettings, doneCallback);
}	

