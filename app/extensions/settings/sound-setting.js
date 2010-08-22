function SoundSetting(Control) {
	this.service = Control.service;
}

//

SoundSetting.prototype.init = function(doneCallback) {
	doneCallback(true);
}

SoundSetting.prototype.shutdown = function() {
}

//

SoundSetting.prototype.get = function(doneCallback) {
	var systemSettings = {};
	
	this.getSystemSettings(0, systemSettings, doneCallback);
}

SoundSetting.prototype.set = function(systemSettings, doneCallback) {
	this.setSystemSettings(0, systemSettings, doneCallback);
}

//

SoundSetting.prototype.getSystemSettings = function(requestID, systemSettings, doneCallback) {
	var requestCallback = this.handleGetResponse.bind(this, requestID, systemSettings, doneCallback);
	
	if(requestID == 0) {
		this.service.request("palm://com.palm.audio/ringtone/", {'method': "getVolume",
			'parameters': {}, 'onComplete': requestCallback}); 
	}
	else if(requestID == 1) {
		this.service.request("palm://com.palm.audio/system/", {'method': "status",
			'parameters': {}, 'onComplete': requestCallback}); 
	}
	else if(requestID == 2) {
		this.service.request("palm://com.palm.audio/media/", {'method': "status",
			'parameters': {}, 'onComplete': requestCallback }); 
	}
	else
		doneCallback(systemSettings);
}

SoundSetting.prototype.handleGetResponse = function(requestID, systemSettings, doneCallback, serviceResponse) {
	if(serviceResponse.returnValue) {
		if(requestID == 0) {
			systemSettings.soundRingerVolume = serviceResponse.volume;
		}
		else if(requestID == 1) {
			systemSettings.soundSystemVolume = serviceResponse.volume;
		}
		else if(requestID == 2) {
			systemSettings.soundMediaVolume = serviceResponse.volume;
		}
	}
	
	this.getSystemSettings(++requestID, systemSettings, doneCallback);
}

//

SoundSetting.prototype.setSystemSettings = function(requestID, systemSettings, doneCallback) {
	var requestCallback = this.handleSetResponse.bind(this, requestID, systemSettings, doneCallback);
	
	if(requestID == 0) {
		if(systemSettings.soundRingerVolume == undefined)
			this.setSystemSettings(++requestID, systemSettings, doneCallback);
		else {
			this.service.request("palm://com.palm.audio/ringtone/", {'method': "setVolume",
				'parameters': {'volume': systemSettings.soundRingerVolume}, 
				'onComplete': requestCallback});
		}
	}
	else if(requestID == 1) {
		if(systemSettings.soundSystemVolume == undefined)
			this.setSystemSettings(++requestID, systemSettings, doneCallback);
		else {
			this.service.request("palm://com.palm.audio/system/", {'method': "setVolume",
				'parameters': {'volume': systemSettings.soundSystemVolume}, 
				'onComplete': requestCallback});
		}
	}
	else if(requestID == 2) {
		if(systemSettings.soundMediaVolume == undefined)
			this.setSystemSettings(++requestID, systemSettings, doneCallback);
		else {
			this.service.request("palm://com.palm.audio/media/", {'method': "setVolume",
				'parameters': {'scenario': "media_back_speaker", 
					'volume': systemSettings.soundMediaVolume},
				'onComplete': requestCallback });
		}
	}
	else
		doneCallback();
}

SoundSetting.prototype.handleSetResponse = function(requestID, systemSettings, doneCallback, serviceResponse) {
	this.setSystemSettings(++requestID, systemSettings, doneCallback);
}	

