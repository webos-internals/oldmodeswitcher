function CalendarConfig() {
}

CalendarConfig.prototype.version = function() {
	return "1.0";
}

//

CalendarConfig.prototype.label = function() {
	return "Calendar Settings";
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
		'calendarRingtonePath': "" };
	
	return config;
}

//

CalendarConfig.prototype.load = function(preferences) {
	var config = this.config();
	
	if(preferences.calendarAlarm != undefined)
		config.calendarAlarm = preferences.calendarAlarm;
	
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
	
	if(config.calendarRingtoneName.length != 0) {
		preferences.calendarRingtone = {
			'name': config.calendarRingtoneName,
			'path': config.calendarRingtonePath };
	}
	
	return preferences;
}

//

CalendarConfig.prototype.handleListChange = function(event) {
	if(event.property == "calendarRingtoneName") {
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

