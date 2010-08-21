function MessagingSetting(Control) {
	this.service = Control.service;
}

//

MessagingSetting.prototype.init = function(callback) {
	callback(true);
}

MessagingSetting.prototype.shutdown = function() {
}

//

MessagingSetting.prototype.get = function(callback) {
	var settings = {};
	
	this.getSystemSettings(0, settings, callback);
}

MessagingSetting.prototype.set = function(settings, callback) {
	var current = {};

	var applyCallback = this.apply.bind(this, current, settings, callback);
	
	this.getSystemSettings(0, current, applyCallback);
}

//

MessagingSetting.prototype.apply = function(current, requested, callback) {
	this.setSystemSettings(0, current, requested, callback);
}

//

MessagingSetting.prototype.getSystemSettings = function(request, settings, callback, data, index) {
	var completeCallback = this.handleGetResponse.bind(this, request, settings, callback, data, index);
	
	if(request == 0) {
		this.service.request("palm://com.palm.messaging/", {'method': "getAllMessagingPreferences", 
			'parameters': {'subscribe':false}, 'onComplete': completeCallback});
	}
	else if(request == 1) {
		this.service.request('palm://com.palm.messaging/', { 'method': "getAccountList",
			'parameters': {'subscribe': false}, 'onComplete': completeCallback });
	}
/*	else if((request == 2) && (data != undefined) && (index < data.length)) {
		this.service.request('palm://im.libpurpleext.greg/', {'method': "getMyAvailability", 
			'parameters': {'serviceName': data[index].domain, 'username': data[index].username}, 
			'onSuccess': completeCallback, 'onFailure': completeCallback});
	}*/
	else
		callback(settings);
}

MessagingSetting.prototype.handleGetResponse = function(request, settings, callback, data, index, response) {
	if(response.returnValue) { // || (request == 2))
		if(request == 0) {
			settings.messagingAlert = response.messagingPrefs.enableNotificationSound;
		
			if((response.messagingPrefs.notificationRingtoneName != undefined) && 
				(response.messagingPrefs.notificationRingtoneName.length != 0))
			{
				settings.messagingRingtone = {
					'name': response.messagingPrefs.notificationRingtoneName,
					'path': response.messagingPrefs.notificationRingtonePath };
			}

			this.getSystemSettings(++request, settings, callback);
		}
		else if(request == 1) {
//			if(response.list.length == 1) {
			if(response.list.length > 0) {
				settings.messagingIMStatus = response.list[0].availability;
				
				this.getSystemSettings(++request, settings, callback);
			}
			else
				this.getSystemSettings(++request, settings, callback, response.list, 0);
		}
/*		else if(request == 2) {
			if(response.errorCode != undefined) {
				settings.messagingIMStatus = data[0].availability;
			
				this.getSystemSettings(++request, settings, callback);
			}
			else {
				if(settings.messagingIMStatusCfg == undefined)
					settings.messagingIMStatusCfg = [];
			
				if(response.returnValue == false)
					var availability = 4;
				else if(response.status == 2)
					var availability = 0;
				else if(response.status == 5)
					var availability = 2;
				else
					var availability = 4;
				
				settings.messagingIMStatusCfg.push({
					'accountId': data[index].id,
					'accountDomain': data[index].domain,
					'accountUsername': data[index].username,
					'messagingIMStatus': availability });

				this.getSystemSettings(request, settings, callback, data, ++index);
			}
		}*/
	}
	else
		this.getSystemSettings(++request, settings, callback);
}

//

MessagingSetting.prototype.setSystemSettings = function(request, current, settings, callback, index) {
	var completeCallback = this.handleSetResponse.bind(this, request, current, settings, callback, index);

	if(request == 0) {
		if((settings.messagingAlert == undefined) && (settings.messagingRingtone == undefined))
			this.setSystemSettings(++request, current, settings, callback);		
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
	else if(request == 1) {
		if((settings.messagingIMStatus == undefined) || (settings.messagingIMStatusCfg != undefined))
			this.setSystemSettings(++request, current, settings, callback, 0);		
		else {
			this.service.request("palm://com.palm.messaging/", {'method': "setMyAvailability", 
				'parameters': {'availability': settings.messagingIMStatus}, 
				'onComplete': completeCallback});
		}
	}
/*	else if((request == 2) && (settings.messagingIMStatusCfg) && 
		(index < settings.messagingIMStatusCfg.length))
	{
		var availability = 4;
	
		if(settings.messagingIMStatus != undefined)
			availability = settings.messagingIMStatus;
				
		availability = settings.messagingIMStatusCfg[index].messagingIMStatus;

		for(var i = 0; i < current.messagingIMStatusCfg.length; i++) {
			if(current.messagingIMStatusCfg[i].accountId == 
				settings.messagingIMStatusCfg[index].accountId)
			{
				Mojo.Log.error("III " + current.messagingIMStatusCfg[i].messagingIMStatus + " " + availability);

				if(current.messagingIMStatusCfg[i].messagingIMStatus != availability) {
					if(current.messagingIMStatusCfg[i].messagingIMStatus == 4) {
						Mojo.Log.error("AAA LOGIN");

						this.service.request("palm://com.palm.messaging/", {'method': "updateAccountPassword", 
							'parameters': {'accountId': settings.messagingIMStatusCfg[index].accountId, "password": "181180"}, 
							'onComplete': this.test.bind(this,completeCallback, settings,index, availability)});
					}
					else {
						if(settings.messagingIMStatusCfg[index].messagingIMStatus == 4) {
							Mojo.Log.error("AAA LOGOUT");

							this.service.request("palm://im.libpurpleext.greg/", {'method': "logout", 
								'parameters': {'accountId': settings.messagingIMStatusCfg[index].accountId}, 
								'onComplete': completeCallback});
						}
						else {
							Mojo.Log.error("AAA UPDATE " + settings.messagingIMStatusCfg[index].messagingIMStatus);

							this.service.request('palm://im.libpurpleext.greg/', {'method': "setMyAvailability", 
								'parameters': {'serviceName': settings.messagingIMStatusCfg[index].accountDomain, 
									'username': settings.messagingIMStatusCfg[index].accountUsername, 
									'availability': availability},
								'onComplete': completeCallback});
						}
					}
					
					return;
				}					
				
				break;
			}				
		}
		
		this.setSystemSettings(request, current, settings, callback, ++index);		
	}*/
	else 
		callback();
}

/*
MessagingSetting.prototype.test = function(callback, settings,index,availability,response) {
Mojo.Log.error("TTT1 " + availability);

	setTimeout(this.testi.bind(this, callback, settings,index,availability,response), 15000);
						
}

MessagingSetting.prototype.testi = function(callback, settings,index,availability,response) {
Mojo.Log.error("TTT2 " + availability);

		this.service.request('palm://im.libpurpleext.greg/', {'method': "setMyAvailability", 
								'parameters': {'serviceName': settings.messagingIMStatusCfg[index].accountDomain, 
									'username': settings.messagingIMStatusCfg[index].accountUsername, 
									'availability': availability}});
						
}
*/

MessagingSetting.prototype.handleSetResponse = function(request, current, settings, callback, index, response) {
	if(request == 1)
		this.setSystemSettings(++request, current, settings, callback, 0);
	else if(request == 2)
		this.setSystemSettings(request, current, settings, callback, ++index);
	else
		this.setSystemSettings(++request, current, settings, callback, index);
}

