function MessagingSetting(Control) {
	this.service = Control.service;
}

//

MessagingSetting.prototype.init = function(doneCallback) {
	doneCallback(true);
}

MessagingSetting.prototype.shutdown = function() {
}

//

MessagingSetting.prototype.get = function(doneCallback) {
	var systemSettings = {};
	
	this.getSystemSettings(0, systemSettings, doneCallback);
}

MessagingSetting.prototype.set = function(systemSettings, doneCallback) {
	var currentSettings = {};

	var applyCallback = this.apply.bind(this, currentSettings, systemSettings, doneCallback);
	
	this.getSystemSettings(0, currentSettings, applyCallback);
}

//

MessagingSetting.prototype.apply = function(currentSettings, requestedSettings, doneCallback) {
	this.setSystemSettings(0, currentSettings, requestedSettings, doneCallback);
}

//

MessagingSetting.prototype.getSystemSettings = function(requestID, systemSettings, doneCallback, requestData, index) {
	var requestCallback = this.handleGetResponse.bind(this, requestID, systemSettings, doneCallback, requestData, index);
	
	if(requestID == 0) {
		this.service.request("palm://com.palm.messaging/", {'method': "getAllMessagingPreferences", 
			'parameters': {'subscribe':false}, 'onComplete': requestCallback});
	}
	else if(requestID == 1) {
		this.service.request('palm://com.palm.messaging/', { 'method': "getAccountList",
			'parameters': {'subscribe': false}, 'onComplete': requestCallback });
	}
/*	else if((requestID == 2) && (requestData != undefined) && (index < requestData.length)) {
		this.service.request('palm://im.libpurpleext.greg/', {'method': "getMyAvailability", 
			'parameters': {'serviceName': requestData[index].domain, 'username': requestData[index].username}, 
			'onSuccess': requestCallback, 'onFailure': requestCallback});
	}*/
	else
		doneCallback(systemSettings);
}

MessagingSetting.prototype.handleGetResponse = function(requestID, systemSettings, doneCallback, requestData, index, response) {
	if(response.returnValue) { // || (requestID == 2))
		if(requestID == 0) {
			systemSettings.messagingAlert = response.messagingPrefs.enableNotificationSound;
		
			if((response.messagingPrefs.notificationRingtoneName != undefined) && 
				(response.messagingPrefs.notificationRingtoneName.length != 0))
			{
				systemSettings.messagingRingtone = {
					'name': response.messagingPrefs.notificationRingtoneName,
					'path': response.messagingPrefs.notificationRingtonePath };
			}

			this.getSystemSettings(++requestID, systemSettings, doneCallback);
		}
		else if(requestID == 1) {
//			if(response.list.length == 1) {
			if(response.list.length > 0) {
				systemSettings.messagingIMStatus = response.list[0].availability;
				
				this.getSystemSettings(++requestID, systemSettings, doneCallback);
			}
			else
				this.getSystemSettings(++requestID, systemSettings, doneCallback, response.list, 0);
		}
/*		else if(requestID == 2) {
			if(response.errorCode != undefined) {
				systemSettings.messagingIMStatus = requestData[0].availability;
			
				this.getSystemSettings(++requestID, systemSettings, doneCallback);
			}
			else {
				if(systemSettings.messagingIMStatusCfg == undefined)
					systemSettings.messagingIMStatusCfg = [];
			
				if(response.returnValue == false)
					var availability = 4;
				else if(response.status == 2)
					var availability = 0;
				else if(response.status == 5)
					var availability = 2;
				else
					var availability = 4;
				
				systemSettings.messagingIMStatusCfg.push({
					'accountId': requestData[index].id,
					'accountDomain': requestData[index].domain,
					'accountUsername': requestData[index].username,
					'messagingIMStatus': availability });

				this.getSystemSettings(requestID, systemSettings, doneCallback, requestData, ++index);
			}
		}*/
	}
	else
		this.getSystemSettings(++requestID, systemSettings, doneCallback);
}

//

