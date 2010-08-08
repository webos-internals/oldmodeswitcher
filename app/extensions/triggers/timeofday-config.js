function TimeofdayConfig() {
}

TimeofdayConfig.prototype.version = function() {
	return "1.1";
}

TimeofdayConfig.prototype.label = function() {
	return "Time of Day Trigger";
}

//

TimeofdayConfig.prototype.activate = function() {
}

TimeofdayConfig.prototype.deactivate = function() {
}

//

TimeofdayConfig.prototype.setup = function(controller) {
	this.controller = controller;

	this.choicesTimeSelector = [
		{'label': "Every Day", 'value': 0},
		{'label': "Weekdays", 'value': 1},
		{'label': "Weekends", 'value': 2},
		{'label': "Custom", 'value': 3} ];  

	controller.setupWidget("TimeofdayTimeSelector", { 'label': "Days", 
		'labelPlacement': "left", 'modelProperty': "timeofdayDays",
		'choices': this.choicesTimeSelector});

	controller.setupWidget("DayCheckBoxMon", {'modelProperty': "timeofdayDay1"});
	controller.setupWidget("DayCheckBoxTue", {'modelProperty': "timeofdayDay2"});
	controller.setupWidget("DayCheckBoxWed", {'modelProperty': "timeofdayDay3"});
	controller.setupWidget("DayCheckBoxThu", {'modelProperty': "timeofdayDay4"});		
	controller.setupWidget("DayCheckBoxFri", {'modelProperty': "timeofdayDay5"});
	controller.setupWidget("DayCheckBoxSat", {'modelProperty': "timeofdayDay6"});
	controller.setupWidget("DayCheckBoxSun", {'modelProperty': "timeofdayDay0"});		

	controller.setupWidget("TimeofdayStartTime", {'label': "Start", 
		'modelProperty': "timeofdayStart"});

	controller.setupWidget("TimeofdayCloseTime", {'label': "Close", 
		'modelProperty': "timeofdayClose"});
	
	// Listen for change event for day selector
	
	Mojo.Event.listen(controller.get("TriggersList"), Mojo.Event.propertyChange, 
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

	var config = {
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
	
	return config;
}

//

TimeofdayConfig.prototype.load = function(preferences) {
	var startDate = new Date(preferences.timeofdayStart * 1000);
	var closeDate = new Date(preferences.timeofdayClose * 1000);

	if(preferences.timeofdayDays == 3)
		var display = "block";
	else
		var display = "none";

	var config = {
		'timeofdayCustom': display,
		'timeofdayDays': preferences.timeofdayDays,
		'timeofdayDay0': preferences.timeofdayCustom[0],
		'timeofdayDay1': preferences.timeofdayCustom[1],
		'timeofdayDay2': preferences.timeofdayCustom[2],
		'timeofdayDay3': preferences.timeofdayCustom[3],
		'timeofdayDay4': preferences.timeofdayCustom[4],
		'timeofdayDay5': preferences.timeofdayCustom[5],
		'timeofdayDay6': preferences.timeofdayCustom[6],
		'timeofdayStart': startDate,
		'timeofdayClose': closeDate };
	
	return config;
}

TimeofdayConfig.prototype.save = function(config) {
	var days = new Array();

	for(var j = 0; j < 7; j++) {
		if(eval("config.timeofdayDay" + j) == true)
			days.push(true);
		else
			days.push(false);
	}

	var preferences = {
		'timeofdayDays': config.timeofdayDays,
		'timeofdayCustom': days,
		'timeofdayStart': config.timeofdayStart.getTime() / 1000,
		'timeofdayClose': config.timeofdayClose.getTime() / 1000 };
	
	return preferences;
}

//

TimeofdayConfig.prototype.handleListChange = function(event) {
	if(event.property == "timeofdayDays") {
		if(event.model.timeofdayDays == 3)
			event.model.timeofdayCustom = "block";
		else
			event.model.timeofdayCustom = "none";
	
		var state = this.controller.get('mojo-scene-editmode-scene-scroller').mojo.getState();

		this.controller.get("TriggersList").mojo.invalidateItems(0);
		
		this.controller.get('mojo-scene-editmode-scene-scroller').mojo.setState(state);
	}
}

