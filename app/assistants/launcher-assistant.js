/*
 *    LauncherAssistant - The Actual Mode Launcher Scene
*/


function LauncherAssistant(event, startModes, closeMode) {
	/* This is the creator function for your scene assistant object. It will be passed all the 
	 * additional parameters (after the scene name) that were passed to pushScene. The reference
	 * to the scene controller (this.controller) has not be established yet, so any initialization
	 * that needs the scene controller should be done in the setup function below. 
	 */

	this.appControl = Mojo.Controller.getAppController();
	this.appAssistant = this.appControl.assistant;

	this.appid = this.appAssistant.appid;

	this.config = this.appAssistant.config;	

	this.event = event;
	
	this.start = startModes;
	this.close = closeMode;

	this.modeidx = 0;
}    

LauncherAssistant.prototype.setup = function() {
	/* This function is for setup tasks that have to happen when the scene is first created
	 * Use Mojo.View.render to render view templates and add them to the scene, if needed.
    * Setup widgets and add event handlers to listen to events from widgets here. 
    */

	// Buttons
	
	if(this.event == "start") {
		if(this.config.currentMode)
			this.modelStartButton = {label: "Switch Mode", buttonClass : 'affirmative popupbutton', disabled : false};
		else
			this.modelStartButton = {label: "Start Mode", buttonClass : 'affirmative popupbutton', disabled : false};
	}
   else
   	this.modelStartButton = {label: "Close Mode", buttonClass : 'affirmative popupbutton', disabled : false};
   	     
	this.controller.setupWidget('StartButton', {}, this.modelStartButton);

	Mojo.Event.listen(this.controller.get('StartButton'), Mojo.Event.tap, 
		this.handleStartButtonPress.bind(this));

   if(this.event == "start")
		this.modelSelectButton = {label: "Default Mode", buttonClass : 'popupbutton', disabled : false};
	else
		this.modelSelectButton = {label: this.config.currentMode.name, buttonClass : 'popupbutton', disabled : true};
  
   this.controller.setupWidget('SelectButton', {}, this.modelSelectButton);

	Mojo.Event.listen(this.controller.get('SelectButton'), Mojo.Event.tap, 
		this.handleSelectButtonPress.bind(this));
   
 	this.modelCancelButton = {label: "Cancel", buttonClass : 'negative popupbutton', disabled : false};

	this.controller.setupWidget('CancelButton', {}, this.modelCancelButton);

	Mojo.Event.listen(this.controller.get('CancelButton'), Mojo.Event.tap, 
		this.handleCancelButtonPress.bind(this));
	
	if(this.event == "start")
		this.setupStart();
	else
		this.setupClose();
}

LauncherAssistant.prototype.setupStart = function() {
	clearTimeout(this.timer);

	if(this.config.currentMode)
		this.modelStartButton.label = "Switch Mode";
	else
		this.modelStartButton.label = "Start Mode";
		
	this.controller.modelChanged(this.modelStartButton, this);

	this.counterCancel = this.config.modeSwitcher.timerStart;
	this.counterStart = this.config.modeSwitcher.timerStart;

	for(var i = 0 ; i < this.start.length ; i++)
	{
		if(this.start[i].autoStart == 2)
		{
			this.modeidx = i;

			this.modelSelectButton.label = this.start[i].name;
			this.controller.modelChanged(this.modelSelectButton, this);
	
			this.updateStartTimer();
			
			return;
		}
	}

	this.modelSelectButton.label = this.start[this.modeidx].name;
	this.controller.modelChanged(this.modelSelectButton, this);

	if(this.counterCancel > 0)
		this.updateCancelTimer();
	else {
		this.event = "cancel";			
		this.controller.window.close();
	}
}

