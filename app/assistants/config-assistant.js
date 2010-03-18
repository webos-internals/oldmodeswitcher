/*
 *    ConfigAssistant - Mode Launcher's Default Configuration Scene
 */

function ConfigAssistant() {
	/* This is the creator function for your scene assistant object. It will be passed all the 
	 * additional parameters (after the scene name) that were passed to pushScene. The reference
	 * to the scene controller (this.controller) has not be established yet, so any initialization
	 * that needs the scene controller should be done in the setup function below. 
	 */

	this.appControl = Mojo.Controller.getAppController();
	this.appAssistant = this.appControl.assistant;

	this.config = this.appAssistant.config;
	this.modes = this.appAssistant.modes;	
	
	this.curmode = this.appAssistant.curmode;
	this.defmode = this.appAssistant.defmode;
}    

ConfigAssistant.prototype.setup = function() {
	/* This function is for setup tasks that have to happen when the scene is first created
	 * Use Mojo.View.render to render view templates and add them to the scene, if needed.
    * Setup widgets and add event handlers to listen to events from widgets here. 
    */

	// Application menu
	
	this.controller.setupWidget(Mojo.Menu.appMenu, {omitDefaultItems: true},
		{visible: true, items: [ 
			{label: "Donate", command: 'donate'},
			{label: "Help", command: 'help'}]});
	
	// Activated toggle button

	this.modelActivatedButton = { value: this.config.activated, disabled: false };

	this.controller.setupWidget('ActivatedButton', 
		{falseValue: 0, falseLabel: "Off", trueValue: 1, trueLabel: "On"},
      this.modelActivatedButton);

	 Mojo.Event.listen(this.controller.get('ActivatedButton'), 
	 	Mojo.Event.propertyChange, this.handleActivatedToggle.bind(this));

	// Auto start & close timer selectors
	
	this.choicesStartSelector = [
		{label: "5 Seconds", value: 5},
		{label: "10 Seconds", value: 10},
		{label: "15 Seconds", value: 15},
		{label: "20 Seconds", value: 20},
		{label: "25 Seconds", value: 25},
		{label: "30 Seconds", value: 30}];

	this.modelStartSelector = {value: this.config.timerStart, disabled: false};
	   
	this.controller.setupWidget("StartSelector", {
		label: "Start Timer",
		labelPlacement: "left", 							
		choices: this.choicesStartSelector},
		this.modelStartSelector);

	this.choicesCloseSelector = [
		{label: "5 Seconds", value: 5},
		{label: "10 Seconds", value: 10},
		{label: "15 Seconds", value: 15},
		{label: "20 Seconds", value: 20},
		{label: "25 Seconds", value: 25},
		{label: "30 Seconds", value: 30}];
		
	this.modelCloseSelector = {value: this.config.timerClose, disabled: false};
	   
	this.controller.setupWidget("CloseSelector", {
		label: "Close Timer",
		labelPlacement: "left", 							
		choices: this.choicesCloseSelector},
		this.modelCloseSelector);
		
	Mojo.Event.listen(this.controller.get('StartSelector'), 
		Mojo.Event.propertyChange, this.setConfigData.bind(this));

	Mojo.Event.listen(this.controller.get('CloseSelector'), 
		Mojo.Event.propertyChange, this.setConfigData.bind(this));

	// Modes List
	
	this.modelModesList = {items: this.modes};
	
	this.controller.setupWidget("ModesList", {
		itemTemplate: 'config/listitem-mode',
		swipeToDelete: true,
		autoconfirmDelete: true,
		reorderable: true},
		this.modelModesList);
	
	this.handleModesListTap = this.handleModesListTap.bindAsEventListener(this);

	Mojo.Event.listen(this.controller.get('ModesList'), Mojo.Event.listTap, 
		this.handleModesListTap);
					
	Mojo.Event.listen(this.controller.get('ModesList'), Mojo.Event.listReorder, 
		this.handleModesListReorder.bind(this));

	Mojo.Event.listen(this.controller.get('ModesList'), Mojo.Event.listDelete, 
		this.handleRemoveModeFromList.bind(this));

	// Add custom mode button

	this.modelAddModeButton = {buttonClass: '', disabled: false};

	this.controller.setupWidget('AddModeButton', 
		{label: "Add Custom Mode"}, this.modelAddModeButton);
	
	Mojo.Event.listen(this.controller.get('AddModeButton'), Mojo.Event.tap, 
		this.handleAddModeButtonPress.bind(this));

	// Edit default mode button

	this.modelDefModeButton = {buttonClass: '', disabled: false};

	this.controller.setupWidget('DefModeButton', 
		{label: "Edit Default Mode"}, this.modelDefModeButton);
	
	Mojo.Event.listen(this.controller.get('DefModeButton'), Mojo.Event.tap, 
		this.handleDefModeButtonPress.bind(this));
	
	// Check for need of initial setup
	
	if(this.defmode == null) {
		this.controller.showAlertDialog({
			title: "Initial setup of Mode Switcher!",
			message: "<div align='justify'>In order to use Mode Switcher you need to configure a Default Mode. "+
						"When you press OK the Default Mode is created automatically with current system settings. " +
						"After you are done with the configuration use back gesture to get into Mode Switcher main view.</div>",
			choices:[{label:'Ok', value:"ok", type:'default'}],
			preventCancel: true,
			allowHTMLMessage: true,
			onChoose: function(value) {
				this.controller.stageController.pushScene("editmode", "default");
			}}); 
	}
}

