function IntervalConfig() {
	this.choicesForActivate = [
		{'label': "15 Minutes", 'value': 15}, {'label': "30 Minutes", 'value': 30}, 
		{'label': "1 Hour", 'value': 60}, {'label': "2 Hours", 'value': 120}, 
		{'label': "3 Hours", 'value': 180}, {'label': "4 Hours", 'value': 240}, 
		{'label': "5 Hours", 'value': 300}, {'label': "6 Hours", 'value': 360}, 
		{'label': "7 Hours", 'value': 420}, {'label': "8 Hours", 'value': 480}, 
		{'label': "9 Hours", 'value': 540}, {'label': "10 Hours", 'value': 600}, 
		{'label': "11 Hours", 'value': 660}, {'label': "12 Hours", 'value': 720},
		{'label': "24 Hours", 'value': 1440} ];
	
	this.choicesActivateSelector = [];
}

IntervalConfig.prototype.version = function() {
	return "1.1";
}

IntervalConfig.prototype.label = function() {
	return "Time Interval Trigger";
}

//

IntervalConfig.prototype.activate = function() {
}

IntervalConfig.prototype.deactivate = function() {
}

//

IntervalConfig.prototype.setup = function(sceneController) {
	this.controller = sceneController;

	this.choicesModeSelector = [
		{'label': "Repeating", 'value': 0},
		{'label': "No Repeating", 'value': 1} ];  

	sceneController.setupWidget("IntervalModeSelector", { 'label': "Mode", 
		'labelPlacement': "left", 'modelProperty': "intervalMode",
		'choices': this.choicesModeSelector});

	this.choicesActiveSelector = [
		{'label': "5 Minutes", 'value': 5}, {'label': "15 Minutes", 'value': 15},
		{'label': "30 Minutes", 'value': 30}, {'label': "1 Hour", 'value': 60},
		{'label': "2 Hours", 'value': 120}, {'label': "3 Hours", 'value': 180},
		{'label': "4 Hours", 'value': 240}, {'label': "5 Hours", 'value': 300},
		{'label': "6 Hours", 'value': 360}, {'label': "7 Hours", 'value': 420},
		{'label': "8 Hours", 'value': 480}, {'label': "9 Hours", 'value': 540},
		{'label': "10 Hours", 'value': 600}, {'label': "11 Hours", 'value': 660},
		{'label': "12 Hours", 'value': 600} ];  

	sceneController.setupWidget("IntervalActiveSelector", { 'label': "Active", 
		'labelPlacement': "left", 'modelProperty': "intervalActive",
		'choices': this.choicesActiveSelector});

	sceneController.setupWidget("IntervalActivateSelector", { 'label': "Every", 
		'labelPlacement': "left", 'modelProperty': "intervalActivate",
		'choices': this.choicesActivateSelector});
	
	// Listen for change event for mode selector
	
	sceneController.listen(sceneController.get("TriggersList"), Mojo.Event.propertyChange, 
		this.handleListChange.bind(this));
}

//

IntervalConfig.prototype.config = function() {
	this.choicesActivateSelector.clear();
	
	for(var i = 0; i < this.choicesForActivate.length; i++) {
		this.choicesActivateSelector.push(this.choicesForActivate[i]);
	}

	var triggerConfig = {
		'intervalMode': 0,
		'intervalActive': 5,
		'intervalActivate': 60,
		'intervalActiveRow': "",
		'intervalActivateDisplay': "block" };
	
	return triggerConfig;
}

//

IntervalConfig.prototype.load = function(triggerPreferences) {
	var display = "block";
	var row = "";

	if(triggerPreferences.intervalMode != 0) {
		var display = "none";
		var row = "last";
	}

	if(triggerPreferences.intervalMode == 0) {
		this.choicesActivateSelector.clear();
	
		for(var i = 0; i < this.choicesForActivate.length; i++) {
			if(this.choicesForActivate[i].value > triggerPreferences.intervalActive) {
				this.choicesActivateSelector.push(this.choicesForActivate[i]);
			}
		}
	}
					
	var triggerConfig = {
		'intervalMode': triggerPreferences.intervalMode,
		'intervalActive': triggerPreferences.intervalActive,
		'intervalActivate': triggerPreferences.intervalActivate,
		'intervalActiveRow': row,
		'intervalActivateDisplay': display };
	
	return triggerConfig;
}

IntervalConfig.prototype.save = function(triggerConfig) {
	var triggerPreferences = {
		'intervalMode': triggerConfig.intervalMode,
		'intervalActive': triggerConfig.intervalActive,
		'intervalActivate': triggerConfig.intervalActivate };
	
	return triggerPreferences;
}

//

IntervalConfig.prototype.handleListChange = function(changeEvent) {
	if((changeEvent.property == "intervalMode") || (changeEvent.property == "intervalActive")) {
		this.choicesActivateSelector.clear();
	
		for(var i = 0; i < this.choicesForActivate.length; i++) {
			if(this.choicesForActivate[i].value > changeEvent.model.intervalActive) {
				if(changeEvent.model.intervalActivate <= changeEvent.model.intervalActive)
					changeEvent.model.intervalActivate = this.choicesForActivate[i].value;
				
				this.choicesActivateSelector.push(this.choicesForActivate[i]);
			}
		}			
	}

	if(changeEvent.property == "intervalMode") {
		if(changeEvent.model.intervalMode == 0) {
			changeEvent.model.intervalActivateDisplay = "block";
			changeEvent.model.intervalActiveRow = "";
		}
		else {
			changeEvent.model.intervalActivateDisplay = "none";
			changeEvent.model.intervalActiveRow = "last";
		}
		
		var state = this.controller.get('mojo-scene-editmode-scene-scroller').mojo.getState();

		this.controller.get("TriggersList").mojo.invalidateItems(0);
		
		this.controller.get('mojo-scene-editmode-scene-scroller').mojo.setState(state);
	}
}

