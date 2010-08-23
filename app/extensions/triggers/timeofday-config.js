function TimeofdayConfig() {
}

TimeofdayConfig.prototype.version = function() {
	return "1.1";
}

TimeofdayConfig.prototype.label = function() {
	return $L("Time of Day Trigger");
}

//

TimeofdayConfig.prototype.activate = function() {
}

TimeofdayConfig.prototype.deactivate = function() {
}

//

TimeofdayConfig.prototype.setup = function(sceneController) {
	this.controller = sceneController;

	this.choicesTimeSelector = [
		{'label': $L("Every Day"), 'value': 0},
		{'label': $L("Weekdays"), 'value': 1},
		{'label': $L("Weekends"), 'value': 2},
		{'label': $L("Custom"), 'value': 3} ];  

	sceneController.setupWidget("TimeofdayTimeSelector", { 'label': $L("Days"), 
		'labelPlacement': "left", 'modelProperty': "timeofdayDays",
		'choices': this.choicesTimeSelector});

	sceneController.setupWidget("DayCheckBoxMon", {'modelProperty': "timeofdayDay1"});
	sceneController.setupWidget("DayCheckBoxTue", {'modelProperty': "timeofdayDay2"});
	sceneController.setupWidget("DayCheckBoxWed", {'modelProperty': "timeofdayDay3"});
	sceneController.setupWidget("DayCheckBoxThu", {'modelProperty': "timeofdayDay4"});		
	sceneController.setupWidget("DayCheckBoxFri", {'modelProperty': "timeofdayDay5"});
	sceneController.setupWidget("DayCheckBoxSat", {'modelProperty': "timeofdayDay6"});
	sceneController.setupWidget("DayCheckBoxSun", {'modelProperty': "timeofdayDay0"});		

	sceneController.setupWidget("TimeofdayStartTime", {'label': $L("Start"), 
		'modelProperty': "timeofdayStart"});

	sceneController.setupWidget("TimeofdayCloseTime", {'label': $L("Close"), 
		'modelProperty': "timeofdayClose"});
	
	// Listen for change event for day selector
	
	sceneController.listen(sceneController.get("TriggersList"), Mojo.Event.propertyChange, 
		this.handleListChange.bind(this));
}

//

TimeofdayConfig.prototype.config = function() {
	var startTime = new Date();
	var closeTime = new Date();

	startTime.setHours(0);
	startTime.setMinutes(0);
	startTime.setSeconds(0);
	startTime.setMilliseconds(0);

	closeTime.setHours(0);
	closeTime.setMinutes(0);
	closeTime.setSeconds(0);
	closeTime.setMilliseconds(0);

	var triggerConfig = {
		'timeofdayMon': $L("Mon"),
		'timeofdayTue': $L("Tue"),
		'timeofdayWed': $L("Wed"),
		'timeofdayThu': $L("Thu"),
		'timeofdayFri': $L("Fri"),
		'timeofdaySat': $L("Sat"),
		'timeofdaySun': $L("Sun"),
		'timeofdayTitle': $L("Time of Day"),
		'timeofdayDays': 0,
		'timeofdayCustom': "none",
		'timeofdayDay0': false,
		'timeofdayDay1': false,
		'timeofdayDay2': false,
		'timeofdayDay3': false,
		'timeofdayDay4': false,
		'timeofdayDay5': false,
		'timeofdayDay6': false,
		'timeofdayStart': startTime,
		'timeofdayClose': closeTime };
	
	return triggerConfig;
}

//

TimeofdayConfig.prototype.load = function(triggerPreferences) {
	var startDate = new Date(triggerPreferences.timeofdayStart * 1000);
	var closeDate = new Date(triggerPreferences.timeofdayClose * 1000);

	if(triggerPreferences.timeofdayDays == 3)
		var display = "block";
	else
		var display = "none";

	var triggerConfig = {
		'timeofdayMon': $L("Mon"),
		'timeofdayTue': $L("Tue"),
		'timeofdayWed': $L("Wed"),
		'timeofdayThu': $L("Thu"),
		'timeofdayFri': $L("Fri"),
		'timeofdaySat': $L("Sat"),
		'timeofdaySun': $L("Sun"),
		'timeofdayTitle': $L("Time of Day"),
		'timeofdayCustom': display,
		'timeofdayDays': triggerPreferences.timeofdayDays,
		'timeofdayDay0': triggerPreferences.timeofdayCustom[0],
		'timeofdayDay1': triggerPreferences.timeofdayCustom[1],
		'timeofdayDay2': triggerPreferences.timeofdayCustom[2],
		'timeofdayDay3': triggerPreferences.timeofdayCustom[3],
		'timeofdayDay4': triggerPreferences.timeofdayCustom[4],
		'timeofdayDay5': triggerPreferences.timeofdayCustom[5],
		'timeofdayDay6': triggerPreferences.timeofdayCustom[6],
		'timeofdayStart': startDate,
		'timeofdayClose': closeDate };
	
	return triggerConfig;
}

TimeofdayConfig.prototype.save = function(triggerConfig) {
	var days = new Array();

	for(var j = 0; j < 7; j++) {
		if(eval("triggerConfig.timeofdayDay" + j) == true)
			days.push(true);
		else
			days.push(false);
	}

	var triggerPreferences = {
		'timeofdayDays': triggerConfig.timeofdayDays,
		'timeofdayCustom': days,
		'timeofdayStart': triggerConfig.timeofdayStart.getTime() / 1000,
		'timeofdayClose': triggerConfig.timeofdayClose.getTime() / 1000 };
	
	return triggerPreferences;
}

//

TimeofdayConfig.prototype.handleListChange = function(changeEvent) {
	if(changeEvent.property == "timeofdayDays") {
		if(changeEvent.model.timeofdayDays == 3)
			changeEvent.model.timeofdayCustom = "block";
		else
			changeEvent.model.timeofdayCustom = "none";
	
		var state = this.controller.get('mojo-scene-editmode-scene-scroller').mojo.getState();

		this.controller.get("TriggersList").mojo.invalidateItems(0);
		
		this.controller.get('mojo-scene-editmode-scene-scroller').mojo.setState(state);
	}
}

