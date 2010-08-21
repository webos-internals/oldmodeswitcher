function CalendarSetting(Control) {
	this.service = Control.service;
}

//

CalendarSetting.prototype.init = function(callback) {
	callback(true);
}

CalendarSetting.prototype.shutdown = function() {
}

//

CalendarSetting.prototype.get = function(callback) {
	var settings = {};

	this.getSystemSettings(0, settings, callback);
}

CalendarSetting.prototype.set = function(settings, callback) {
	this.setSystemSettings(0, settings, callback);
}

//

CalendarSetting.prototype.getSystemSettings = function(request, settings, callback) {
	var completeCallback = this.handleGetResponse.bind(this, request, settings, callback);
	
	if(request == 0) {
		this.service.request("palm://com.palm.calendar/", {'method': "getCalendarPrefs", 
			'parameters': {'subscribe': false}, 'onComplete': completeCallback});
	}
	else
		callback(settings);
}

CalendarSetting.prototype.handleGetResponse = function(request, settings, callback, response) {
	if(response.errorCode != undefined)
		return;

	if(response.returnValue) {
		if(request == 0) {
			settings.calendarAlarm = response.alarmSoundOn;
		
			if((response.ringtoneName != undefined) && 
				(response.ringtoneName.length != 0))
			{
				settings.calendarRingtone = {
					'name': response.ringtoneName,
					'path': response.ringtonePath };
			}
		}
	}
	
	this.getSystemSettings(++request, settings, callback);
}

//

CalendarSetting.prototype.setSystemSettings = function(request, settings, callback) {
	var completeCallback = this.handleSetResponse.bind(this, request, settings, callback);
	
	if(request == 0) {
		if((settings.calendarAlarm == undefined) && (settings.calendarRingtone == undefined))
			this.setSystemSettings(++request, settings, callback);
		else {
			var params = {};
		
			if(settings.calendarAlarm != undefined)
				params.alarmSoundOn = settings.calendarAlarm;
		
			if(settings.calendarRingtone != undefined) {
				params.ringtoneName = settings.calendarRingtone.name;
				params.ringtonePath = settings.calendarRingtone.path;
			}
			
			this.service.request("palm://com.palm.calendar/", {'method': "setCalendarPrefs", 
				'parameters': params, 'onSuccess': completeCallback});		
		}
	}
	else
		callback();
}

CalendarSetting.prototype.handleSetResponse = function(request, settings, callback, response) {
	this.setSystemSettings(++request, settings, callback);
}	

