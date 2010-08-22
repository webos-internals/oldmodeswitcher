function EmailSetting(Control) {
	this.service = Control.service;
}

//

EmailSetting.prototype.init = function(doneCallback) {
	doneCallback(true);
}

EmailSetting.prototype.shutdown = function() {
}

//

EmailSetting.prototype.get = function(doneCallback) {
	var systemSettings = {};
	
	this.getSystemSettings(0, systemSettings, doneCallback);
}

EmailSetting.prototype.set = function(systemSettings, doneCallback) {
	this.setSystemSettings(0, systemSettings, doneCallback);
}

//

EmailSetting.prototype.getSystemSettings = function(requestID, systemSettings, doneCallback, requestData, index) {
	var requestCallback = this.handleGetResponse.bind(this, requestID, systemSettings, doneCallback, requestData, index);
	
	if(requestID == 0) {
		this.service.request("palm://com.palm.mail/", {'method': "accountList",
			'parameters': {'subscribe': false}, 'onComplete': requestCallback} );
	}
	else if((requestID == 1) && (requestData != undefined) && (index < requestData.length)) {
		this.service.request("palm://com.palm.mail/", {'method': "accountPreferences",
			'parameters': {'subscribe': false, 'account': requestData[index].id}, 
			'onComplete': requestCallback} );
	}
	else
		doneCallback(systemSettings);
}

EmailSetting.prototype.handleGetResponse = function(requestID, systemSettings, doneCallback, requestData, index, serviceResponse) {
	if(serviceResponse.returnValue) {
		if(requestID == 0) {
			if(serviceResponse.list.length > 0) {
				systemSettings.emailAlertCfg = [];
				systemSettings.emailRingtoneCfg = [];
				systemSettings.emailSyncCfg = [];
			}

			this.getSystemSettings(++requestID, systemSettings, doneCallback, serviceResponse.list, 0);
		}
		else if(requestID == 1) {
			if(requestData.length > 1) {
				systemSettings.emailAlertCfg.push({
					'accountId': serviceResponse.id, 
					'emailAlert': serviceResponse.playSound });

				if((serviceResponse.ringtoneName != undefined) &&
					(serviceResponse.ringtoneName.length != 0))				
				{
					var ringtone = {
						'name': serviceResponse.ringtoneName,
						'path': serviceResponse.ringtonePath };
				
					systemSettings.emailRingtoneCfg.push({
						'accountId': serviceResponse.id,
						'emailRingtone': ringtone });
				}
				
				systemSettings.emailSyncCfg.push({
					'accountId': serviceResponse.id,
					'emailSync': serviceResponse.syncFrequencyMins });

				this.getSystemSettings(requestID, systemSettings, doneCallback, requestData, ++index);
			}
			else {
				systemSettings.emailAlert = serviceResponse.playSound;

				if((serviceResponse.ringtoneName != undefined) && 
					(serviceResponse.ringtoneName.length != 0))
				{
					systemSettings.emailRingtone = {
						'name': serviceResponse.ringtoneName,
						'path': serviceResponse.ringtonePath };
				}
			
				systemSettings.emailSync = serviceResponse.syncFrequencyMins;

				this.getSystemSettings(++requestID, systemSettings, doneCallback);
			}
		}
	}
	else
		this.getSystemSettings(++requestID, systemSettings, doneCallback);
}

//

EmailSetting.prototype.setSystemSettings = function(requestID, systemSettings, doneCallback, requestData, index) {
	var requestCallback = this.handleSetResponse.bind(this, requestID, systemSettings, doneCallback, requestData, index);
	
	if(requestID == 0) {
		if((systemSettings.emailAlert == undefined) && (systemSettings.emailSync == undefined) &&
			(systemSettings.emailRingtone == undefined) && (systemSettings.emailAlertCfg == undefined) && 
			(systemSettings.emailSyncCfg == undefined) && (systemSettings.emailRingtoneCfg == undefined))
		{
			this.setSystemSettings(++requestID, systemSettings, doneCallback);
		}
		else {
			this.service.request("palm://com.palm.mail/", {'method': "accountList",
				'parameters': {'subscribe': false}, 'onComplete': requestCallback});
		}
	}
	else if((requestID == 1) && (requestData != undefined) && (index < requestData.length)) {
		var params = {'account': requestData[index].id};

		if(systemSettings.emailAlert != undefined)
			params.playSound = systemSettings.emailAlert;
			
		if(systemSettings.emailAlertCfg != undefined) {
			for(var i = 0; i < systemSettings.emailAlertCfg.length; i++) {
				if(systemSettings.emailAlertCfg[i].accountId == requestData[index].id) {
					params.playSound = systemSettings.emailAlertCfg[i].emailAlert;
					break;
				}				
			}
		}

		if(systemSettings.emailRingtone != undefined) {
			params.ringtoneName = systemSettings.emailRingtone.name;
			params.ringtonePath = systemSettings.emailRingtone.path;
		}
		
		if(systemSettings.emailRingtoneCfg != undefined) {
			for(var i = 0; i < systemSettings.emailRingtoneCfg.length; i++) {
				if(systemSettings.emailRingtoneCfg[i].accountId == requestData[index].id) {
					params.ringtoneName = systemSettings.emailRingtoneCfg[i].emailRingtone.name;
					params.ringtonePath = systemSettings.emailRingtoneCfg[i].emailRingtone.path;
					break;
				}				
			}
		}
		
		if(systemSettings.emailSync != undefined)
			params.syncFrequencyMins = systemSettings.emailSync;
		
		if(systemSettings.emailSyncCfg != undefined) {
			for(var i = 0; i < systemSettings.emailSyncCfg.length; i++) {
				if(systemSettings.emailSyncCfg[i].accountId == requestData[index].id) {
					params.syncFrequencyMins = systemSettings.emailSyncCfg[i].emailSync;
					break;
				}				
			}
		}

		this.service.request("palm://com.palm.mail/", {'method': "setAccountPreferences",
			'parameters': params, 'onComplete': requestCallback});
	}
	else
		doneCallback();
}

EmailSetting.prototype.handleSetResponse = function(requestID, systemSettings, doneCallback, requestData, index, serviceResponse) {
	if(requestID == 0)
		this.setSystemSettings(++requestID, systemSettings, doneCallback, serviceResponse.list, 0);
	else if(requestID == 1)
		this.setSystemSettings(requestID, systemSettings, doneCallback, requestData, ++index);
}

