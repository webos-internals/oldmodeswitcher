function TimeofdayConfig() {
}

//

TimeofdayConfig.prototype.label = function() {
	return "Time of Day Trigger";
}

//

TimeofdayConfig.prototype.setup = function(controller) {
	this.choicesTimeSelector = [
		{'label': "Every Day", 'value': 0},
		{'label': "Weekdays", 'value': 1},
		{'label': "Weekends", 'value': 2},
		{'label': "Custom", 'value': 3}];  

	controller.setupWidget("TimeSelector", { 'label': "Days", 
		'labelPlacement': "left", 'modelProperty': "timeoutDays",
		'choices': this.choicesTimeSelector});

	controller.setupWidget("DayCheckBoxMon", {'modelProperty': "timeoutDay1"});
	controller.setupWidget("DayCheckBoxTue", {'modelProperty': "timeoutDay2"});
	controller.setupWidget("DayCheckBoxWed", {'modelProperty': "timeoutDay3"});
	controller.setupWidget("DayCheckBoxThu", {'modelProperty': "timeoutDay4"});		
	controller.setupWidget("DayCheckBoxFri", {'modelProperty': "timeoutDay5"});
	controller.setupWidget("DayCheckBoxSat", {'modelProperty': "timeoutDay6"});
	controller.setupWidget("DayCheckBoxSun", {'modelProperty': "timeoutDay0"});		

	controller.setupWidget("StartTime", {'label': "Start", 
		'modelProperty': "timeoutStart"});

	controller.setupWidget("CloseTime", {'label': "Close", 
		'modelProperty': "timeoutClose"});
}

//

TimeofdayConfig.prototype.load = function(config, data) {
	var startDate = new Date(data.timeoutStart * 1000);
	var closeDate = new Date(data.timeoutClose * 1000);

	if(data.timeoutDays == 3)
		var display = "block";
	else
		var display = "none";

	config.push({"timeoutDays": data.timeoutDays, 
		"timeoutCustom": display,
		"timeoutDay0": data.timeoutCustom[0],
		"timeoutDay1": data.timeoutCustom[1],
		"timeoutDay2": data.timeoutCustom[2],
		"timeoutDay3": data.timeoutCustom[3],
		"timeoutDay4": data.timeoutCustom[4],
		"timeoutDay5": data.timeoutCustom[5],
		"timeoutDay6": data.timeoutCustom[6],
		"timeoutStart": startDate,
		"timeoutClose": closeDate});
}

TimeofdayConfig.prototype.save = function(config, data) {
	var days = new Array();

	for(var j = 0; j < 7; j++) {
		if(eval("config.timeoutDay" + j) == true)
			days.push(true);
		else
			days.push(false);
	}
	
	data.push({"timeoutDays": config.timeoutDays, 
		"timeoutCustom": days,
		"timeoutStart": config.timeoutStart.getTime() / 1000,
		"timeoutClose": config.timeoutClose.getTime() / 1000});
}

//

TimeofdayConfig.prototype.append = function(config, saveCallback) {
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

	config.push({"type": "timeofday", "timeoutDays": 0, "timeoutCustom": "none", "timeoutDay0": false, "timeoutDay1": false, "timeoutDay2": false, "timeoutDay3": false, "timeoutDay4": false, "timeoutDay5": false, "timeoutDay6": false, "timeoutStart": startTime, "timeoutClose": closeTime});

	saveCallback(true);
}

TimeofdayConfig.prototype.remove = function(config, index, saveCallback) {
	config.splice(index,1);
	
	saveCallback(true);
}

//

TimeofdayConfig.prototype.changed = function(config, event, saveCallback) {
	if(config.timeoutDays == 3)
		config.timeoutCustom = "block";
	else
		config.timeoutCustom = "none";

	saveCallback();
}

TimeofdayConfig.prototype.tapped = function(config, event, saveCallback) {
}

