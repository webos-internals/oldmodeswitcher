function ConnectionSetting(ServiceRequestWrapper) {
	this.service = ServiceRequestWrapper;
}

//

ConnectionSetting.prototype.get = function(callback) {
	var settings = {};
	
	this.getSystemSettings(0, settings, callback);
}

ConnectionSetting.prototype.set = function(settings, callback) {
	var current = {};
	
	var applyCallback = this.apply.bind(this, current, settings, callback);
	
	this.getSystemSettings(0, current, applyCallback);
}

//

ConnectionSetting.prototype.apply = function(current, requested, callback) {
	var settings = {};

	if((requested.connectionPhone != undefined) && (current.connectionPhone != requested.connectionPhone))
		settings.connectionPhone = requested.connectionPhone;

	if((requested.connectionData != undefined) && (current.connectionData != requested.connectionData))
		settings.connectionData = requested.connectionData;

	if((requested.connectionWiFi != undefined) && (current.connectionWiFi != requested.connectionWiFi))
		settings.connectionWiFi = requested.connectionWiFi;
		
	if((requested.connectionBT != undefined) && (current.connectionBT != requested.connectionBT))
		settings.connectionBT = requested.connectionBT;

	if((requested.connectionGPS != undefined) && (current.connectionGPS != requested.connectionGPS))
		settings.connectionGPS = requested.connectionGPS;

	this.setSystemSettings(0, settings, callback);
}

//

ConnectionSetting.prototype.getSystemSettings = function(request, settings, callback) {
	var completeCallback = this.handleGetResponse.bind(this, request, settings, callback);
	
	if(request == 0) {
		this.service.request("palm://com.palm.telephony/", {'method': "powerQuery", 
			'parameters': {}, 'onComplete': completeCallback});
	}
	else if(request == 1) {
		this.service.request("palm://com.palm.connectionmanager/", {'method': "getstatus", 
			'parameters': {}, 'onComplete': completeCallback});
	}
	else if(request == 2) {
		this.service.request("palm://com.palm.wifi/", {'method': "getstatus", 
			'parameters': {'subscribe': false}, 'onComplete': completeCallback});
	}
	else if(request == 3) {
		this.service.request("palm://com.palm.btmonitor/monitor/",{'method': "getradiostate", 
			'parameters': {}, 'onComplete': completeCallback});
	}
	else if(request == 4) {
		this.service.request("palm://com.palm.location/", {'method': "getUseGps", 
			'parameters': {}, 'onComplete': completeCallback});
	}
	else
		callback(settings);
}

ConnectionSetting.prototype.handleGetResponse = function(request, settings, callback, response) {
	if(response.returnValue) {
		if(request == 0) {
			if(response.extended) {
				if((response.extended.powerState) && (response.extended.powerState == 'on'))
					settings.connectionPhone = 1;
				else if((response.extended.powerState) && (response.extended.powerState == 'off'))
					settings.connectionPhone = 0;
			}
		}
		else if(request == 1) {
			if(response.wan) {
				if(response.wan.state == "connected")
					settings.connectionData = 1;
				else if(response.wan.state == "disconnected")
					settings.connectionData = 0;
			}
		}
		else if(request == 2) {
			if (response.status == 'serviceDisabled')
				settings.connectionWiFi = 0;
			else
				settings.connectionWiFi = 1;
		}
		else if(request == 3) {
			if((response.radio == "turningoff") || (response.radio == "off"))
				settings.connectionBT = 0;
			else
				settings.connectionBT = 1;
		}
		else if(request == 4) {
			if(response.useGps == true)
				settings.connectionGPS = 1;
			else if(response.useGps == false)
				settings.connectionGPS = 0;
		}
	}

	this.getSystemSettings(++request, settings, callback);
}

//

ConnectionSetting.prototype.setSystemSettings = function(request, settings, callback) {
	var completeCallback = this.handleSetResponse.bind(this, request, settings, callback);
	
	if(request == 0) {
		if(settings.connectionPhone == undefined)
			this.setSystemSettings(++request, settings, callback);
		else {
			if(settings.connectionPhone == 1)
				var state = "on";
			else
				var state = "off";
		
			this.service.request("palm://com.palm.telephony", {'method': "powerSet", 
				'parameters': {'state': state}, 'onComplete': completeCallback});
		}
	}
	else if(request == 1) {
		if(settings.connectionData == undefined)
			this.setSystemSettings(++request, settings, callback);
		else {
			if(settings.connectionData == 1)
				var disabled = "off";
			else
				var disabled = "on";
		
			this.service.request("palm://com.palm.wan/", {'method': "set",
				'parameters': {'disablewan': disabled}, 'onComplete': completeCallback});
		}
	}
	else if(request == 2) {
		if(settings.connectionWiFi == undefined)
			this.setSystemSettings(++request, settings, callback);
		else {
			if(settings.connectionWiFi == 1)
				var wifiState = "enabled";
			else
				var wifiState = "disabled";
		
			this.service.request("palm://com.palm.wifi/", {'method': "setstate", 
				'parameters': {'state': wifiState}, 'onComplete': completeCallback});
		}
	}
	else if(request == 3) {
		if(settings.connectionBT == undefined)
			this.setSystemSettings(++request, settings, callback);
		else {
			if(settings.connectionBT == 1) {
				var btmethod = "radioon";
				var btstates = true;
			}
			else {
				var btmethod = "radiooff";
				var btstates = false;
			}
		
			this.service.request("palm://com.palm.btmonitor/monitor/", {'method': btmethod, 
				'parameters': {'visible': btstates, 'connectable': btstates}, 
				'onComplete': completeCallback});
		}
	}
	else if(request == 4) {
		if(settings.connectionGPS == undefined)
			this.setSystemSettings(++request, settings, callback);
		else {
			if(settings.connectionGPS == 1)
				var useGps = true;
			else
				var useGps = false;
		
			this.service.request("palm://com.palm.location/", {'method': "setUseGps", 
				'parameters': {'useGps': useGps}, 'onComplete': completeCallback});
		}
	}
	else
		callback();
}

ConnectionSetting.prototype.handleSetResponse = function(request, settings, callback, response) {
	this.setSystemSettings(++request, settings, callback);
}	

