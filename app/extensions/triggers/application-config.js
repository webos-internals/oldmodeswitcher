function ApplicationConfig() {
}

ApplicationConfig.prototype.version = function() {
	return "1.1";
}

ApplicationConfig.prototype.label = function() {
	return "Application Trigger";
}

//

ApplicationConfig.prototype.activate = function() {
}

ApplicationConfig.prototype.deactivate = function() {
}

//

ApplicationConfig.prototype.setup = function(controller) {
	this.controller = controller;

	this.choicesStateSelector = [
		{'label': "On Foreground", 'value': 0},
		{'label': "On Background", 'value': 1} ];  

	controller.setupWidget("ApplicationStateSelector", {'label': "State", 
		'labelPlacement': "left", 'modelProperty': "applicationState",
		'choices': this.choicesStateSelector});
	
	this.choicesApplicationSelector = [];  

	controller.setupWidget("ApplicationIdSelector", {'label': "Application", 
		'labelPlacement': "left", 'modelProperty': "applicationId",
		'choices': this.choicesApplicationSelector});

	this.choicesDelaySelector = [
		{'label': "15 Seconds", 'value': 15},
		{'label': "30 Seconds", 'value': 30},
		{'label': "60 Seconds", 'value': 60} ];  

	controller.setupWidget("ApplicationDelaySelector", {'label': "Delay", 
		'labelPlacement': "left", 'modelProperty': "applicationDelay",
		'choices': this.choicesDelaySelector});
		
	this.listApplications();
}

//

ApplicationConfig.prototype.config = function() {
	var config = {
		'applicationState': 0,
		'applicationId': this.choicesApplicationSelector[0].value,
		'applicationDelay': 15 };
	
	return config;
}

//

ApplicationConfig.prototype.load = function(preferences) {
	var config = {
		'applicationState': preferences.applicationState,
		'applicationId': preferences.applicationId,
		'applicationDelay': preferences.applicationDelay };
	
	return config;
}

ApplicationConfig.prototype.save = function(config) {
	var preferences = {
		'applicationState': config.applicationState,
		'applicationId': config.applicationId,
		'applicationDelay': config.applicationDelay };
	
	return preferences;
}

//

ApplicationConfig.prototype.listApplications = function() {
	this.controller.serviceRequest('palm://com.palm.applicationManager/', {
		'method': 'listLaunchPoints', 'parameters': {},
		'onSuccess': function(response) {
			var appItems = [];

			this.launchPoints = response.launchPoints;
				
			this.launchPoints.sort(this.sortAlphabeticallyFunction);
				
			this.launchPoints.each(function(item, index){
				this.choicesApplicationSelector.push({'label': item.title, 'value': item.id});
			}.bind(this));
			
			var state = this.controller.get('mojo-scene-editmode-scene-scroller').mojo.getState();

			this.controller.get("TriggersList").mojo.invalidateItems(0);
		
			this.controller.get('mojo-scene-editmode-scene-scroller').mojo.setState(state);		
		}.bind(this)});
}

ApplicationConfig.prototype.sortAlphabeticallyFunction = function(a,b){
	if(a.type != undefined) {
		var c = a.type.toLowerCase();
		var d = b.type.toLowerCase();
	}
	else {
		var c = a.title.toLowerCase();
		var d = b.title.toLowerCase();
	}
	
	return ((c < d) ? -1 : ((c > d) ? 1 : 0));
}

