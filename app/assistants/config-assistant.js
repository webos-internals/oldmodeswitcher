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

	this.applications = this.appAssistant.applications;

	this.settings = this.appAssistant.settings;
	
	this.activated = this.config.modeSwitcher.activated;
	
	this.edited = new Array();

	for(var i = 0; i < this.applications.length; i++) {
		this.applications[i].config.init();
	}
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

	this.modelActivatedButton = { value: this.config.modeSwitcher.activated, disabled: false };

	this.controller.setupWidget('ActivatedButton', 
		{falseValue: 0, falseLabel: "Off", trueValue: 1, trueLabel: "On"},
      this.modelActivatedButton);

	Mojo.Event.listen(this.controller.get('ActivatedButton'), 
		Mojo.Event.propertyChange, this.setConfigData.bind(this));

	// Auto start & close timer selectors
	
	this.choicesStartSelector = [
		{label: "5 Seconds", value: 5},
		{label: "10 Seconds", value: 10},
		{label: "15 Seconds", value: 15},
		{label: "20 Seconds", value: 20},
		{label: "25 Seconds", value: 25},
		{label: "30 Seconds", value: 30}];

	this.modelStartSelector = {value: this.config.modeSwitcher.timerStart, disabled: false};
	   
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
		
	this.modelCloseSelector = {value: this.config.modeSwitcher.timerClose, disabled: false};
	   
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
	
	this.modelModesList = {items: this.config.modesConfig};
	
	this.controller.setupWidget("ModesList", {
		itemTemplate: 'config/listitem-mode',
		swipeToDelete: true,
		autoconfirmDelete: false,
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
	
//
// Check for need of initial default mode setup
//

	if(this.config.defaultMode == null) {
		Mojo.Log.error("DEBUG: Mode Switcher Rerieving Settings");

		this.mode = {
			name: "Default Mode", type: "default",
			
			notifyMode: 1,	autoStart: 3, autoClose: 3,

			miscOnStartup: 0, miscAppsMode: 0,
			
			settings: {mode: 0, charging: 1}, settingsList: [],
			
			apps: {start:0, close: 0}, appsList: [],
			
			triggers: {block: 0, required: 1}, triggersList: []
		};

		this.modelDefModeButton.disabled = true;
		this.controller.modelChanged(this.modelDefModeButton, this);		

		this.controller.showAlertDialog({
			title: "Initial setup of Mode Switcher!",
			message: "<div align='justify'><i>Mode Switcher</i> needs to retrieve your current system settings for " +
						"<i>Default Mode</i>. This operation should only take few seconds to finish. You can modify " + 
						"the <i>Default Mode</i> afterwards by clicking the '<i>Edit Default Mode</i>' button.</div>",
			choices:[{label:'Continue', value:"ok", type:'default'}],
			preventCancel: true,
			allowHTMLMessage: true,
			onChoose: function(appControl, appAssistant, value) {
				Mojo.Log.info("Retrieving default settings from system");
			
				appControl.showBanner("Retrieving current system settings", {});

				this.retrieveDefaultSettings(0);
			}.bind(this, this.appControl, this.appAssistant)}); 
	}
}

//

ConfigAssistant.prototype.retrieveDefaultSettings = function(index, settings) {
	// Store settings from last round if returned by the extension.

	if((index > 0) && (settings != undefined)) {
		settings.extension = this.settings[index - 1].id;
		
		this.mode.settingsList.push(settings);
	}

	if(index < this.settings.length) {
		Mojo.Log.info("Retrieving " + this.settings[index].id + " settings");

		var callback = this.retrieveDefaultSettings.bind(this, index + 1);

		this.settings[index].setting.get(callback);
	}
	else {
		Mojo.Log.info("Retrieving of default settings done");

		this.appControl.showBanner("Retrieving system settings finished", {});

		this.modelDefModeButton.disabled = false;

		this.controller.modelChanged(this.modelDefModeButton, this);		

		this.appAssistant.config.defaultMode = this.mode;
		
		this.appAssistant.saveConfigData("defaultMode");
	}
}

//

ConfigAssistant.prototype.getConfigData = function() {
	this.config = this.appAssistant.config;

	this.modelActivatedButton.value = this.config.modeSwitcher.activated;
	this.modelStartSelector.value = this.config.modeSwitcher.timerStart;
	this.modelCloseSelector.value = this.config.modeSwitcher.timerClose;

	this.modelModesList.items = this.config.modesConfig;

	this.controller.modelChanged(this.modelActivatedButton, this);
	this.controller.modelChanged(this.modelStartSelector, this);
	this.controller.modelChanged(this.modelCloseSelector, this);

	this.controller.modelChanged(this.modelModesList, this);
}

ConfigAssistant.prototype.setConfigData = function() {
	this.appAssistant.config.modeSwitcher.activated = this.modelActivatedButton.value;
	this.appAssistant.config.modeSwitcher.timerStart = this.modelStartSelector.value;
	this.appAssistant.config.modeSwitcher.timerClose = this.modelCloseSelector.value;

	this.appAssistant.saveConfigData("modeSwitcher");
}

//

ConfigAssistant.prototype.handleModesListTap = function(event) {
	var index = event.model.items.indexOf(event.item);

	if (index >= 0) {
		this.edited.push(this.config.modesConfig[index].name);

		this.controller.stageController.pushScene("editmode", "custom", index);
	}
}

ConfigAssistant.prototype.handleModesListReorder = function(event) {
	var tempMode = this.modelModesList.items[event.fromIndex];
	
	this.modelModesList.items.splice(event.fromIndex,1);
	this.modelModesList.items.splice(event.toIndex,0,tempMode);

	this.appAssistant.modes = this.modelModesList.items;
	this.appAssistant.saveConfigData("modesConfig");
}

ConfigAssistant.prototype.handleRemoveModeFromList = function(event) {
	this.modelModesList.items.splice(event.index,1);

	this.appAssistant.modes = this.modelModesList.items;
	this.appAssistant.saveConfigData("modesConfig");
}

ConfigAssistant.prototype.handleAddModeButtonPress = function() {
	this.controller.stageController.pushScene("editmode", "custom");
}

ConfigAssistant.prototype.handleDefModeButtonPress = function() {
	this.edited.push("Default Mode");

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
		else if(event.command == "help") {
			window.open('http://wee.e-lnx.org/webos/help/modeswitcher.html');
		}
	}
}

//

ConfigAssistant.prototype.activate = function(event) {
	/* Put in event handlers here that should only be in effect when this scene is active. 
	 *	For  example, key handlers that are observing the document. 
	 */

	this.getConfigData();
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

	if((this.activated == 0) && (this.config.modeSwitcher.activated == 1)) {
		this.controller.serviceRequest("palm://com.palm.applicationManager", {
			method: 'launch', parameters: {"id": this.appAssistant.appid, "params": {
				"action": "control", "event": "init", "modes": this.edited}} });
	}
	else if((this.activated == 1) && (this.config.modeSwitcher.activated == 1)) {
		this.controller.serviceRequest("palm://com.palm.applicationManager", {
			method: 'launch',	parameters: {"id": this.appAssistant.appid, "params": {
				"action": "control", "event": "reload", "modes": this.edited}} });
	}
	else if((this.activated == 1) && (this.config.modeSwitcher.activated == 0)) {
		this.controller.serviceRequest("palm://com.palm.applicationManager", {
			method: 'launch',	parameters: {"id": this.appAssistant.appid, "params": {
				"action": "control", "event": "shutdown", "modes": this.edited}} });
	}
}

