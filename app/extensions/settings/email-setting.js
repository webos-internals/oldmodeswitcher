function EmailSetting(ServiceRequestWrapper) {
	this.service = ServiceRequestWrapper;
}

//

EmailSetting.prototype.init = function(callback) {
	callback(true);
}

EmailSetting.prototype.shutdown = function() {
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

EmailSetting.prototype.getSystemSettings = function(request, settings, callback, data, index) {
	var completeCallback = this.handleGetResponse.bind(this, request, settings, callback, data, index);
	
	if(request == 0) {
		this.service.request("palm://com.palm.mail/", {'method': "accountList",
			'parameters': {'subscribe': false}, 'onComplete': completeCallback} );
	}
	else if((request == 1) && (data != undefined) && (index < data.length)) {
		this.service.request("palm://com.palm.mail/", {'method': "accountPreferences",
			'parameters': {'subscribe': false, 'account': data[index].id}, 
			'onComplete': completeCallback} );
	}
	else
		callback(settings);
}

EmailSetting.prototype.handleGetResponse = function(request, settings, callback, data, index, response) {
	if(response.returnValue) {
		if(request == 0) {
			if(response.list.length > 0) {
				settings.emailAlertCfg = [];
				settings.emailRingtoneCfg = [];
				settings.emailSyncCfg = [];
			}

			this.getSystemSettings(++request, settings, callback, response.list, 0);
		}
		else if(request == 1) {
			if(data.length > 1) {
				settings.emailAlertCfg.push({
					'accountId': response.id, 
					'emailAlert': response.playSound });

				if((response.ringtoneName != undefined) &&
					(response.ringtoneName.length != 0))				
				{
					var ringtone = {
						'name': response.ringtoneName,
						'path': response.ringtonePath };
				
					settings.emailRingtoneCfg.push({
						'accountId': response.id,
						'emailRingtone': ringtone });
				}
				
				settings.emailSyncCfg.push({
					'accountId': response.id,
					'emailSync': response.syncFrequencyMins });

				this.getSystemSettings(request, settings, callback, data, ++index);
			}
			else {
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
	}
	else
		this.getSystemSettings(++request, settings, callback);
}

//

EmailSetting.prototype.setSystemSettings = function(request, settings, callback, data, index) {
	var completeCallback = this.handleSetResponse.bind(this, request, settings, callback, data, index);
	
	if(request == 0) {
		if((settings.emailAlarm == undefined) && (settings.emailSync == undefined) &&
			(settings.emailRingtone == undefined) && (settings.emailAlarmCfg == undefined) && 
			(settings.emailSyncCfg == undefined) && (settings.emailRingtoneCfg == undefined))
		{
			this.setSystemSettings(++request, settings, callback);
		}
		else {
			this.service.request("palm://com.palm.mail/", {'method': "accountList",
				'parameters': {'subscribe': false}, 'onComplete': completeCallback});
		}
	}
	else if((request == 1) && (data != undefined) && (index < data.length)) {
		var params = {'account': data[index].id};
	
		if(settings.emailAlert != undefined)
			params.playSound = settings.emailAlert;
			
		if(settings.emailAlertCfg != undefined) {
			for(var i = 0; i < settings.emailAlertCfg.length; i++) {
				if(settings.emailAlertCfg[i].accountId == data[index].id) {
					params.playSound = settings.emailAlertCfg[i].emailAlert;
					break;
				}				
			}
		}

		if(settings.emailRingtone != undefined) {
			params.ringtoneName = settings.emailRingtone.name;
			params.ringtonePath = settings.emailRingtone.path;
		}
		
		if(settings.emailRingtoneCfg != undefined) {
			for(var i = 0; i < settings.emailRingtoneCfg.length; i++) {
				if(settings.emailRingtoneCfg[i].accountId == data[index].id) {
					params.ringtoneName = settings.emailRingtoneCfg[i].emailRingtone.name;
					params.ringtonePath = settings.emailRingtoneCfg[i].emailRingtone.path;
					break;
				}				
			}
		}
		
		if(settings.emailSync != undefined)
			params.syncFrequencyMins = settings.emailSync;
		
		if(settings.emailSyncCfg != undefined) {
			for(var i = 0; i < settings.emailSyncCfg.length; i++) {
				if(settings.emailSyncCfg[i].accountId == data[index].id) {
					params.syncFrequencyMins = settings.emailSyncCfg[i].emailSync;
					break;
				}				
			}
		}

		this.service.request("palm://com.palm.mail/", {'method': "setAccountPreferences",
			'parameters': params, 'onComplete': completeCallback});
	}
	else
		callback();
}

EmailSetting.prototype.handleSetResponse = function(request, settings, callback, data, index, response) {
	if(request == 0)
		this.setSystemSettings(++request, settings, callback, response.list, 0);
	else if(request == 1)
		this.setSystemSettings(request, settings, callback, data, ++index);
}

