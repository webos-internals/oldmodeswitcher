function EmailSetting(ServiceRequestWrapper) {
	this.service = ServiceRequestWrapper;
}

//

EmailSetting.prototype.get = function(callback) {
	var settings = {};
	
	this.getSystemSettings(0, settings, callback);
}

EmailSetting.prototype.set = function(settings, callback) {
	this.setSystemSettings(0, settings, callback);
}

//

EmailSetting.prototype.getSystemSettings = function(request, settings, callback, data) {
	var completeCallback = this.handleGetResponse.bind(this, request, settings, callback);
	
	if(request == 0) {
		this.service.request("palm://com.palm.mail/", {'method': "accountList",
			'parameters': {'subscribe': false}, 'onComplete': completeCallback} );
	}
	else if((request == 1) && (data != undefined) && (data.length > 0)) {
		this.service.request("palm://com.palm.mail/", {'method': "accountPreferences",
			'parameters': {'subscribe': false, 'account': data[0].id}, 
			'onComplete': completeCallback} );
	}
	else
		callback(settings);
}

EmailSetting.prototype.handleGetResponse = function(request, settings, callback, response) {
	if(response.returnValue) {
		if(request == 0) {
			this.getSystemSettings(++request, settings, callback, response.list);
		}
		else if(request == 1) {
			settings.emailAlert = response.playSound;

			if((response.ringtoneName != undefined) && 
				(response.ringtoneName.length != 0))
			{
				settings.emailRingtone = {
					'name': response.ringtoneName,
					'path': response.ringtonePath };
			}
			
			settings.emailSync = response.syncFrequencyMins;

			this.getSystemSettings(++request, settings, callback);
		}
	}
	else
		this.getSystemSettings(++request, settings, callback);
}

//

EmailSetting.prototype.setSystemSettings = function(request, settings, callback, data) {
	var completeCallback = this.handleSetResponse.bind(this, request, settings, callback);
	
	if(request == 0) {
		if((settings.emailAlarm == undefined) && (settings.emailSync == undefined) &&
			(settings.emailRingtone == undefined))
		{
			this.setSystemSettings(++request, settings, callback);
		}
		else {
			this.service.request("palm://com.palm.mail/", {'method': "accountList",
				'parameters': {'subscribe': false}, 'onComplete': completeCallback});
		}
	}
	else if((request == 1) && (data != undefined) && (data.length > 0)) {
		var params = {'account': data[0].id};
		
		if(settings.emailAlert != undefined)
			params.playSound = settings.emailAlert;

		if(settings.emailRingtone != undefined) {
			params.ringtoneName = settings.emailRingtone.name;
			params.ringtonePath = settings.emailRingtone.path;
		}

		if(settings.emailSync != undefined)
			params.syncFrequencyMins = settings.emailSync;
		
		this.service.request("palm://com.palm.mail/", {'method': "setAccountPreferences",
			'parameters': params, 'onComplete': completeCallback});
	}
	else
		callback();
}

EmailSetting.prototype.handleSetResponse = function(request, settings, callback, response) {
	if(request == 0)
		this.setSystemSettings(++request, settings, callback, response.list);
	else
		this.setSystemSettings(++request, settings, callback);
}

