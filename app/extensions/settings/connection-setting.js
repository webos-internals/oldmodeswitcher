function ConnectionSetting(ServiceRequestWrapper) {
	this.service = ServiceRequestWrapper;
	
	this.labels = new Array("wifi radio", "bluetooth radio", "location radio", "data connection", "phone power");
}

//

ConnectionSetting.prototype.get = function(callback) {
	var settings = {"connectionWiFi": 0, "connectionBT": 0, "connectionGPS": 0, "connectionData": 0, "connectionPhone": 0};
	
	this.getSystemSettings(0, 0, settings, callback);
}

ConnectionSetting.prototype.set = function(settings, callback) {
	var current = {"connectionWiFi": 0, "connectionBT": 0, "connectionGPS": 0, "connectionData": 0, "connectionPhone": 0};
	
	this.getSystemSettings(0, 0, current, this.apply.bind(this, current, settings, callback));
}

//

ConnectionSetting.prototype.apply = function(current, requested, callback) {
	var settings = {"connectionWiFi": 0, "connectionBT": 0, "connectionGPS": 0, "connectionData": 0, "connectionPhone": 0};

	if(current.connectionWiFi != requested.connectionWiFi)
		settings.connectionWiFi = requested.connectionWiFi;
		
	if(current.connectionBT != requested.connectionBT)
		settings.connectionBT = requested.connectionBT;

	if(current.connectionGPS != requested.connectionGPS)
		settings.connectionGPS = requested.connectionGPS;

	if(current.connectionData != requested.connectionData)
		settings.connectionData = requested.connectionData;

	if(current.connectionPhone != requested.connectionPhone)
		settings.connectionPhone = requested.connectionPhone;

	this.setSystemSettings(0, 0, settings, callback);
}

//

ConnectionSetting.prototype.getSystemSettings = function(request, retry, settings, callback) {
	var completeCallback = this.handleGetResponse.bind(this, request, retry, settings, callback);
	
	if(request == 0) {
		this.service.request('palm://com.palm.wifi/', { method: 'getstatus', 
			parameters: {'subscribe': false}, onComplete: completeCallback });
	}
	else if(request == 1) {
		this.service.request('palm://com.palm.btmonitor/monitor/',{	method:'getradiostate', 
			parameters: {}, onComplete: completeCallback });
	}
	else if(request == 2) {
		this.service.request('palm://com.palm.location/', { method: 'getUseGps', 
			parameters: {}, onComplete: completeCallback });
	}
	else if(request == 3) {
		this.service.request('palm://com.palm.connectionmanager/', { method: 'getstatus', 
			parameters: {}, onComplete: completeCallback });
	}
	else if(request == 4) {
		this.service.request('palm://com.palm.telephony/', { method: 'powerQuery', 
			parameters: {}, onComplete: completeCallback });
	}
	else
		callback(settings);
}

ConnectionSetting.prototype.handleGetResponse = function(request, retry, settings, callback, response) {
	if((response.returnValue) || (response.returnValuer == undefined)) {
		// System request was succesfull so store the data and move to next request.
		
		if(request == 0) {
			if (response.status == 'serviceDisabled')
				settings.connectionWiFi = 2;
			else
				settings.connectionWiFi = 1;
		}
		else if(request == 1) {
			if((response.radio == "turningoff") || (response.radio == "off"))
				settings.connectionBT = 2;
			else
				settings.connectionBT = 1;
		}
		else if(request == 2) {
			if(response.useGps == true)
				settings.connectionGPS = 1;
			else if(response.useGps == false)
				settings.connectionGPS = 2;
		}
		else if(request == 3) {
			if(response.wan.state == "connected")
				settings.connectionData = 1;
			else if(response.wan.state == "disconnected")
				settings.connectionData = 2;
		}
		else if(request == 4) {
			if((response.extended.powerState) && (response.extended.powerState == 'on'))
				settings.connectionPhone = 1;
			else if((response.extended.powerState) && (response.extended.powerState == 'off'))
				settings.connectionPhone = 2;
		}
		
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

ConnectionSetting.prototype.setSystemSettings = function(request, retry, settings, callback) {
	var completeCallback = this.handleSetResponse.bind(this, request, retry, settings, callback);
	
	if(request == 0) {
		if(settings.connectionWiFi == 0)
			this.setSystemSettings(++request, 0, settings, callback);
		else {
			if(settings.connectionWiFi == 1)
				var wifiState = "enabled";
			else
				var wifiState = "disabled";
		
			this.service.request('palm://com.palm.wifi/', { method: 'setstate', 
				parameters: {'state': wifiState}, onComplete: completeCallback });
		}
	}
	else if(request == 1) {
		if(settings.connectionBT == 0)
			this.setSystemSettings(++request, 0, settings, callback);
		else {
			if(settings.connectionBT == 1) {
				var btmethod = "radioon";
				var btstates = true;
			}
			else {
				var btmethod = "radiooff";
				var btstates = false;
			}
		
			this.service.request('palm://com.palm.btmonitor/monitor/', { method: btmethod, 
				parameters: {'visible': btstates, 'connectable': btstates}, onComplete: completeCallback });
		}
	}
	else if(request == 2) {
		if(settings.connectionGPS == 0)
			this.setSystemSettings(++request, 0, settings, callback);
		else {
			if(settings.connectionGPS == 1)
				var useGps = true;
			else
				var useGps = false;
		
			this.service.request('palm://com.palm.location/', { method: 'setUseGps', 
				parameters: {"useGps": useGps}, onComplete: completeCallback });
		}
	}
	else if(request == 3) {
		if(settings.connectionData == 0)
			this.setSystemSettings(++request, 0, settings, callback);
		else {
			if(settings.connectionData == 1)
				var disabled = "off";
			else
				var disabled = "on";
		
			this.service.request('palm://com.palm.wan/', { method: 'set',
				parameters: {"disablewan": disabled}, onComplete: completeCallback });
		}
	}
	else if(request == 4) {
		if(settings.connectionPhone == 0)
			this.setSystemSettings(++request, 0, settings, callback);
		else {
			if(settings.connectionPhone == 1)
				var state = "on";
			else
				var state = "off";
		
			this.service.request('palm://com.palm.telephony', { method: 'powerSet', 
				parameters: {"state": state}, onComplete: completeCallback });
		}
	}
	else
		callback();
}

ConnectionSetting.prototype.handleSetResponse = function(request, retry, settings, callback, response) {
	if((response.returnValue) || (response.returnValuer == undefined)) {
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

