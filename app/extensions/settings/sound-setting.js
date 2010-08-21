function SoundSetting(Control) {
	this.service = Control.service;
}

//

SoundSetting.prototype.init = function(callback) {
	callback(true);
}

SoundSetting.prototype.shutdown = function() {
}

//

SoundSetting.prototype.get = function(callback) {
	var settings = {};
	
	this.getSystemSettings(0, settings, callback);
}

SoundSetting.prototype.set = function(settings, callback) {
	this.setSystemSettings(0, settings, callback);
}

//

SoundSetting.prototype.getSystemSettings = function(request, settings, callback) {
	var completeCallback = this.handleGetResponse.bind(this, request, settings, callback);
	
	if(request == 0) {
		this.service.request("palm://com.palm.audio/ringtone/", {'method': "getVolume",
			'parameters': {}, 'onComplete': completeCallback}); 
	}
	else if(request == 1) {
		this.service.request("palm://com.palm.audio/system/", {'method': "status",
			'parameters': {}, 'onComplete': completeCallback}); 
	}
	else if(request == 2) {
		this.service.request("palm://com.palm.audio/media/", {'method': "status",
			'parameters': {}, 'onComplete': completeCallback }); 
	}
	else
		callback(settings);
}

SoundSetting.prototype.handleGetResponse = function(request, settings, callback, response) {
	if(response.returnValue) {
		if(request == 0) {
			settings.soundRingerVolume = response.volume;
		}
		else if(request == 1) {
			settings.soundSystemVolume = response.volume;
		}
		else if(request == 2) {
			settings.soundMediaVolume = response.volume;
		}
	}
	
	this.getSystemSettings(++request, settings, callback);
}

//

SoundSetting.prototype.setSystemSettings = function(request, settings, callback) {
	var completeCallback = this.handleSetResponse.bind(this, request, settings, callback);
	
	if(request == 0) {
		if(settings.soundRingerVolume == undefined)
			this.setSystemSettings(++request, settings, callback);
		else {
			this.service.request("palm://com.palm.audio/ringtone/", {'method': "setVolume",
				'parameters': {'volume': settings.soundRingerVolume}, 
				'onComplete': completeCallback});
		}
	}
	else if(request == 1) {
		if(settings.soundSystemVolume == undefined)
			this.setSystemSettings(++request, settings, callback);
		else {
			this.service.request("palm://com.palm.audio/system/", {'method': "setVolume",
				'parameters': {'volume': settings.soundSystemVolume}, 
				'onComplete': completeCallback});
		}
	}
	else if(request == 2) {
		if(settings.soundMediaVolume == undefined)
			this.setSystemSettings(++request, settings, callback);
		else {
			this.service.request("palm://com.palm.audio/media/", {'method': "setVolume",
				'parameters': {'scenario': "media_back_speaker", 
					'volume': settings.soundMediaVolume},
				'onComplete': completeCallback });
		}
	}
	else
		callback();
}

SoundSetting.prototype.handleSetResponse = function(request, settings, callback, response) {
	this.setSystemSettings(++request, settings, callback);
}	

