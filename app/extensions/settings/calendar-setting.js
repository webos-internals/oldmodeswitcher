function CalendarSetting(Control) {
	this.service = Control.service;
}

//

CalendarSetting.prototype.init = function(doneCallback) {
	doneCallback(true);
}

CalendarSetting.prototype.shutdown = function() {
}

//

CalendarSetting.prototype.get = function(doneCallback) {
	var systemSettings = {};

	this.getSystemSettings(0, systemSettings, doneCallback);
}

CalendarSetting.prototype.set = function(systemSettings, doneCallback) {
	this.setSystemSettings(0, systemSettings, doneCallback);
}

//

CalendarSetting.prototype.getSystemSettings = function(requestID, systemSettings, doneCallback) {
	var completeCallback = this.handleGetResponse.bind(this, requestID, systemSettings, doneCallback);
	
	if(requestID == 0) {
		this.service.request("palm://com.palm.calendar/", {'method': "getCalendarPrefs", 
			'parameters': {'subscribe': false}, 'onComplete': completeCallback});
	}
	else
		doneCallback(systemSettings);
}

CalendarSetting.prototype.handleGetResponse = function(requestID, systemSettings, doneCallback, serviceResponse) {
	if(serviceResponse.errorCode != undefined)
		return;

	if(serviceResponse.returnValue) {
		if(requestID == 0) {
			systemSettings.calendarAlarm = serviceResponse.alarmSoundOn;
		
			if((serviceResponse.ringtoneName != undefined) && 
				(serviceResponse.ringtoneName.length != 0))
			{
				systemSettings.calendarRingtone = {
					'name': serviceResponse.ringtoneName,
					'path': serviceResponse.ringtonePath };
			}
		}
	}
	
	this.getSystemSettings(++requestID, systemSettings, doneCallback);
}

//

CalendarSetting.prototype.setSystemSettings = function(requestID, systemSettings, doneCallback) {
	var completeCallback = this.handleSetResponse.bind(this, requestID, systemSettings, doneCallback);
	
	if(requestID == 0) {
		if((systemSettings.calendarAlarm == undefined) && (systemSettings.calendarRingtone == undefined))
			this.setSystemSettings(++requestID, systemSettings, doneCallback);
		else {
			var params = {};
		
			if(systemSettings.calendarAlarm != undefined)
				params.alarmSoundOn = systemSettings.calendarAlarm;
		
			if(systemSettings.calendarRingtone != undefined) {
				params.ringtoneName = systemSettings.calendarRingtone.name;
				params.ringtonePath = systemSettings.calendarRingtone.path;
			}
			
			this.service.request("palm://com.palm.calendar/", {'method': "setCalendarPrefs", 
				'parameters': params, 'onSuccess': completeCallback});		
		}
	}
	else
		doneCallback();
}

CalendarSetting.prototype.handleSetResponse = function(requestID, systemSettings, doneCallback, serviceResponse) {
	this.setSystemSettings(++requestID, systemSettings, doneCallback);
}	

