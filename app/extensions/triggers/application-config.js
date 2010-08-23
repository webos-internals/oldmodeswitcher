function ApplicationConfig() {
}

ApplicationConfig.prototype.version = function() {
	return "1.1";
}

ApplicationConfig.prototype.label = function() {
	return $L("Application Trigger");
}

//

ApplicationConfig.prototype.activate = function() {
}

ApplicationConfig.prototype.deactivate = function() {
}

//

ApplicationConfig.prototype.setup = function(sceneController) {
	this.controller = sceneController;

	this.choicesStateSelector = [
		{'label': $L("On Foreground"), 'value': 0},
		{'label': $L("On Background"), 'value': 1} ];  

	this.controller.setupWidget("ApplicationStateSelector", {'label': $L("State"), 
		'labelPlacement': "left", 'modelProperty': "applicationState",
		'choices': this.choicesStateSelector});
	
	this.choicesApplicationSelector = [];  

	this.controller.setupWidget("ApplicationIdSelector", {'label': $L("Application"), 
		'labelPlacement': "left", 'modelProperty': "applicationId",
		'choices': this.choicesApplicationSelector});

	this.choicesDelaySelector = [
		{'label': "15 " + $L("Seconds"), 'value': 15},
		{'label': "30 " + $L("Seconds"), 'value': 30},
		{'label': "60 " + $L("Seconds"), 'value': 60} ];  

	this.controller.setupWidget("ApplicationDelaySelector", {'label': $L("Delay"), 
		'labelPlacement': "left", 'modelProperty': "applicationDelay",
		'choices': this.choicesDelaySelector});
		
	this.listApplications();
}

//

ApplicationConfig.prototype.config = function() {
	var triggerConfig = {
		'applicationTitle': $L("Application"),
		'applicationState': 0,
		'applicationId': this.choicesApplicationSelector[0].value,
		'applicationDelay': 15 };
	
	return triggerConfig;
}

//

ApplicationConfig.prototype.load = function(triggerPreferences) {
	var triggerConfig = {
		'applicationTitle': $L("Application"),
		'applicationState': triggerPreferences.applicationState,
		'applicationId': triggerPreferences.applicationId,
		'applicationDelay': triggerPreferences.applicationDelay };
	
	return triggerConfig;
}

ApplicationConfig.prototype.save = function(triggerConfig) {
	var triggerPreferences = {
		'applicationState': triggerConfig.applicationState,
		'applicationId': triggerConfig.applicationId,
		'applicationDelay': triggerConfig.applicationDelay };
	
	return triggerPreferences;
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
				this.choicesApplicationSelector.push({'label': item.title, 'value': item.appId});
			}.bind(this));
			
			var state = this.controller.get('mojo-scene-editmode-scene-scroller').mojo.getState();

			this.controller.get("TriggersList").mojo.invalidateItems(0);
		
			this.controller.get('mojo-scene-editmode-scene-scroller').mojo.setState(state);		
		}.bind(this)});
}

ApplicationConfig.prototype.sortAlphabeticallyFunction = function(compareA, compareB){
	if(compareA.type != undefined) {
		var a = compareA.type.toLowerCase();
		var b = compareB.type.toLowerCase();
	}
	else {
		var a = compareA.title.toLowerCase();
		var b = compareB.title.toLowerCase();
	}
	
	return ((a < b) ? -1 : ((a > b) ? 1 : 0));
}