//

ConfigAssistant.prototype.getConfigData = function() {
	this.config = this.appAssistant.config;

	this.modelActivatedButton.value = this.config.activated;
	this.modelStartSelector.value = this.config.timerStart;
	this.modelCloseSelector.value = this.config.timerClose;

	this.controller.modelChanged(this.modelActivatedButton, this);
	this.controller.modelChanged(this.modelStartSelector, this);
	this.controller.modelChanged(this.modelCloseSelector, this);
}

ConfigAssistant.prototype.setConfigData = function() {
	this.appAssistant.config.activated = this.modelActivatedButton.value;
	this.appAssistant.config.timerStart = this.modelStartSelector.value;
	this.appAssistant.config.timerClose = this.modelCloseSelector.value;

	this.appAssistant.saveConfigData("config");
}

//

ConfigAssistant.prototype.getModesData = function() {
	this.modes = this.appAssistant.modes;
	
	this.modelModesList.items = this.modes;

	this.controller.modelChanged(this.modelModesList, this);
}

ConfigAssistant.prototype.setModesData = function() {
	this.appAssistant.modes = this.modelModesList.items;
	
	this.appAssistant.saveConfigData("modes");
}

//

ConfigAssistant.prototype.handleActivatedToggle = function() {
	this.setConfigData();
}

ConfigAssistant.prototype.handleModesListTap = function(event) {
	var index = event.model.items.indexOf(event.item);

	if (index >= 0)
		this.controller.stageController.pushScene("editmode", "custom", index);
}

ConfigAssistant.prototype.handleModesListReorder = function(event) {
	var tempMode = this.modelModesList.items[event.fromIndex];
	
	this.modelModesList.items.splice(event.fromIndex,1);
	this.modelModesList.items.splice(event.toIndex,0,tempMode);

	this.setModesData();
}

ConfigAssistant.prototype.handleRemoveModeFromList = function(event) {
	this.modelModesList.items.splice(event.index,1);

	this.setModesData();
}

ConfigAssistant.prototype.handleAddModeButtonPress = function() {
	this.controller.stageController.pushScene("editmode", "custom");
}

ConfigAssistant.prototype.handleDefModeButtonPress = function() {
	this.controller.stageController.pushScene("editmode", "default", 0);
}

ConfigAssistant.prototype.handleCommand = function(event) {
	if(event.type == Mojo.Event.back) {
		this.controller.stageController.deactivate();		
	}
	else if(event.type == Mojo.Event.command) {
		if(event.command == "donate") {
			window.open('https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=7A4RPR9ZX3TYS&lc=FI&item_name=Mode%20Switcher%20Application&currency_code=EUR&bn=PP%2dDonationsBF%3abtn_donate_LG%2egif%3aNonHosted');
		}
	}
}

//

ConfigAssistant.prototype.activate = function(event) {
	/* Put in event handlers here that should only be in effect when this scene is active. 
	 *	For  example, key handlers that are observing the document. 
	 */

	this.getConfigData();
	this.getModesData();
}
	
ConfigAssistant.prototype.deactivate = function(event) {
	/* Remove any event handlers you added in activate and do any other cleanup that should 
	 * happen before this scene is popped or another scene is pushed on top. 
	 */
}

ConfigAssistant.prototype.cleanup = function(event) {
	/* This function should do any cleanup needed before the scene is destroyed as a result
	 * of being popped off the scene stack.
	 */ 

	var launchRequest = new Mojo.Service.Request("palm://com.palm.applicationManager", {
		method: 'launch',
		parameters: {"id": "com.palm.app.modeswitcher", "params": {
			"action": "startup", "event": "reload"}} });
}

