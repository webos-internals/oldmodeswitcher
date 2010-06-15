function MessagingSetting(ServiceRequestWrapper) {
	this.service = ServiceRequestWrapper;
	
	this.labels = new Array("instant message", "message sound");
}

//

MessagingSetting.prototype.get = function(callback) {
	var settings = {"messagingIMStatus": 0, "messagingSoundMode": 0, "messagingRingtoneName": "Do Not Set", "messagingRingtonePath": ""};
	
	this.getSystemSettings(0, 0, settings, callback);
}

MessagingSetting.prototype.set = function(settings, callback) {
	this.setSystemSettings(0, 0, settings, callback);
}

//

MessagingSetting.prototype.getSystemSettings = function(request, retry, settings, callback) {
	var completeCallback = this.handleGetResponse.bind(this, request, retry, settings, callback);
	
	if(request == 0) {
		this.service.request('palm://com.palm.messaging/', { method: 'getAccountList',
			parameters: {'subscribe': false}, onComplete: completeCallback });
	}
	else if(request == 1) {
		this.service.request("palm://com.palm.messaging/", { method: 'getNotificationPreferences', 
			parameters: {'subscribe':false}, onComplete: completeCallback });
	}
//	else if(request == 2) {
//		this.service.request("palm://com.palm.messaging/", { method: '...', 
//			parameters: {'subscribe':false}, onComplete: completeCallback });
//	}
	else
		callback(settings);
}

MessagingSetting.prototype.handleGetResponse = function(request, retry, settings, callback, response) {
	if((response.returnValue) || (response.returnValue == undefined)) {
		// System request was succesfull so store the data and move to next request.
		
		Mojo.Log.info("Succesful " + this.labels[request] + " request");
		
		if(request == 0) {
			if(response.count > 0) {
				if(response.list[0].availability == 0)
					settings.messagingIMStatus = 1;
				else if(response.list[0].availability == 2)
					settings.messagingIMStatus = 2;
				else if(response.list[0].availability == 4)
					settings.messagingIMStatus = 3;
			}
		}
		else if(request == 1) {
			if(response.isEnabledNotificationSound == 0)
				settings.messagingSoundMode = 4;
			else if(response.isEnabledNotificationSound == 1)
				settings.messagingSoundMode = 2;
			else if(response.isEnabledNotificationSound == 2)
				settings.messagingSoundMode = 3;
			else if(response.isEnabledNotificationSound == 3)
				settings.messagingSoundMode = 1;
		}
//		else if(request == 2) {
//			settings.messagingRingtoneName = response.messagetone.name;
//			settings.messagingRingtonePath = response.messagetone.fullPath;
//		}		
		
		this.getSystemSettings(++request, 0, settings, callback);
	}
	else {
		// System request failed so retry or skip the request.

		if(retry < 2) {
			Mojo.Log.warn("Retrying " + this.labels[request] + " request");
			
			this.getSystemSettings(request, ++retry, settings, callback);
		}
		else {
			Mojo.Log.error("Skipping " + this.labels[request] + " request");
			
			this.getSystemSettings(++request, 0, settings, callback);
		}
	}
}

//

MessagingSetting.prototype.setSystemSettings = function(request, retry, settings, callback) {
	var completeCallback = this.handleSetResponse.bind(this, request, retry, settings, callback);
	
	if(request == 0) {
		if(settings.messagingIMStatus == 0)
			this.setSystemSettings(++request, 0, settings, callback);		
		else {
			if(settings.messagingIMStatus == 1)
				var availability = 0;
			else if(settings.messagingIMStatus == 2)
				var availability = 2;
			else if(settings.messagingIMStatus == 3)
				var availability = 4;
	
			this.service.request('palm://com.palm.messaging/', { method: 'setMyAvailability', 
				parameters: {"availability": availability}, onComplete: completeCallback });
		}
	}
	else if(request == 1) {
		if(settings.messagingSoundMode == 0)
			this.setSystemSettings(++request, 0, settings, callback);		
		else {
			if(settings.messagingSoundMode == 1)
				var enabled = 3;
			else if(settings.messagingSoundMode == 2)
				var enabled = 1;
			else if(settings.messagingSoundMode == 3)
				var enabled = 2;
			else if(settings.messagingSoundMode == 4)
				var enabled = 0;
	
			this.service.request('palm://com.palm.messaging/', { method: 'setNotificationPreferences', 
				parameters: {"isEnabledNotificationSound": enabled}, onComplete: completeCallback });
		}
	}
	else
		callback();
}

MessagingSetting.prototype.handleSetResponse = function(request, retry, settings, callback, response) {
	if((response.returnValue) || (response.returnValue == undefined)) {
		// System request was succesful so move to next request.
		
		Mojo.Log.info("Succesful " + this.labels[request] + " request");
		
		this.setSystemSettings(++request, 0, settings, callback);
	}
	else {
		// System request failed so retry or skip the request.
		
		if(retry < 2) {
			Mojo.Log.warn("Retrying " + this.labels[request] + " request");
			
			this.setSystemSettings(request, ++retry, settings, callback);
		}
		else {
			Mojo.Log.error("Skipping " + this.labels[request] + " request");
			
			this.setSystemSettings(++request, 0, settings, callback);
		}
	}
}