LauncherAssistant.prototype.setupClose = function() {
	clearTimeout(this.timer);

	this.modelStartButton.label = "Close Mode";
		
	this.controller.modelChanged(this.modelStartButton, this);

	this.modelSelectButton.label = this.config.currentMode.name;
	
	this.controller.modelChanged(this.modelSelectButton, this);
	
	this.counterCancel = this.config.modeSwitcher.timerClose;
	this.counterClose = this.config.modeSwitcher.timerClose;

	if(this.config.currentMode.autoClose == 2)
	{
		this.updateCloseTimer();
		
		return;
	}

	if(this.counterCancel > 0)
		this.updateCancelTimer();
	else {
		this.event = "cancel";
		this.controller.window.close();
	}
}

LauncherAssistant.prototype.updateCancelTimer = function() {
	if(this.counterCancel >= 0) {
		this.modelCancelButton.label = "Cancel (" + this.counterCancel-- + ")";
		this.controller.modelChanged(this.modelCancelButton, this);
		
		this.timer = setTimeout(this.updateCancelTimer.bind(this), 1000);
	}
	else
		this.handleCancelButtonPress();
}

LauncherAssistant.prototype.updateStartTimer = function() {
	if(this.counterStart >= 0) {
		if(this.config.currentMode)
			this.modelStartButton.label = "Switch Mode (" + this.counterStart-- + ")";
		else
			this.modelStartButton.label = "Start Mode (" + this.counterStart-- + ")";
			
		this.controller.modelChanged(this.modelStartButton, this);
		
		this.timer = setTimeout(this.updateStartTimer.bind(this), 1000);
	}
	else
		this.handleStartButtonPress();
}

LauncherAssistant.prototype.updateCloseTimer = function() {
	if(this.counterClose >= 0) {
		this.modelStartButton.label = "Close Mode (" + this.counterClose-- + ")";
		this.controller.modelChanged(this.modelStartButton, this);
		
		this.timer = setTimeout(this.updateCloseTimer.bind(this), 1000);
	}
	else
		this.handleStartButtonPress();
}

LauncherAssistant.prototype.handleStartButtonPress = function() {
	clearTimeout(this.timer);

	this.controller.window.close();
}

LauncherAssistant.prototype.handleSelectButtonPress = function() {
	clearTimeout(this.timer);

	if(this.event == "start") {
		if(this.config.currentMode)
			this.modelStartButton.label = "Switch Mode";
		else
			this.modelStartButton.label = "Start Mode";
		
		this.controller.modelChanged(this.modelStartButton, this);

		this.modelCancelButton.label = "Cancel";
		this.controller.modelChanged(this.modelCancelButton, this);

		this.modeidx++;
	
		if(this.modeidx == this.start.length)
			this.modeidx = 0;

		this.modelSelectButton.label = this.start[this.modeidx].name;
		this.controller.modelChanged(this.modelSelectButton, this);
	}
}

LauncherAssistant.prototype.handleCancelButtonPress = function() {
	clearTimeout(this.timer);
	
	if((this.event == "start") && (this.close)) {
		// FIXME: There should be some effect so user notices easily this!

		this.event = "close";
	
		this.setupClose();
	}
	else {
		this.event = "cancel";
		
		this.controller.window.close();
	}
}

LauncherAssistant.prototype.activate = function(event) {
	/* Put in event handlers here that should only be in effect when this scene is active. 
	 *	For  example, key handlers that are observing the document. 
	 */
}
	
LauncherAssistant.prototype.deactivate = function(event) {
	/* Remove any event handlers you added in activate and do any other cleanup that should 
	 * happen before this scene is popped or another scene is pushed on top. 
	 */
}

LauncherAssistant.prototype.cleanup = function(event) {
	/* This function should do any cleanup needed before the scene is destroyed as a result
	 * of being popped off the scene stack.
	 */    

	if(this.event == "start") {
		this.controller.serviceRequest("palm://com.palm.applicationManager", { 'method': "launch",
			'parameters': {'id': this.appid, 'params': {
				'action': "execute", 'event': "start", 'name': this.start[this.modeidx].name}} });
	}
	else if(this.event == "close") {
		this.controller.serviceRequest("palm://com.palm.applicationManager", { 'method': "launch",
			'parameters': {'id': this.appid, 'params': {
				'action': "execute", 'event': "close", 'name': this.config.currentMode.name}} });
	}
}

