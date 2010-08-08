function CaleventTrigger(ServiceRequestWrapper, SystemAlarmsWrapper) {
	this.service = ServiceRequestWrapper;
	this.alarms = SystemAlarmsWrapper;
	
	this.callback = null;
	this.initialized = false;

	this.config = null;
	this.enabled = false;
	
	this.events = new Array();
}

//

CaleventTrigger.prototype.init = function(callback) {
	this.callback = callback;

	this.initialized = false;

	this.subscribeCalendarEvents(false);
}

CaleventTrigger.prototype.shutdown = function() {
	this.initialized = false;

	this.events = new Array();

	if(this.subscribtionCalendarEvents)
		this.subscribtionCalendarEvents.cancel();
}


//

CaleventTrigger.prototype.enable = function(config) {
	this.config = config;
	
	this.enabled = true;

	this.subscribeCalendarEvents(true);
}

CaleventTrigger.prototype.disable = function() {
	this.enabled = false;

	// TODO: should cancel timers...

	if(this.subscribtionCalendarEvents)
		this.subscribtionCalendarEvents.cancel();
}

//

CaleventTrigger.prototype.check = function(config) {
	var date = new Date();	

	var regexp = new RegExp("/*" + config.caleventMatch + "*");

	for(var i = 0; i < this.events.length; i++) {
		if((this.events[i].subject.match(regexp) != null) || 
			(this.events[i].note.match(regexp) != null))
		{
			if((this.events[i].start <= date.getTime()) && 
				(this.events[i].end >= date.getTime()))
			{
				return true;
			}
		}
	}
	
	return false;
}

//

CaleventTrigger.prototype.execute = function(event, launchCallback) {
	Mojo.Log.info("Calevent trigger received: " + event);
	
	if(!this.enabled)
		return;
	
	if(event == "refresh") {
		if(this.subscribtionCalendarEvents)
			this.subscribtionCalendarEvents.cancel();
	
		this.subscribeCalendarEvents(true);
	}
	else {
		var startModes = new Array();
		var closeModes = new Array();
	
		for(var i = 0; i < this.config.modesConfig.length; i++) {
			for(var j = 0; j < this.config.modesConfig[i].triggersList.length; j++) {
				if(this.config.modesConfig[i].triggersList[j].extension == "calevent") {
					var text = this.config.modesConfig[i].triggersList[j].caleventMatch;
				
					var regexp = new RegExp("/*" + text + "*");

					for(var k = 0; k < this.events.length; k++) {
						if((this.events[k].subject.match(regexp) != null) || 
							(this.events[k].note.match(regexp) != null))
						{
							var sdate = new Date(this.events[k].start);
							var edate = new Date(this.events[k].end);

							sdate.setMilliseconds(0);
							edate.setMilliseconds(0);
						
							if((sdate.getTime() / 1000) == event)
								startModes.push(this.config.modesConfig[i]);
							
							if((edate.getTime() / 1000) == event)
								closeModes.push(this.config.modesConfig[i]);
						}
					}			
				}
			}
		}

		launchCallback(startModes, closeModes);
	}
}

//

CaleventTrigger.prototype.subscribeCalendarEvents = function(subscribe) {
	var date = new Date();
	
	this.subscribtionCalendarEvents = this.service.request("palm://com.palm.calendar/", { 
		'method': "getEvents", 'parameters': {'calendarId': "all", 
		'startDate': date.getTime(), 'endDate': date.getTime(), 'subscribe': subscribe}, 
		'onSuccess': this.handleCalendarEvents.bind(this),
		'onFailure': this.handleTriggerError.bind(this)});
}

CaleventTrigger.prototype.handleCalendarEvents = function(response) {
	var date = new Date();
	date.setDate(date.getDate() + 1);
	date.setHours(0);
	date.setMinutes(0);
	date.setSeconds(0);
	date.setMilliseconds(0);
	
	this.alarms.setupAlarmTimeout("calevent", date, "refresh");
				 				
	if(response.days != undefined) {
		response.days.each(function(day) {
			this.events = day.allDayEvents.concat(day.events);
		}, this);
			
		if(this.enabled) {
			for(var i = 0; i < this.config.modesConfig.length; i++) {
				for(var j = 0; j < this.config.modesConfig[i].triggersList.length; j++) {
					if(this.config.modesConfig[i].triggersList[j].extension == "calevent") {
						var text = this.config.modesConfig[i].triggersList[j].caleventMatch;
						var regexp = new RegExp("/*" + text + "*");

						for(var k = 0; k < this.events.length; k++) {
							if((this.events[k].subject.match(regexp) != null) || 
								(this.events[k].note.match(regexp) != null))
							{
								var date = new Date();

								var sdate = new Date(this.events[k].start);
								var edate = new Date(this.events[k].end);

								sdate.setMilliseconds(0);
								edate.setMilliseconds(0);
																
								if(sdate.getTime() >= date.getTime())
					 				this.alarms.setupAlarmTimeout("calevent", sdate, sdate.getTime() / 1000);

								if(edate.getTime() >= date.getTime())
					 				this.alarms.setupAlarmTimeout("calevent", edate, edate.getTime() / 1000);
							}
						}
					}
				}
			}
		}
	}

	if(!this.initialized) {
		this.initialized = true;
		this.callback(true);
		this.callback = null;
	}
}

CaleventTrigger.prototype.handleTriggerError = function(response) {
	if(this.callback) {
		this.callback(false);
		this.callback = null;
	}
}