MessagingSetting.prototype.setSystemSettings = function(requestID, currentSettings, systemSettings, doneCallback, index) {
	var requestCallback = this.handleSetResponse.bind(this, requestID, currentSettings, systemSettings, doneCallback, index);

	if(requestID == 0) {
		if((systemSettings.messagingAlert == undefined) && (systemSettings.messagingRingtone == undefined))
			this.setSystemSettings(++requestID, currentSettings, systemSettings, doneCallback);		
		else {
			var params = {};
			
			if(systemSettings.messagingAlert != undefined)
				params.isEnabledNotificationSound = systemSettings.messagingAlert;
			
			if(systemSettings.messagingRingtone != undefined) {
				params.ringtoneName = systemSettings.messagingRingtone.name;
				params.ringtonePath = systemSettings.messagingRingtone.path;
			}
		
			this.service.request("palm://com.palm.messaging/", {'method': "setNotificationPreferences", 
				'parameters': params, 'onComplete': requestCallback});
		}
	}
	else if(requestID == 1) {
		if((systemSettings.messagingIMStatus == undefined) || (systemSettings.messagingIMStatusCfg != undefined))
			this.setSystemSettings(++requestID, currentSettings, systemSettings, doneCallback, 0);		
		else {
			this.service.request("palm://com.palm.messaging/", {'method': "setMyAvailability", 
				'parameters': {'availability': systemSettings.messagingIMStatus}, 
				'onComplete': requestCallback});
		}
	}
/*	else if((requestID == 2) && (systemSettings.messagingIMStatusCfg) && 
		(index < systemSettings.messagingIMStatusCfg.length))
	{
		var availability = 4;
	
		if(systemSettings.messagingIMStatus != undefined)
			availability = systemSettings.messagingIMStatus;
				
		availability = systemSettings.messagingIMStatusCfg[index].messagingIMStatus;

		for(var i = 0; i < currentSettings.messagingIMStatusCfg.length; i++) {
			if(currentSettings.messagingIMStatusCfg[i].accountId == 
				systemSettings.messagingIMStatusCfg[index].accountId)
			{
				Mojo.Log.error("III " + currentSettings.messagingIMStatusCfg[i].messagingIMStatus + " " + availability);

				if(currentSettings.messagingIMStatusCfg[i].messagingIMStatus != availability) {
					if(currentSettings.messagingIMStatusCfg[i].messagingIMStatus == 4) {
						Mojo.Log.error("AAA LOGIN");

						this.service.request("palm://com.palm.messaging/", {'method': "updateAccountPassword", 
							'parameters': {'accountId': systemSettings.messagingIMStatusCfg[index].accountId, "password": "181180"}, 
							'onComplete': this.test.bind(this,requestCallback, systemSettings,index, availability)});
					}
					else {
						if(systemSettings.messagingIMStatusCfg[index].messagingIMStatus == 4) {
							Mojo.Log.error("AAA LOGOUT");

							this.service.request("palm://im.libpurpleext.greg/", {'method': "logout", 
								'parameters': {'accountId': systemSettings.messagingIMStatusCfg[index].accountId}, 
								'onComplete': requestCallback});
						}
						else {
							Mojo.Log.error("AAA UPDATE " + systemSettings.messagingIMStatusCfg[index].messagingIMStatus);

							this.service.request('palm://im.libpurpleext.greg/', {'method': "setMyAvailability", 
								'parameters': {'serviceName': systemSettings.messagingIMStatusCfg[index].accountDomain, 
									'username': systemSettings.messagingIMStatusCfg[index].accountUsername, 
									'availability': availability},
								'onComplete': requestCallback});
						}
					}
					
					return;
				}					
				
				break;
			}				
		}
		
		this.setSystemSettings(requestID, currentSettings, systemSettings, doneCallback, ++index);		
	}*/
	else 
		doneCallback();
}

/*
MessagingSetting.prototype.test = function(doneCallback, systemSettings,index,availability,response) {
Mojo.Log.error("TTT1 " + availability);

	setTimeout(this.testi.bind(this, doneCallback, systemSettings,index,availability,response), 15000);
						
}

MessagingSetting.prototype.testi = function(doneCallback, systemSettings,index,availability,response) {
Mojo.Log.error("TTT2 " + availability);

		this.service.request('palm://im.libpurpleext.greg/', {'method': "setMyAvailability", 
								'parameters': {'serviceName': systemSettings.messagingIMStatusCfg[index].accountDomain, 
									'username': systemSettings.messagingIMStatusCfg[index].accountUsername, 
									'availability': availability}});
						
}
*/

MessagingSetting.prototype.handleSetResponse = function(requestID, currentSettings, systemSettings, doneCallback, index, response) {
	if(requestID == 1)
		this.setSystemSettings(++requestID, currentSettings, systemSettings, doneCallback, 0);
	else if(requestID == 2)
		this.setSystemSettings(requestID, currentSettings, systemSettings, doneCallback, ++index);
	else
		this.setSystemSettings(++requestID, currentSettings, systemSettings, doneCallback, index);
}

