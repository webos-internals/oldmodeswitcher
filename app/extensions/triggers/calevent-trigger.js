function CaleventTrigger(Config, Control) {
	this.config = Config;
	
	this.service = Control.service;
	this.alarms = Control.alarms;

	this.initialized = false;
		
	this.startupCallback = null;
	this.executeCallback = null;

	this.calEvents = new Array();
	
	this.sysTimeouts = new Array();
}

//

CaleventTrigger.prototype.init = function(startupCallback) {
	this.initialized = false;

	this.startupCallback = startupCallback;

	this.subscribeCalendarEvents(false);
}

CaleventTrigger.prototype.shutdown = function() {
	this.initialized = false;

	this.startupCallback = null;

	this.calEvents = new Array();
}

//

CaleventTrigger.prototype.enable = function(executeCallback) {
	this.executeCallback = executeCallback;
	
	var date = new Date();
	date.setDate(date.getDate() + 1);
	date.setHours(0);
	date.setMinutes(0);
	date.setSeconds(0);
	date.setMilliseconds(0);

	this.sysTimeouts.push(date.getTime() / 1000);
	
	this.alarms.setupAlarmTimeout("calevent", date, {'refresh': true});

	this.subscribeCalendarEvents(true);
}

CaleventTrigger.prototype.disable = function() {
	this.executeCallback = null;
	
	for(var i = 0; i < this.sysTimeouts.length; i++) {
		var date = new Date(this.sysTimeouts[i] * 1000);

		this.alarms.clearAlarmTimeout("calevent", date);
	}
	
	this.sysTimeouts.clear();

	if(this.subscribtionCalendarEvents)
		this.subscribtionCalendarEvents.cancel();
}

//

CaleventTrigger.prototype.check = function(triggerConfig, modeName) {
	var date = new Date();	

	date.setMilliseconds(0);

	if(triggerConfig.caleventMatch.length > 0)
		var regexp = new RegExp("/*" + triggerConfig.caleventMatch + "*", "i");

	for(var i = 0; i < this.calEvents.length; i++) {
		if((triggerConfig.caleventCalendar == 0) || 
			("id" + triggerConfig.caleventCalendar == this.calEvents[i].calendarId))
		{
			var sdate = new Date(this.calEvents[i].start);
			var edate = new Date(this.calEvents[i].end);

			sdate.setMilliseconds(0);
			edate.setMilliseconds(0);

			if((sdate.getTime() <= date.getTime()) && 
				(edate.getTime() > date.getTime()))
			{
				if(((triggerConfig.caleventMode == 0) && ((triggerConfig.caleventMatch.length == 0) || 
					((this.calEvents[i].subject) && (this.calEvents[i].subject.match(regexp) != null)) || 
					((this.calEvents[i].location) && (this.calEvents[i].location.match(regexp) != null)) || 
					((this.calEvents[i].note) && (this.calEvents[i].note.match(regexp) != null)))) ||
					((triggerConfig.caleventMode == 1) && ((triggerConfig.caleventMatch.length == 0) || 
					(((!this.calEvents[i].subject) || (this.calEvents[i].subject.match(regexp) == null)) && 
					((!this.calEvents[i].location) || (this.calEvents[i].location.match(regexp) == null)) && 
					((!this.calEvents[i].note) || (this.calEvents[i].note.match(regexp) == null))))))
				{
					return true;
				}
			}
		}
	}
	
	return false;
}

//

