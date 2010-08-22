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

CalendarConfig.prototype.setup = function(sceneController) {
	this.controller = sceneController;

	this.choicesCalendarAlarmSelector = [
		{'label': sceneController.defaultChoiseLabel, 'value': -1},
		{'label': "Vibrate", 'value': 3},
		{'label': "System Sound", 'value': 1},
		{'label': "Ringtone", 'value': 2},
		{'label': "Mute", 'value': 0} ];  

	sceneController.setupWidget("CalendarAlarmSelector", {
		'label': "Reminder",	'labelPlacement': "left",
		'modelProperty': "calendarAlarm", 
		'choices': this.choicesCalendarAlarmSelector});

	this.choicesCalendarRingtoneSelector = [
		{'label': sceneController.defaultChoiseLabel, 'value': ""},
		{'label': "Select", 'value': "select"} ];  

	sceneController.setupWidget("CalendarRingtoneSelector", {'label': "Ringtone", 
		'labelPlacement': "left", 'modelProperty': "calendarRingtoneName",
		'choices': this.choicesCalendarRingtoneSelector});
		
	// Listen for change event for ringtone selector
	
	sceneController.listen(sceneController.get("SettingsList"), Mojo.Event.propertyChange, 
		this.handleListChange.bind(this) );
}

//

CalendarConfig.prototype.config = function() {
	var settingConfig = {
		'calendarAlarm': -1,
		'calendarRingtoneName': "", 
		'calendarRingtonePath': "",
		'calendarAlarmRow': "single",
		'calendarRingtoneDisplay': "none" };
	
	return settingConfig;
}

//

CalendarConfig.prototype.load = function(settingPreferences) {
	var settingConfig = this.config();
	
	if(settingPreferences.calendarAlarm != undefined)
		settingConfig.calendarAlarm = settingPreferences.calendarAlarm;

	if(settingPreferences.calendarAlarm == 2) {
		settingConfig.calendarAlarmRow = "first";		
		settingConfig.calendarRingtoneDisplay = "block";
	}
			
	if(settingPreferences.calendarRingtone != undefined) {
		settingConfig.calendarRingtoneName = settingPreferences.calendarRingtone.name;
		settingConfig.calendarRingtonePath = settingPreferences.calendarRingtone.path;
	}
	
	return settingConfig;
}

CalendarConfig.prototype.save = function(settingConfig) {
	var settingPreferences = {};
	
	if(settingConfig.calendarAlarm != -1)
		settingPreferences.calendarAlarm = settingConfig.calendarAlarm;
	
	if(settingConfig.calendarAlarm == 3) {	
		if(settingConfig.calendarRingtoneName.length != 0) {
			settingPreferences.calendarRingtone = {
				'name': settingConfig.calendarRingtoneName,
				'path': settingConfig.calendarRingtonePath };
		}
	}
		
	return settingPreferences;
}

//

CalendarConfig.prototype.handleListChange = function(changeEvent) {
	if(changeEvent.property == "calendarAlarm") {
		changeEvent.model.calendarAlarmRow = "single";		
		changeEvent.model.calendarRingtoneDisplay = "none";
		
		if(changeEvent.value == 2) {
			changeEvent.model.calendarAlarmRow = "first";		
			changeEvent.model.calendarRingtoneDisplay = "block";
		}
						
		var state = this.controller.get('mojo-scene-editmode-scene-scroller').mojo.getState();

		this.controller.get("SettingsList").mojo.invalidateItems(0);
		
		this.controller.get('mojo-scene-editmode-scene-scroller').mojo.setState(state);
	}
	else if(changeEvent.property == "calendarRingtoneName") {
		changeEvent.model.calendarRingtoneName = "";		
		changeEvent.model.calendarRingtonePath = "";		
		
		this.controller.modelChanged(changeEvent.model, this);

		if(changeEvent.value == "select") {
			this.executeRingtoneSelect(changeEvent.model);
		}
	}	
}

//

CalendarConfig.prototype.executeRingtoneSelect = function(eventModel) {
	Mojo.FilePicker.pickFile({'defaultKind': "ringtone", 'kinds': ["ringtone"], 
		'actionType': "attach", 'actionName': "Done", 'onSelect': 
			function(eventModel, serviceResponse) {
				eventModel.calendarRingtoneName = serviceResponse.name;
				eventModel.calendarRingtonePath = serviceResponse.fullPath;
				
				this.controller.modelChanged(eventModel, this);	
			}.bind(this, eventModel)},
		this.controller.stageController);
}

