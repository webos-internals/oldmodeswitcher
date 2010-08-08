function CalendarConfig() {
}

CalendarConfig.prototype.version = function() {
	return "1.1";
}

//

CalendarConfig.prototype.label = function() {
	return "Calendar Settings";
}

//

CalendarConfig.prototype.activate = function() {
}

CalendarConfig.prototype.deactivate = function() {
}

//

CalendarConfig.prototype.setup = function(controller) {
	this.controller = controller;

	this.choicesCalendarAlarmSelector = [
		{'label': controller.defaultChoiseLabel, 'value': -1},
		{'label': "Vibrate", 'value': 3},
		{'label': "System Sound", 'value': 1},
		{'label': "Ringtone", 'value': 2},
		{'label': "Mute", 'value': 0} ];  

	controller.setupWidget("CalendarAlarmSelector", {
		'label': "Reminder",	'labelPlacement': "left",
		'modelProperty': "calendarAlarm", 
		'choices': this.choicesCalendarAlarmSelector});

	this.choicesCalendarRingtoneSelector = [
		{'label': controller.defaultChoiseLabel, 'value': ""},
		{'label': "Select", 'value': "select"} ];  

	controller.setupWidget("CalendarRingtoneSelector", {'label': "Ringtone", 
		'labelPlacement': "left", 'modelProperty': "calendarRingtoneName",
		'choices': this.choicesCalendarRingtoneSelector});
		
	// Listen for change event for ringtone selector
	
	Mojo.Event.listen(controller.get("SettingsList"), Mojo.Event.propertyChange, 
		this.handleListChange.bind(this) );
}

//

CalendarConfig.prototype.config = function() {
	var config = {
		'calendarAlarm': -1,
		'calendarRingtoneName': "", 
		'calendarRingtonePath': "",
		'calendarAlarmRow': "single",
		'calendarRingtoneDisplay': "none" };
	
	return config;
}

//

CalendarConfig.prototype.load = function(preferences) {
	var config = this.config();
	
	if(preferences.calendarAlarm != undefined)
		config.calendarAlarm = preferences.calendarAlarm;

	if(preferences.calendarAlarm == 2) {
		config.calendarAlarmRow = "first";		
		config.calendarRingtoneDisplay = "block";
	}
			
	if(preferences.calendarRingtone != undefined) {
		config.calendarRingtoneName = preferences.calendarRingtone.name;
		config.calendarRingtonePath = preferences.calendarRingtone.path;
	}
	
	return config;
}

CalendarConfig.prototype.save = function(config) {
	var preferences = {};
	
	if(config.calendarAlarm != -1)
		preferences.calendarAlarm = config.calendarAlarm;
	
	if(config.calendarAlarm == 3) {	
		if(config.calendarRingtoneName.length != 0) {
			preferences.calendarRingtone = {
				'name': config.calendarRingtoneName,
				'path': config.calendarRingtonePath };
		}
	}
		
	return preferences;
}

//

CalendarConfig.prototype.handleListChange = function(event) {
	if(event.property == "calendarAlarm") {
		event.model.calendarAlarmRow = "single";		
		event.model.calendarRingtoneDisplay = "none";
		
		if(event.value == 2) {
			event.model.calendarAlarmRow = "first";		
			event.model.calendarRingtoneDisplay = "block";
		}
						
		var state = this.controller.get('mojo-scene-editmode-scene-scroller').mojo.getState();

		this.controller.get("SettingsList").mojo.invalidateItems(0);
		
		this.controller.get('mojo-scene-editmode-scene-scroller').mojo.setState(state);
	}
	else if(event.property == "calendarRingtoneName") {
		event.model.calendarRingtoneName = "";		
		event.model.calendarRingtonePath = "";		
		
		this.controller.modelChanged(event.model, this);

		if(event.value == "select") {
			this.executeRingtoneSelect(event.model);
		}
	}	
}

//

CalendarConfig.prototype.executeRingtoneSelect = function(config) {
	Mojo.FilePicker.pickFile({'defaultKind': "ringtone", 'kinds': ["ringtone"], 
		'actionType': "attach", 'actionName': "Done", 'onSelect': 
			function(config, payload) {
				config.calendarRingtoneName = payload.name;
				config.calendarRingtonePath = payload.fullPath;
				
				this.controller.modelChanged(config, this);	
			}.bind(this, config)},
		this.controller.stageController);
}