CaleventTrigger.prototype.execute = function(triggerData, manualLaunch) {
	Mojo.Log.error("Calevent trigger received: " + Object.toJSON(triggerData));
	
	if(triggerData.refresh) {
		var date = new Date();
		date.setDate(date.getDate() + 1);
		date.setHours(0);
		date.setMinutes(0);
		date.setSeconds(0);
		date.setMilliseconds(0);
	
		this.sysTimeouts[0] = date.getTime() / 1000;
	
		this.alarms.setupAlarmTimeout("calevent", date, {'refresh': true});

		if(this.subscribtionCalendarEvents)
			this.subscribtionCalendarEvents.cancel();
	
		this.subscribeCalendarEvents(true);
	}
	else if(triggerData.timestamp) {
		var index = this.sysTimeouts.indexOf(triggerData.timestamp);
		
		if(index != -1)
			this.sysTimeouts.splice(index, 1);
	
		var startModes = new Array();
		var closeModes = new Array();
	
		for(var i = 0; i < this.config.modesConfig.length; i++) {
			for(var j = 0; j < this.config.modesConfig[i].triggersList.length; j++) {
				if(this.config.modesConfig[i].triggersList[j].extension == "calevent") {
					var text = this.config.modesConfig[i].triggersList[j].caleventMatch;
				
					if(text.length > 0)
						var regexp = new RegExp("/*" + text + "*", "i");

					for(var k = 0; k < this.calEvents.length; k++) {
						if((this.config.modesConfig[i].triggersList[j].caleventCalendar == 0) ||
							("id" + this.config.modesConfig[i].triggersList[j].caleventCalendar == this.calEvents[k].calendarId))
						{
							if(((this.config.modesConfig[i].triggersList[j].caleventMode == 0) && ((text.length == 0) || 
								((this.calEvents[k].subject) && (this.calEvents[k].subject.match(regexp) != null)) || 
								((this.calEvents[k].location) && (this.calEvents[k].location.match(regexp) != null)) ||
								((this.calEvents[k].note) && (this.calEvents[k].note.match(regexp) != null)))) ||
								((this.config.modesConfig[i].triggersList[j].caleventMode == 1) && ((text.length == 0) || 
								(((!this.calEvents[k].subject) || (this.calEvents[k].subject.match(regexp) == null)) && 
								((!this.calEvents[k].location) || (this.calEvents[k].location.match(regexp) == null)) &&
								((!this.calEvents[k].note) || (this.calEvents[k].note.match(regexp) == null))))))
							{
								var sdate = new Date(this.calEvents[k].start);
								var edate = new Date(this.calEvents[k].end);

								sdate.setMilliseconds(0);
								edate.setMilliseconds(0);
						
								if((this.config.modesConfig[i].name != this.config.currentMode.name) &&
									(this.config.modifierModes.indexOf(this.config.modesConfig[i].name) == -1))
								{
									if((sdate.getTime() / 1000) == triggerData.timestamp) {
										if(this.check(this.config.modesConfig[i].triggersList[j])) {
											startModes.push(this.config.modesConfig[i]);
											break;
										}
									}
								}
								else {
									if((edate.getTime() / 1000) == triggerData.timestamp) {
										if(!this.check(this.config.modesConfig[i].triggersList[j])) {
											closeModes.push(this.config.modesConfig[i]);
											break;
										}
									}
								}
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

CaleventTrigger.prototype.subscribeCalendarEvents = function(subscribeRequest) {
	var date = new Date();
	
	this.subscribtionCalendarEvents = this.service.request("palm://com.palm.calendar/", { 
		'method': "getEvents", 'parameters': {'calendarId': "all", 
		'startDate': date.getTime(), 'endDate': date.getTime(), 'subscribe': subscribeRequest}, 
		'onSuccess': this.handleCalendarEvents.bind(this),
		'onFailure': this.handleTriggerError.bind(this)});
}

CaleventTrigger.prototype.handleCalendarEvents = function(serviceResponse) {
	if(serviceResponse.days != undefined) {
		serviceResponse.days.each(function(day) {
			this.calEvents = day.allDayEvents.concat(day.events);
		}, this);
			
		for(var i = 0; i < this.config.modesConfig.length; i++) {
			for(var j = 0; j < this.config.modesConfig[i].triggersList.length; j++) {
				if(this.config.modesConfig[i].triggersList[j].extension == "calevent") {
					var text = this.config.modesConfig[i].triggersList[j].caleventMatch;

					if(text.length > 0)
						var regexp = new RegExp("/*" + text + "*", "i");

					for(var k = 0; k < this.calEvents.length; k++) {
						if((this.config.modesConfig[i].triggersList[j].caleventCalendar == 0) ||
							("id" + this.config.modesConfig[i].triggersList[j].caleventCalendar == this.calEvents[k].calendarId))
						{
							if(((this.config.modesConfig[i].triggersList[j].caleventMode == 0) && 
								((text.length == 0) || 
								((this.calEvents[k].subject) && (this.calEvents[k].subject.match(regexp) != null)) || 
								((this.calEvents[k].location) && (this.calEvents[k].location.match(regexp) != null)) ||
								((this.calEvents[k].note) && (this.calEvents[k].note.match(regexp) != null)))) ||
								((this.config.modesConfig[i].triggersList[j].caleventMode == 1) && 
								((text.length == 0) || 
								(((!this.calEvents[k].subject) || (this.calEvents[k].subject.match(regexp) == null)) && 
								((!this.calEvents[k].location) || (this.calEvents[k].location.match(regexp) == null)) &&
								((!this.calEvents[k].note) || (this.calEvents[k].note.match(regexp) == null))))))
							{
								var date = new Date();

								date.setMilliseconds(0);

								var sdate = new Date(this.calEvents[k].start);
								var edate = new Date(this.calEvents[k].end);

								sdate.setMilliseconds(0);
								edate.setMilliseconds(0);
															
								if(sdate.getTime() >= date.getTime()) {
									if(this.sysTimeouts.indexOf(sdate.getTime() / 1000) == -1)
										this.sysTimeouts.push(sdate.getTime() / 1000);
									
					 				this.alarms.setupAlarmTimeout("calevent", sdate, {'timestamp': sdate.getTime() / 1000});
								}
								
								if(edate.getTime() >= date.getTime()) {
									if(this.sysTimeouts.indexOf(edate.getTime() / 1000) == -1)
										this.sysTimeouts.push(edate.getTime() / 1000);
									
					 				this.alarms.setupAlarmTimeout("calevent", edate, {'timestamp': edate.getTime() / 1000});
								}
							}
						}
					}
				}
			}
		}
	}

	if(!this.initialized) {
		this.initialized = true;
		this.startupCallback(true);
		this.startupCallback = null;
	}
}

//

CaleventTrigger.prototype.handleTriggerError = function(serviceResponse) {
	if(this.startupCallback) {
		this.startupCallback(false);
		this.startupCallback = null;
	}
}

