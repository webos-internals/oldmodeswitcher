function ConnectionSetting(Control) {
	this.service = Control.service;
}

//

ConnectionSetting.prototype.init = function(doneCallback) {
	doneCallback(true);
}

ConnectionSetting.prototype.shutdown = function() {
}

//

ConnectionSetting.prototype.get = function(doneCallback) {
	var systemSettings = {};
	
	this.getSystemSettings(0, systemSettings, doneCallback);
}

ConnectionSetting.prototype.set = function(systemSettings, doneCallback) {
	var currentSettings = {};
	
	var applyCallback = this.apply.bind(this, currentSettings, systemSettings, doneCallback);
	
	this.getSystemSettings(0, currentSettings, applyCallback);
}

//

ConnectionSetting.prototype.apply = function(currentSettings, requestedSettings, doneCallback) {
	var systemSettings = {};

	if((requestedSettings.connectionPhone != undefined) && (currentSettings.connectionPhone != requestedSettings.connectionPhone))
		systemSettings.connectionPhone = requestedSettings.connectionPhone;

	if((requestedSettings.connectionData != undefined) && (currentSettings.connectionData != requestedSettings.connectionData))
		systemSettings.connectionData = requestedSettings.connectionData;

//	if((requestedSettings.connectionWiFi != undefined) && (currentSettings.connectionWiFi != requestedSettings.connectionWiFi))
		systemSettings.connectionWiFi = requestedSettings.connectionWiFi;
		
//	if((requestedSettings.connectionBT != undefined) && (currentSettings.connectionBT != requestedSettings.connectionBT))
		systemSettings.connectionBT = requestedSettings.connectionBT;

	if((requestedSettings.connectionGPS != undefined) && (currentSettings.connectionGPS != requestedSettings.connectionGPS))
		systemSettings.connectionGPS = requestedSettings.connectionGPS;

	this.setSystemSettings(0, systemSettings, doneCallback);
}

//

ConnectionSetting.prototype.getSystemSettings = function(requestID, systemSettings, doneCallback) {
	var requestCallback = this.handleGetResponse.bind(this, requestID, systemSettings, doneCallback);
	
	if(requestID == 0) {
		this.service.request("palm://com.palm.telephony/", {'method': "powerQuery", 
			'parameters': {}, 'onComplete': requestCallback});
	}
	else if(requestID == 1) {
		this.service.request("palm://com.palm.connectionmanager/", {'method': "getstatus", 
			'parameters': {}, 'onComplete': requestCallback});
	}
	else if(requestID == 2) {
		this.service.request("palm://com.palm.wifi/", {'method': "getstatus", 
			'parameters': {'subscribe': false}, 'onComplete': requestCallback});
	}
	else if(requestID == 3) {
		this.service.request("palm://com.palm.btmonitor/monitor/",{'method': "getradiostate", 
			'parameters': {}, 'onComplete': requestCallback});
	}
	else if(requestID == 4) {
		this.service.request("palm://com.palm.location/", {'method': "getUseGps", 
			'parameters': {}, 'onComplete': requestCallback});
	}
	else
		doneCallback(systemSettings);
}

ConnectionSetting.prototype.handleGetResponse = function(requestID, systemSettings, doneCallback, serviceResponse) {
	if(serviceResponse.returnValue) {
		if(requestID == 0) {
			if(serviceResponse.extended) {
				if((serviceResponse.extended.powerState) && (serviceResponse.extended.powerState == 'on'))
					systemSettings.connectionPhone = 1;
				else if((serviceResponse.extended.powerState) && (serviceResponse.extended.powerState == 'off'))
					systemSettings.connectionPhone = 0;
			}
		}
		else if(requestID == 1) {
			if(serviceResponse.wan) {
				if(serviceResponse.wan.state == "connected")
					systemSettings.connectionData = 1;
				else if(serviceResponse.wan.state == "disconnected")
					systemSettings.connectionData = 0;
			}
		}
		else if(requestID == 2) {
			if (serviceResponse.status == 'serviceDisabled')
				systemSettings.connectionWiFi = 0;
			else
				systemSettings.connectionWiFi = 1;
		}
		else if(requestID == 3) {
			if((serviceResponse.radio == "turningoff") || (serviceResponse.radio == "off"))
				systemSettings.connectionBT = 0;
			else
				systemSettings.connectionBT = 1;
		}
		else if(requestID == 4) {
			if(serviceResponse.useGps == true)
				systemSettings.connectionGPS = 1;
			else if(serviceResponse.useGps == false)
				systemSettings.connectionGPS = 0;
		}
	}

	this.getSystemSettings(++requestID, systemSettings, doneCallback);
}

//

ConnectionSetting.prototype.setSystemSettings = function(requestID, systemSettings, doneCallback) {
	var requestCallback = this.handleSetResponse.bind(this, requestID, systemSettings, doneCallback);
	
	if(requestID == 0) {
		if(systemSettings.connectionPhone == undefined)
			this.setSystemSettings(++requestID, systemSettings, doneCallback);
		else {
			if(systemSettings.connectionPhone == 1)
				var state = "on";
			else
				var state = "off";
		
			this.service.request("palm://com.palm.telephony", {'method': "powerSet", 
				'parameters': {'state': state}, 'onComplete': requestCallback});
		}
	}
	else if(requestID == 1) {
		if(systemSettings.connectionData == undefined)
			this.setSystemSettings(++requestID, systemSettings, doneCallback);
		else {
			if(systemSettings.connectionData == 1)
				var disabled = "off";
			else
				var disabled = "on";
		
			this.service.request("palm://com.palm.wan/", {'method': "set",
				'parameters': {'disablewan': disabled}, 'onComplete': requestCallback});
		}
	}
	else if(requestID == 2) {
		if(systemSettings.connectionWiFi == undefined)
			this.setSystemSettings(++requestID, systemSettings, doneCallback);
		else {
			if(systemSettings.connectionWiFi == 1)
				var wifiState = "enabled";
			else
				var wifiState = "disabled";

			this.service.request("palm://com.palm.wifi/", {'method': "setstate", 
				'parameters': {'state': wifiState}, 'onComplete': requestCallback});
		}
	}
	else if(requestID == 3) {
		if(systemSettings.connectionBT == undefined)
			this.setSystemSettings(++requestID, systemSettings, doneCallback);
		else {
			if(systemSettings.connectionBT == 1) {
				var btmethod = "radioon";
				var btstates = true;
			}
			else {
				var btmethod = "radiooff";
				var btstates = false;
			}
		
			this.service.request("palm://com.palm.btmonitor/monitor/", {'method': btmethod, 
				'parameters': {'visible': btstates, 'connectable': btstates}, 
				'onComplete': requestCallback});
		}
	}
	else if(requestID == 4) {
		if(systemSettings.connectionGPS == undefined)
			this.setSystemSettings(++requestID, systemSettings, doneCallback);
		else {
			if(systemSettings.connectionGPS == 1)
				var useGps = true;
			else
				var useGps = false;
		
			this.service.request("palm://com.palm.location/", {'method': "setUseGps", 
				'parameters': {'useGps': useGps}, 'onComplete': requestCallback});
		}
	}
	else
		doneCallback();
}

ConnectionSetting.prototype.handleSetResponse = function(requestID, systemSettings, doneCallback, serviceResponse) {
	this.setSystemSettings(++requestID, systemSettings, doneCallback);
}	

