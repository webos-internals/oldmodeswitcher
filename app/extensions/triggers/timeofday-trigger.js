function TimeofdayTrigger(Config, Control) {
	this.config = Config;

	this.service = Control.service;
	this.alarms = Control.alarms;

	this.initialized = false;

	this.startupCallback = null;
	this.executeCallback = null;

	this.sysTimeouts = new Array();
}

//

TimeofdayTrigger.prototype.init = function(startupCallback) {
	this.initialized = true;
	
	startupCallback(true);
}

TimeofdayTrigger.prototype.shutdown = function() {
	this.initialized = false;
}

//

TimeofdayTrigger.prototype.enable = function(executeCallback) {
	// Re-schedule and setup all timers for timeofday triggers. 

	this.executeCallback = executeCallback;

	// Re-schedule and setup all timers for timeofday trigger. 

	for(var i = 0; i < this.config.modesConfig.length; i++) {
		for(var j = 0; j < this.config.modesConfig[i].triggersList.length; j++) {
 			if(this.config.modesConfig[i].triggersList[j].extension == "timeofday") {
				var limits = this.getTimeOfDayLimits(this.config.modesConfig[i].triggersList[j], true);

				if(this.sysTimeouts.indexOf(limits.startTime.getTime() / 1000) == -1)
					this.sysTimeouts.push(limits.startTime.getTime() / 1000);

				if(this.sysTimeouts.indexOf(limits.closeTime.getTime() / 1000) == -1)
					this.sysTimeouts.push(limits.closeTime.getTime() / 1000);

 				this.alarms.setupAlarmTimeout("timeofday", limits.startTime, 
 					{'timestamp': limits.startTime.getTime() / 1000});
 					
 				this.alarms.setupAlarmTimeout("timeofday", limits.closeTime, 
 					{'timestamp': limits.closeTime.getTime() / 1000});
			}
		}
	}
}

TimeofdayTrigger.prototype.disable = function() {
	// Disable all timeofday trigger timers.

	this.executeCallback = null;

	for(var i = 0; i < this.sysTimeouts.length; i++) {
		var date = new Date(this.sysTimeouts[i] * 1000);

		this.alarms.clearAlarmTimeout("timeofday", date);
	}
	
	this.sysTimeouts.clear();
}

//

TimeofdayTrigger.prototype.check = function(triggerConfig, modeName) {
	var limits = this.getTimeOfDayLimits(triggerConfig, true);
		
	if((limits.curTime >= limits.startTime) && (limits.curTime < limits.closeTime))
		return true;
	
	return false;
}

//

TimeofdayTrigger.prototype.execute = function(triggerData, manualLaunch) {
	Mojo.Log.error("Timeofday trigger received: " + Object.toJSON(triggerData));

	// Process timeofday event for generating the launcherModes list for the launcher.

	// Find the corresponding mode config(s) that matches the timestamp parameter.
	// Check that time trigger is enabled and if yes then re-schedule the timeofday.

	// Find the corresponding mode config(s) that matches the timestamp parameter.
	// Check that the time trigger is enabled and if yes then re-schedule the timeofday.

	var startModes = new Array();
	var closeModes = new Array();

	if(triggerData.timestamp) {
		var index = this.sysTimeouts.indexOf(triggerData.timestamp);
		
		if(index != -1)
			this.sysTimeouts.splice(index, 1);

		for(var i = 0; i < this.config.modesConfig.length; i++) {
			for(var j = 0; j < this.config.modesConfig[i].triggersList.length; j++) {
				if(this.config.modesConfig[i].triggersList[j].extension == "timeofday") {
					var current = this.getTimeOfDayLimits(this.config.modesConfig[i].triggersList[j], true);
					var limits = this.getTimeOfDayLimits(this.config.modesConfig[i].triggersList[j], false);
								
					if((current.startTime.getTime() / 1000) == triggerData.timestamp) {
						if(this.sysTimeouts.indexOf(limits.startTime.getTime() / 1000) == -1)
							this.sysTimeouts.push(limits.startTime.getTime() / 1000);
					
						this.alarms.setupAlarmTimeout("timeofday", limits.startTime, 
							{'timestamp': limits.startTime.getTime() / 1000});
					
						if((this.config.modesConfig[i].name != this.config.currentMode.name) &&
							(this.config.modifierModes.indexOf(this.config.modesConfig[i].name) == -1))
						{
							if(this.check(this.config.modesConfig[i].triggersList[j])) {
								startModes.push(this.config.modesConfig[i]);
								break;
							}
						}
					}
					else if((current.closeTime.getTime() / 1000) == triggerData.timestamp) {
						if(this.sysTimeouts.indexOf(limits.closeTime.getTime() / 1000) == -1)
							this.sysTimeouts.push(limits.closeTime.getTime() / 1000);

						this.alarms.setupAlarmTimeout("timeofday", limits.closeTime, 
							{'timestamp': limits.closeTime.getTime() / 1000});

						if((this.config.modesConfig[i].name == this.config.currentMode.name) ||
							(this.config.modifierModes.indexOf(this.config.modesConfig[i].name) != -1))
						{
							if(!this.check(this.config.modesConfig[i].triggersList[j])) {
								closeModes.push(this.config.modesConfig[i]);
								break;
							}
						}
					}
				}
			}
		}

		if((this.executeCallback) && ((startModes.length > 0) || (closeModes.length > 0)))
			this.executeCallback(startModes, closeModes);
	}
}

//

