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

CaleventConfig.prototype.setup = function(controller) {
	this.controller = controller;

	this.choicesCaleventCalendarSelector = [
		{'label': "Any Calendar", 'value': 0} ];
		
	controller.setupWidget("CaleventCalendarSelector", {'label': "Calendar",
		'labelPlacement': "left", 'modelProperty': "caleventCalendar",
		'choices': this.choicesCaleventCalendarSelector});

	this.choicesCaleventMatchSelector = [
		{'label': "Match", 'value': 0},
		{'label': "No Match", 'value': 1} ];
		
	controller.setupWidget("CaleventMatchSelector", {'label': "Active On",
		'labelPlacement': "left", 'modelProperty': "caleventMode",
		'choices': this.choicesCaleventMatchSelector});

	controller.setupWidget("CaleventMatchText", {'hintText': "Text to Match in Events", 
		'multiline': false, 'enterSubmits': false, 'focus': true, 
		'textCase': Mojo.Widget.steModeLowerCase, 'modelProperty': "caleventMatch"}); 
}

//

CaleventConfig.prototype.config = function() {
	var config = {
		'caleventCalendar': 0,
		'caleventMode': 0,
		'caleventMatch': "" };
	
	return config;
}

//

CaleventConfig.prototype.load = function(preferences) {
	var config = {
		'caleventCalendar': preferences.caleventCalendar,
		'caleventMode': preferences.caleventMode,
		'caleventMatch': preferences.caleventMatch };
	
	return config;
}

CaleventConfig.prototype.save = function(config) {
	var preferences = {
		'caleventCalendar': config.caleventCalendar,
		'caleventMode': config.caleventMode,
		'caleventMatch': config.caleventMatch };
	
	return preferences;
}

//

CaleventConfig.prototype.handleCalendarAccounts = function(response) {
	this.choicesCaleventCalendarSelector.clear();
	
	this.choicesCaleventCalendarSelector.push({'label': "Any Calendar", 'value': 0});

	for(var i = 0; i < response.accounts.length; i++) {
		for(var j = 0; j < response.accounts[i].calendars.length; j++) {
			this.choicesCaleventCalendarSelector.push({
				'label': response.accounts[i].calendars[j].name, 
				'value': response.accounts[i].calendars[j].id});
		}
	}
	
	var state = this.controller.get('mojo-scene-editmode-scene-scroller').mojo.getState();

	this.controller.get("TriggersList").mojo.invalidateItems(0);
	
	this.controller.get('mojo-scene-editmode-scene-scroller').mojo.setState(state);	
}

