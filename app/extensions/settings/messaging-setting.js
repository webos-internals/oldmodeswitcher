function MessagingSetting(ServiceRequestWrapper) {
	this.service = ServiceRequestWrapper;
}

//

MessagingSetting.prototype.get = function(callback) {
	var settings = {};
	
	this.getSystemSettings(0, settings, callback);
}

MessagingSetting.prototype.set = function(settings, callback) {
	this.setSystemSettings(0, settings, callback);
}

//

MessagingSetting.prototype.getSystemSettings = function(request, settings, callback) {
	var completeCallback = this.handleGetResponse.bind(this, request, settings, callback);
	
	if(request == 0) {
		this.service.request("palm://com.palm.messaging/", {'method': "getAllMessagingPreferences", 
			'parameters': {'subscribe':false}, 'onComplete': completeCallback});
	}
	else if(request == 1) {
		this.service.request('palm://com.palm.messaging/', { 'method': "getAccountList",
			'parameters': {'subscribe': false}, 'onComplete': completeCallback });
	}
	else
		callback(settings);
}

MessagingSetting.prototype.handleGetResponse = function(request, settings, callback, response) {
	if(response.returnValue) {
		if(request == 0) {
			settings.messagingAlert = response.messagingPrefs.enableNotificationSound;
		
			if((response.messagingPrefs.notificationRingtoneName != undefined) && 
				(response.messagingPrefs.notificationRingtoneName.length != 0))
			{
				settings.messagingRingtone = {
					'name': response.messagingPrefs.notificationRingtoneName,
					'path': response.messagingPrefs.notificationRingtonePath };
			}
		}
		else if(request == 1) {
			if(response.list.length > 0) {
				settings.messagingIMStatus = response.list[0].availability;
			}
		}
	}

	this.getSystemSettings(++request, settings, callback);
}

//

MessagingSetting.prototype.setSystemSettings = function(request, settings, callback) {
	var completeCallback = this.handleSetResponse.bind(this, request, settings, callback);
	
	if(request == 1) {
		if((settings.messagingAlert == undefined) && (settings.messagingRingtone == undefined))
			this.setSystemSettings(++request, settings, callback);		
		else {
			var params = {};
			
			if(settings.messagingAlert != undefined)
				params.isEnabledNotificationSound = settings.messagingAlert;
			
			if(settings.messagingRingtone != undefined) {
				params.ringtoneName = settings.messagingRingtone.name;
				params.ringtonePath = settings.messagingRingtone.path;
			}
		
			this.service.request("palm://com.palm.messaging/", {'method': "setNotificationPreferences", 
				'parameters': params, 'onComplete': completeCallback});
		}
	}
	else if(request == 0) {
		if(settings.messagingIMStatus == undefined)
			this.setSystemSettings(++request, settings, callback);		
		else {
			this.service.request("palm://com.palm.messaging/", {'method': "setMyAvailability", 
				'parameters': {'availability': settings.messagingIMStatus}, 
				'onComplete': completeCallback});
		}
	}
	else
		callback();
}

MessagingSetting.prototype.handleSetResponse = function(request, settings, callback, response) {
	this.setSystemSettings(++request, settings, callback);
}