TimeofdayTrigger.prototype.getTimeOfDayLimits = function(triggerTimes, getCurrent) {
	// Returns current time limits with correct day information. 
	// We cannot trust the date information stored in the trigger
	// so we need to figure out the correct dates for the limits.

	var curTime = new Date();
	var startTime = new Date(triggerTimes.timeofdayStart * 1000);
	var closeTime = new Date(triggerTimes.timeofdayClose * 1000);
	
	curTime.setSeconds(0); curTime.setMilliseconds(0);

	// Hours, Minutes, Seconds and Milliseconds should be correct (set in editmode).

	startTime.setFullYear(curTime.getFullYear(), curTime.getMonth(), curTime.getDate());
	closeTime.setFullYear(curTime.getFullYear(), curTime.getMonth(), curTime.getDate());

	// Check that if startTime has actually gone that is the current day correct.

	if(startTime.getTime() > curTime.getTime()) {
		if(closeTime.getTime() >= curTime.getTime()) {
			startTime.setDate(startTime.getDate() - 1);
			closeTime.setDate(closeTime.getDate() - 1);
		}
	}

	// If set to be active whole day then move the start and close time to be correct.
	
	if(startTime.getTime() == closeTime.getTime()) {
			startTime.setDate(startTime.getDate() - 1);
			closeTime.setDate(closeTime.getDate() - 1);
	}

	// First check if closeTime is set for the following day (closeTime before startTime).

	if(startTime.getTime() >= closeTime.getTime())
		closeTime.setDate(closeTime.getDate() + 1);
		
	// Move the startTime / closeTime for the next day if closeTime is already past.

	if(closeTime.getTime() < curTime.getTime()) {
		startTime.setDate(startTime.getDate() + 1);
		closeTime.setDate(closeTime.getDate() + 1);
	}
	
	// Fix the startTime / closeTime according to the setup (workdays / weekends).

	if(triggerTimes.timeofdayDays == 1) {
		if(startTime.getDay() == 0) {
			startTime.setDate(startTime.getDate() + 1);
			closeTime.setDate(closeTime.getDate() + 1);
		}
		else if(startTime.getDay() == 6) {
			startTime.setDate(startTime.getDate() + 2);
			closeTime.setDate(closeTime.getDate() + 2);
		}
		
		// If set to be active full 24 hours then move the closeTime to be correct.
		
		if(startTime.getTime() == closeTime.getTime()) {
			closeTime.setDate(closeTime.getDate() + (6 - closeTime.getDay()));
		}
	}
	else if(triggerTimes.timeofdayDays == 2) {
		if((startTime.getDay() >= 1) && (startTime.getDay() <= 5)) {
			var days = 6 - startTime.getDay();
			
			startTime.setDate(startTime.getDate() + days);
			closeTime.setDate(closeTime.getDate() + days);
		}

		// If set to be active full 24 hours then move the closeTime to be correct.
		
		if(startTime.getTime() == closeTime.getTime()) {
			if(closeTime.getDay() == 0) {
				closeTime.setDate(closeTime.getDate() + 1);
			}
			else if(closeTime.getDay() == 6) {
				closeTime.setDate(closeTime.getDate() + 2);
			}
		}
	}
	else if(triggerTimes.timeofdayDays == 3) {
		for(var i = 0; i < 7; i++) {
			if(triggerTimes.timeofdayCustom[startTime.getDay()] != true) {
				startTime.setDate(startTime.getDate() + 1);
				closeTime.setDate(closeTime.getDate() + 1);
			}
			else {
				// If set to be active full 24 hours then move the closeTime to be correct.
		
				if(startTime.getTime() == closeTime.getTime()) {
					for(var j = 0; j < 7; j++) {
						if(triggerTimes.timeofdayCustom[closeTime.getDay()] == true) {
							closeTime.setDate(closeTime.getDate() + 1);
						}
						else {
							break;
						}
					}
				}
		
				break;
			}
		}
	}

	if(!getCurrent) {
		// Moves start and close limits for the next possible time 

		if(startTime.getTime() <= curTime.getTime())
			startTime.setDate(startTime.getDate() + 1);

		if(closeTime.getTime() <= curTime.getTime())
			closeTime.setDate(closeTime.getDate() + 1);

		if(triggerTimes.timeofdayDays == 1) {
			if(startTime.getDay() == 0) {
				startTime.setDate(startTime.getDate() + 1);
				closeTime.setDate(closeTime.getDate() + 1);
			}
			else if(startTime.getDay() == 6) {
				startTime.setDate(startTime.getDate() + 2);
				closeTime.setDate(closeTime.getDate() + 2);
			}	
		}

		else if(triggerTimes.timeofdayDays == 2) {
			if((startTime.getDay() >= 1) && (startTime.getDay() <= 5)) {
				startTime.setDate(startTime.getDate() + (6 - startTime.getDay()));
				closeTime.setDate(closeTime.getDate() + (6 - closeTime.getDay()));
			}
		}

		else if(triggerTimes.timeofdayDays == 3) {
			for(var i = 0; i < 7; i++) {
				if(triggerTimes.timeofdayCustom[startTime.getDay()] != true) {
					startTime.setDate(startTime.getDate() + 1);
					closeTime.setDate(closeTime.getDate() + 1);
				}
				else {
					break;
				}
			}
		}
	}
	
//	Mojo.Log.info("From time: " + startTime.getHours() + ":" + startTime.getMinutes() + " " + startTime.getDate() + "/" + (startTime.getMonth() + 1) + "/" + startTime.getFullYear() + ", To Time: " + closeTime.getHours() + ":" + closeTime.getMinutes() + " " + closeTime.getDate() + "/" + (closeTime.getMonth() + 1) + "/" + closeTime.getFullYear());
	
//	Mojo.Log.info("From timestamp: " + startTime.getTime() / 1000 + ", To timestamp: " + closeTime.getTime() / 1000);

	return {"curTime": curTime, "startTime": startTime, "closeTime": closeTime};
}

