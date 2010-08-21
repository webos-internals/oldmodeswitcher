function CaleventConfig() {
}

CaleventConfig.prototype.version = function() {
	return "1.1";
}

CaleventConfig.prototype.label = function() {
	return "Calendar Event Trigger";
}

//

CaleventConfig.prototype.activate = function() {
	this.controller.serviceRequest("palm://com.palm.calendar/", { 
		'method': "getCalendarsByAccount", 'parameters': {'subscribe': false}, 
		'onSuccess': this.handleCalendarAccounts.bind(this)});
}

CaleventConfig.prototype.deactivate = function() {
}

//

CaleventConfig.prototype.setup = function(sceneController) {
	this.controller = sceneController;

	this.choicesCaleventCalendarSelector = [
		{'label': "Any Calendar", 'value': 0} ];
		
	sceneController.setupWidget("CaleventCalendarSelector", {'label': "Calendar",
		'labelPlacement': "left", 'modelProperty': "caleventCalendar",
		'choices': this.choicesCaleventCalendarSelector});

	this.choicesCaleventMatchSelector = [
		{'label': "Match", 'value': 0},
		{'label': "No Match", 'value': 1} ];
		
	sceneController.setupWidget("CaleventMatchSelector", {'label': "Active On",
		'labelPlacement': "left", 'modelProperty': "caleventMode",
		'choices': this.choicesCaleventMatchSelector});

	sceneController.setupWidget("CaleventMatchText", {'hintText': "Text to Match in Events", 
		'multiline': false, 'enterSubmits': false, 'focus': true, 
		'textCase': Mojo.Widget.steModeLowerCase, 'modelProperty': "caleventMatch"}); 
}

//

CaleventConfig.prototype.config = function() {
	var triggerConfig = {
		'caleventCalendar': 0,
		'caleventMode': 0,
		'caleventMatch': "" };
	
	return triggerConfig;
}

//

CaleventConfig.prototype.load = function(triggerPreferences) {
	var triggerConfig = {
		'caleventCalendar': triggerPreferences.caleventCalendar,
		'caleventMode': triggerPreferences.caleventMode,
		'caleventMatch': triggerPreferences.caleventMatch };
	
	return triggerConfig;
}

CaleventConfig.prototype.save = function(triggerConfig) {
	var triggerPreferences = {
		'caleventCalendar': triggerConfig.caleventCalendar,
		'caleventMode': triggerConfig.caleventMode,
		'caleventMatch': triggerConfig.caleventMatch };
	
	return triggerPreferences;
}

//

CaleventConfig.prototype.handleCalendarAccounts = function(serviceResponse) {
	this.choicesCaleventCalendarSelector.clear();
	
	this.choicesCaleventCalendarSelector.push({'label': "Any Calendar", 'value': 0});

	for(var i = 0; i < serviceResponse.accounts.length; i++) {
		for(var j = 0; j < serviceResponse.accounts[i].calendars.length; j++) {
			this.choicesCaleventCalendarSelector.push({
				'label': serviceResponse.accounts[i].calendars[j].name, 
				'value': serviceResponse.accounts[i].calendars[j].id});
		}
	}
	
	var state = this.controller.get('mojo-scene-editmode-scene-scroller').mojo.getState();

	this.controller.get("TriggersList").mojo.invalidateItems(0);
	
	this.controller.get('mojo-scene-editmode-scene-scroller').mojo.setState(state);	
}

