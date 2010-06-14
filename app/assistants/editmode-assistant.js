/*
 *    EditmodeAssistant - Mode Launcher's Mode Edition Scene
*/

function EditmodeAssistant(type, modeidx) {
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

	this.triggers = this.appAssistant.triggers;

	this.retrieving = false;

	this.type = type;
	
	this.modeidx = modeidx;
	
	this.mode = this.getModeData();
}    

EditmodeAssistant.prototype.setup = function() {
	/* This function is for setup tasks that have to happen when the scene is first created
	 * Use Mojo.View.render to render view templates and add them to the scene, if needed.
    * Setup widgets and add event handlers to listen to events from widgets here. 
    */

//
// Application menu
//
	
	if(this.type == "custom") {
		this.controller.setupWidget(Mojo.Menu.appMenu, 
			{'omitDefaultItems': true}, {'visible': true, 'items': [ 
			{'label': "Add to Launcher", 'command': "launchpoint"}]} );
	}
	else {
		this.controller.setupWidget(Mojo.Menu.appMenu, 
			{'omitDefaultItems': true}, {'visible': true, 'items': [ 
			{'label': "Get System Settings", 'command': "retrieve"}]} );
	}
	
//
// View Menu
//

	this.currentView = "Configuration";

	this.configurationView = this.controller.get("ConfigurationView");
	
	this.configurationView.style.display = 'block';
		
	if(this.type == "custom")
		this.itemsViewMenu = [{'label': "Mode Configuration", 'command': "configuration", 'width': 320}];
	else
		this.itemsViewMenu = [{'label': "Default Mode Settings", 'command': "configuration", 'width': 320}];

	this.modelViewMenu = {'visible': true, 'items': this.itemsViewMenu};

	this.controller.setupWidget(Mojo.Menu.viewMenu, undefined, this.modelViewMenu);

//
// Command menu
//

	this.settingsView = this.controller.get("ModeSettingsView");
	this.appsView = this.controller.get("ModeAppsView");
	this.triggersView = this.controller.get("ModeTriggersView");

	this.customCfg = this.controller.get("ConfigurationCustom");
	this.defaultCfg = this.controller.get("ConfigurationDefault");

	if(this.type == "custom") {
		this.customCfg.style.display = 'block';
	
		this.itemsCommandMenu = [
			{'width': 5},
			{'label': "Settings", 'command': "settings", 'width': 100},
			{'label': "Apps", 'command': "applications", 'width': 80},
			{'label': "Triggers", 'command': "triggers", 'width': 100},
			{'width': 5}];
	}
	else {
		this.defaultCfg.style.display = 'block';

		this.itemsCommandMenu = [
			{'width': 35},
			{'label': "Settings", 'command': "settings", 'width': 110},
			{'width': 30},
			{'label': "Apps", 'command': "applications", 'width': 110},
			{'width': 35}];
	}

	this.modelCommandMenu = {'visible': true, 'items': this.itemsCommandMenu};
		
	this.controller.setupWidget(Mojo.Menu.commandMenu, undefined, this.modelCommandMenu);
	
//
// MODE CONFIGURATION
//

	// Mode name text field
	
	if(this.type == "custom")
		this.modelNameText = {'value': this.mode.name, 'disabled': false};
	else
		this.modelNameText = {'value': this.mode.name, 'disabled': true};
		   
	this.controller.setupWidget("NameText", { 'hintText': "Unique Mode Name", 
		'multiline': false, 'enterSubmits': false, 'focus': true},
		this.modelNameText);

	Mojo.Event.listen(this.controller.get("NameText"), Mojo.Event.propertyChange, 
		this.setModeData.bind(this, false));

	// Mode notify selector

	this.modelNotifySelector = {'value': this.mode.notifyMode, 'disabled': false};

	this.choicesNotifySelector = [
		{'label': "Disabled", 'value': 0},
		{'label': "Use Banner", 'value': 1}/*,
		{'label': "System Alert", 'value': 2},
		{'label': "Short Vibrate", 'value': 3}*/];  

	this.controller.setupWidget("NotifySelector", {'label': "Notify", 
		'labelPlacement': "left", 'choices': this.choicesNotifySelector}, 
		this.modelNotifySelector);

	Mojo.Event.listen(this.controller.get("NotifySelector"), Mojo.Event.propertyChange, 
		this.setModeData.bind(this, false));

	// Auto start and close selectors

	this.modelStartSelector = {'value': this.mode.autoStart, 'disabled': false};

	this.choicesStartSelector = [
		{'label': "Only Manually", 'value': 0},
		{'label': "By Selection", 'value': 1},
		{'label': "After Timer", 'value': 2},
		{'label': "Immediate", 'value': 3}];  
		
	this.controller.setupWidget("StartSelector",	{'label': "Auto Start",
		'labelPlacement': "left", 'choices': this.choicesStartSelector},
		this.modelStartSelector);
	
	Mojo.Event.listen(this.controller.get("StartSelector"), Mojo.Event.propertyChange, 
		this.setModeData.bind(this, false));
		
	this.modelCloseSelector = {'value': this.mode.autoClose, 'disabled': false};

	this.choicesCloseSelector = [
		{'label': "Only Manually", 'value': 0},
		{'label': "By Selection", 'value': 1},
		{'label': "After Timer", 'value': 2},
		{'label': "Immediate", 'value': 3}];  

	this.controller.setupWidget("CloseSelector",	{'label': "Auto Close", 
		'labelPlacement': "left", 'choices': this.choicesCloseSelector},
		this.modelCloseSelector);
	
	Mojo.Event.listen(this.controller.get("CloseSelector"), Mojo.Event.propertyChange, 
		this.setModeData.bind(this, false));

	// Mode startup selector

	this.modelStartupSelector = {'value': this.mode.miscOnStartup, 'disabled': false};

	this.choicesStartupSelector = [
		{'label': "Active Mode", 'value': 0},
		{'label': "Default Mode", 'value': 1}];  
	
	this.controller.setupWidget("StartupSelector", {'label': "On Startup", 
		'labelPlacement': "left", 'choices': this.choicesStartupSelector}, 
		this.modelStartupSelector);

	Mojo.Event.listen(this.controller.get("StartupSelector"), Mojo.Event.propertyChange, 
		this.setModeData.bind(this, false));
	
	// Apps startup selector
	
	this.modelAppsSelector = {'value': this.mode.miscAppsMode, 'disabled': false};

	this.choicesAppsSelector = [
		{'label': "On Startup", 'value': 0},
		{'label': "Everytime", 'value': 1}];  

	this.controller.setupWidget("AppsSelector", {'label': "Applications", 
		'labelPlacement': "left", 'choices': this.choicesAppsSelector},
		this.modelAppsSelector);	

	Mojo.Event.listen(this.controller.get("AppsSelector"), Mojo.Event.propertyChange, 
		this.setModeData.bind(this, false));
			
//
// SETTINGS
//

	this.modelChargingSelector = {'value': this.mode.settings.charging, 'disabled': false};
	
	this.choicesChargingSelector = [
		{'label': "Lock Screen", 'value': 1},
		{'label': "Always On", 'value': 2},
		{'label': "Turn Off", 'value': 3}];  

	this.controller.setupWidget("ChargingSelector",	{'label': "On Charger", 
		'labelPlacement': "left", 'choices': this.choicesChargingSelector}, 
		this.modelChargingSelector);

	Mojo.Event.listen(this.controller.get("ChargingSelector"), Mojo.Event.propertyChange, 
		this.setModeData.bind(this, false));

	// Settings list

	this.modelSettingsList = {'items': this.mode.settingsList};
	
	this.controller.setupWidget("SettingsList", {
		'itemTemplate': 'editmode/listitem-settings',
		'swipeToDelete': false, 'reorderable': false},
		this.modelSettingsList);

	for(var i=0; i < this.settings.length; i++) {
		var id = this.settings[i].id;
		var element = id.charAt(0).toUpperCase() + id.slice(1) + "List";
		
		this.controller.setupWidget(element, {
			'itemTemplate': '../extensions/settings/' + id + '-listitem',
			'swipeToDelete': true, 'autoconfirmDelete': true,
			'reorderable': false, 'itemsProperty': id});
	}

	Mojo.Event.listen(this.controller.get("SettingsList"), Mojo.Event.listTap, 
		this.handleListTap.bind(this, "settings"));

	Mojo.Event.listen(this.controller.get("SettingsList"), Mojo.Event.listDelete, 
		this.handleListDelete.bind(this, "settings"));

	Mojo.Event.listen(this.controller.get("SettingsList"), Mojo.Event.propertyChange, 
		this.handleListChange.bind(this, "settings"));

//
// SETTINGS LIST ITEM
//

	for(var i = 0; i < this.settings.length; i++)
		this.settings[i].config.setup(this.controller);

//
// APPLICATIONS
//

	// Application start selector
	
	this.choicesAppsStartSelector = [
		{'label': "Do Nothing", 'value': 0},
		{'label': "Close All Apps", 'value': 2}];  
		
	this.modelAppsStartSelector = {'value': this.mode.apps.start, 'disabled': false};
		
	this.controller.setupWidget("AppsStartSelector", {'label': "On Start", 
		'labelPlacement': "left", 'choices': this.choicesAppsStartSelector},
		this.modelAppsStartSelector);

	Mojo.Event.listen(this.controller.get("AppsStartSelector"), Mojo.Event.propertyChange, 
		this.setModeData.bind(this, false));

	// Application close selector

	this.choicesAppsCloseSelector = [
		{'label': "Do Nothing", 'value': 0},
		{'label': "Close Started", 'value': 1},
		{'label': "Close All Apps", 'value': 2}];  
		
	this.modelAppsCloseSelector = {'value': this.mode.apps.close, 'disabled': false};
		
	this.controller.setupWidget("AppsCloseSelector", {'label': "On Close", 
		'labelPlacement': "left", 'choices': this.choicesAppsCloseSelector},
		this.modelAppsCloseSelector);

	Mojo.Event.listen(this.controller.get("AppsCloseSelector"), Mojo.Event.propertyChange, 
		this.setModeData.bind(this, false));

	// Applications list

	this.modelAppsList = {'items': this.mode.appsList};
	
	this.controller.setupWidget("AppsList", {
		'itemTemplate': 'editmode/listitem-apps',
		'swipeToDelete': true, 'reorderable': true,
		'autoconfirmDelete': true},
		this.modelAppsList);

	for(var i=0; i < this.applications.length; i++) {
		var id = this.applications[i].id;
		var element = id.charAt(0).toUpperCase() + id.slice(1) + "List";
		
		this.controller.setupWidget(element, {
			'itemTemplate': '../extensions/applications/' + id + '-listitem',
			'swipeToDelete': false, 'autoconfirmDelete': false,
			'reorderable': false, 'itemsProperty': id});
	}

	Mojo.Event.listen(this.controller.get("AppsList"), Mojo.Event.listTap, 
		this.handleListTap.bind(this, "apps"));

	Mojo.Event.listen(this.controller.get("AppsList"), Mojo.Event.listDelete, 
		this.handleListDelete.bind(this, "apps"));

	Mojo.Event.listen(this.controller.get("AppsList"), Mojo.Event.listReorder, 
		this.handleListReorder.bind(this, "apps"));

	Mojo.Event.listen(this.controller.get("AppsList"), Mojo.Event.propertyChange, 
		this.handleListChange.bind(this, "apps"));

//
// APPS LIST ITEM
//

	for(var i = 0; i < this.applications.length; i++)
		this.applications[i].config.setup(this.controller);

//
// TRIGGERS
//

	// Block selector

	this.modelBlockSelector = {'value': this.mode.triggers.block, 'disabled': false};

	this.choicesBlockSelector = [
		{'label': "No Blocking", 'value': 0},
		{'label': "Other Modes", 'value': 1}];  

	this.controller.setupWidget("BlockSelector",	{ 'label': "Block", 
		'labelPlacement': 'left', 'choices': this.choicesBlockSelector},
		this.modelBlockSelector);	
	
	Mojo.Event.listen(this.controller.get("BlockSelector"), Mojo.Event.propertyChange, 
		this.setModeData.bind(this, false));

	// Trigger selector

	this.modelRequiredSelector = {'value': this.mode.triggers.required, 'disabled': false};

	this.choicesTriggerSelector = [
		{'label': "All Unique", 'value': 1},
		{'label': "One Trigger", 'value': 2}];  

	this.controller.setupWidget("RequiredSelector",	{'label': "Required", 
		'labelPlacement': "left", 'choices': this.choicesTriggerSelector},
		this.modelRequiredSelector);	
	
	Mojo.Event.listen(this.controller.get("RequiredSelector"), Mojo.Event.propertyChange, 
		this.setModeData.bind(this, false));

	// Triggers list

	this.modelTriggersList = {'items': this.mode.triggersList};
	
	this.controller.setupWidget("TriggersList", {
		'itemTemplate': "editmode/listitem-triggers",
		'swipeToDelete': false, 'reorderable': false},
		this.modelTriggersList);

	for(var i=0; i < this.triggers.length; i++) {
		var id = this.triggers[i].id;
		var element = id.charAt(0).toUpperCase() + id.slice(1) + "List";

		this.controller.setupWidget(element, {
			'itemTemplate': "../extensions/triggers/" + id + "-listitem",
			'swipeToDelete': true, 'autoconfirmDelete': true,
			'reorderable': false, 'itemsProperty': id});
	}

	Mojo.Event.listen(this.controller.get("TriggersList"), Mojo.Event.listTap, 
		this.handleListTap.bind(this, "triggers"));

	Mojo.Event.listen(this.controller.get("TriggersList"), Mojo.Event.listDelete, 
		this.handleListDelete.bind(this, "triggers"));

	Mojo.Event.listen(this.controller.get("TriggersList"), Mojo.Event.propertyChange, 
		this.handleListChange.bind(this, "triggers"));

//
// TRIGGERS LIST ITEM
//

	for(var i = 0; i < this.triggers.length; i++)
		this.triggers[i].config.setup(this.controller);
}

//

EditmodeAssistant.prototype.getModeData = function() {
	var cfgIndex = 0;

	if(this.type == "custom") {
		var mode = {
			'name': "", 'type': "custom",
		
			'notifyMode': 1, 'autoStart': 1, 'autoClose': 1,
		
			'settings': {'mode': 0, 'charging': 1}, 'settingsList': [],
		
			'apps': {'start':0, 'close': 1}, 'appsList': [],
		
			'triggers': {'block': 0, 'required': 1}, 'triggersList': []
		};
	}
	else {
		var mode = {
			'name': "", 'type': "default",
		
			'notifyMode': 1, 'miscOnStartup': 1, 'miscAppsMode': 1,
		
			'settings': {'mode': 0, 'charging': 1}, 'settingsList': [],
		
			'apps': {'start':0, 'close': 1}, 'appsList': [],
		
			'triggers': {'block': 0, 'required': 1}, 'triggersList': []
		};
	}

	for(var i = 0; i < this.settings.length; i++) {
		var id = this.settings[i].id;
		var element = id.charAt(0).toUpperCase() + id.slice(1) + "List";

		var setting = {};
		
		setting[id] = []; 
		setting['list'] = "<div name='" + element + "' x-mojo-element='List'></div>";

		mode.settingsList.push(setting);
	}

	if(this.type == "custom") {
		for(var i = 0; i < this.triggers.length; i++) {
			var id = this.triggers[i].id;
			var element = id.charAt(0).toUpperCase() + id.slice(1) + "List";
	
			var trigger = {};
		
			trigger[id] = [];
			trigger['list'] = "<div name='" + element + "' x-mojo-element='List'></div>";

			mode.triggersList.push(trigger);
		}
	}

	if(this.type == "custom") {
		if(this.modeidx == undefined)
			return mode;
	
		var config = this.config.modesConfig[this.modeidx];
	}
	else
		var config = this.config.defaultMode;

	for(var i = 0; i < config.appsList.length; i++) {
		for(var j = 0; j < this.applications.length; j++) {
			if(this.applications[j].id == "default")
				cfgIndex = j;
			else if(this.applications[j].appid == config.appsList[i].appid) {
				cfgIndex = j;
				
				break;
			}
		}

		var id = this.applications[cfgIndex].id;
		var element = id.charAt(0).toUpperCase() + id.slice(1) + "List";

		var setting = {};
		
		setting[id] = []; 
		setting['list'] = "<div name='" + element + "' x-mojo-element='List'></div>";
		
		mode.appsList.push(setting);
	}

	// Actual loading of the configuration.

	mode.name =  config.name;
	mode.type =  config.type;
						
	mode.notifyMode =  config.notifyMode;
	
	if(this.type == "custom") {
		mode.autoStart = config.autoStart;
		mode.autoClose = config.autoClose;
	}
	else {
		mode.miscOnStartup = config.miscOnStartup;
		mode.miscAppsMode = config.miscAppsMode;
	}
				
	mode.settings.mode = 0;
	mode.settings.charging =  config.settings.charging;
						
	mode.apps.start = config.apps.start;
	mode.apps.close = config.apps.close;
	
	if(this.type == "custom") {
		mode.triggers.block = config.triggers.block;
		mode.triggers.required = config.triggers.required;
	}

	for(var i = 0; i < this.settings.length; i++) {
		for(var j = 0; j < config.settingsList.length; j++) {
			if(this.settings[i].id == config.settingsList[j].type) {
				var source = config.settingsList[j];
				eval('var target = mode.settingsList[i].' + this.settings[i].id);
				
				this.settings[i].config.load(target, source);
				
				target[target.length - 1].type = this.settings[i].id;
				
				break;
			}
		}
	}
	
	for(var i = 0; i < config.appsList.length; i++) {
		for(var j = 0; j < this.applications.length; j++) {
			if(this.applications[j].id == "default")
				cfgIndex = j;
			else if(this.applications[j].appid == config.appsList[i].appid) {
				cfgIndex = j;
				
				break;
			}
		}
			
		var source = config.appsList[i];
		eval("var target = mode.appsList[i]['" + this.applications[cfgIndex].id + "']");

		this.applications[cfgIndex].config.load(target, source);
	}

	for(var i = 0; i < this.triggers.length; i++) {
		for(var j = 0; j < config.triggersList.length; j++) {
			if(this.triggers[i].id == config.triggersList[j].type) {
				var source = config.triggersList[j];
				eval('var target = mode.triggersList[i].' + this.triggers[i].id);
			
				this.triggers[i].config.load(target, source);

				target[target.length - 1].type = this.triggers[i].id;
			}
		}
	}

	return mode;
}

EditmodeAssistant.prototype.setModeData = function(refresh) {
	var cfgIndex = 0;

	if(refresh) {
		// FIXME: hack so that the list position is not resetted.

		var tmp = this.controller.sceneScroller.mojo.getState();

		if(this.currentView == "Settings")
			this.controller.modelChanged(this.modelSettingsList, this);
		else if(this.currentView == "Applications")
			this.controller.modelChanged(this.modelAppsList, this);
		else if(this.currentView == "Triggers")
			this.controller.modelChanged(this.modelTriggersList, this);

		this.controller.sceneScroller.mojo.setState(tmp);
	}
	
	if(this.type == "custom") {
		var config = this.config.modesConfig[this.modeidx];

		var mode = {
			'name': "", 'type': "custom",
		
			'notifyMode': 1, 'autoStart': 1, 'autoClose': 1,
		
			'settings': {'mode': 0, 'charging': 1}, 'settingsList': [],
		
			'apps': {'start':0, 'close': 1}, 'appsList': [],
		
			'triggers': {'block': 0, 'required': 1}, 'triggersList': []
		};
	}
	else {
		var config = this.config.defaultMode;

		var mode = {
			'name': "", 'type': "default",
		
			'notifyMode': 1, 'miscOnStartup': 1, 'miscAppsMode': 1,
		
			'settings': {'mode': 0, 'charging': 1}, 'settingsList': [],
		
			'apps': {'start':0, 'close': 1}, 'appsList': [],
		
			'triggers': {'block': 0, 'required': 1}, 'triggersList': []
		};
	}

	if(this.type == "custom") {
		this.checkModeName();
	}

	mode.name = this.modelNameText.value;
	mode.type = this.type;
	
	mode.notifyMode = this.modelNotifySelector.value;
	
	if(this.type == "custom") {
		mode.autoStart = this.modelStartSelector.value;
		mode.autoClose = this.modelCloseSelector.value;
	}
	else {
		mode.miscOnStartup = this.modelStartupSelector.value;
		mode.miscAppsMode = this.modelAppsSelector.value;			
	}
	
	mode.settings.mode = 0;
	mode.settings.charging = this.modelChargingSelector.value;
		
	mode.apps.start = this.modelAppsStartSelector.value;
	mode.apps.close = this.modelAppsCloseSelector.value;								
	
	if(this.type == "custom") {
		mode.triggers.block = this.modelBlockSelector.value;
		mode.triggers.required = this.modelRequiredSelector.value;
	}
	
	for(var i = 0; i < this.settings.length; i++) {
		eval('var source = this.mode.settingsList[i].' + this.settings[i].id + '[0]');
	
		if(source != undefined) {
			var target = mode.settingsList;
			
			this.settings[i].config.save(source, target);
			
			target[target.length - 1].type = this.settings[i].id;
		}
	}

	for(var i = 0; i < this.mode.appsList.length; i++) {
		for(var j = 0; j < this.applications.length; j++) {
			if(eval("this.mode.appsList[i]['" + this.applications[j].id + "']") != undefined) {
				cfgIndex = j;
				
				break;
			}
		}
		
		eval("var source = this.mode.appsList[i]['" + this.applications[cfgIndex].id + "'][0]");

		if(source != undefined) {
			var target = mode.appsList;
			
			this.applications[cfgIndex].config.save(source, target);
		}
	}
	
	if(this.type == "custom") {
		for(var i = 0; i < this.triggers.length; i++) {
			eval('var list = this.mode.triggersList[i].' + this.triggers[i].id);
			
			for(var j = 0; j < list.length; j++) {
				eval('var source = this.mode.triggersList[i].' + this.triggers[i].id + '[j]');
		
				if(source != undefined) {
					var target = mode.triggersList;
				
					this.triggers[i].config.save(source, target);
				
					target[target.length - 1].type = this.triggers[i].id;
				}
			}
		}

		if(this.modeidx == undefined)
		{
			this.modeidx = this.appAssistant.config.modesConfig.length;
			this.appAssistant.config.modesConfig.push(mode);
		}
		else {
			this.appAssistant.config.modesConfig.splice(this.modeidx, 1, mode);
		}

		this.appAssistant.saveConfigData("modesConfig");
	}
	else {
		this.appAssistant.config.defaultMode = mode;
		
		this.appAssistant.saveConfigData("defaultMode");
	}
}

//

EditmodeAssistant.prototype.retrieveCurrentSettings = function(index, target, settings) {
	// Store settings from last round if returned by the extension.

	if(settings != undefined) {
		settings.type = this.settings[index - 1].id;
	
		eval("this.mode.settingsList[index - 1]." + this.settings[index - 1].id + ".clear()");
		
		eval("this.mode.settingsList[index - 1]." + this.settings[index - 1].id + ".push(settings)");

		this.setModeData(true);
	}

	if((index < this.settings.length) && ((settings == undefined) || (target == "everything"))) {
		Mojo.Log.info("Retrieving " + this.settings[index].id + " settings");

		eval("this.mode.settingsList[index]." + this.settings[index].id + ".clear()");

		eval("var list = this.mode.settingsList[index]." + this.settings[index].id);
		
		this.settings[index].config.append(list, this.setModeData.bind(this, true));

		list[list.length - 1].type = this.settings[index].id;

		var callback = this.retrieveCurrentSettings.bind(this, ++index, target);

		this.settings[index - 1].setting.get(callback);
	}
	else {
		Mojo.Log.info("Retrieving system settings finished");

		this.appControl.showBanner("Retrieving system settings finished", {});

		this.retrieving = false;
	}
}

//

EditmodeAssistant.prototype.handleCommand = function(event) {
	if(event.type == Mojo.Event.back) {
		event.stop();

		if(this.retrieving) {
			this.appControl.showBanner("Retrieving process still in progress", {});
									 
			return;
		}

		if(this.currentView == "Configuration") {
			this.controller.stageController.popScene();
			return;
		}
	}

	if((event.type == Mojo.Event.command) || (event.type == Mojo.Event.back)) {
		if((event.command == "configuration") || (event.type == Mojo.Event.back)) {
			this.currentView = "Configuration";

			this.modelCommandMenu.items.clear();

			if(this.type == "custom") {			
				this.modelCommandMenu.items.push({'width': 5});
				this.modelCommandMenu.items.push({'label': "Settings", 'command': "settings", 'width': 100});
				this.modelCommandMenu.items.push({'label': "Apps", 'command': "applications", 'width': 80});
				this.modelCommandMenu.items.push({'label': 'Triggers', 'command': "triggers", 'width': 100});
				this.modelCommandMenu.items.push({'width': 5});
			}
			else {
				this.modelCommandMenu.items.push({'width': 35});
				this.modelCommandMenu.items.push({'label': "Settings", 'command': "settings", 'width': 110});
				this.modelCommandMenu.items.push({'width': 30});
				this.modelCommandMenu.items.push({'label': "Apps", 'command': "applications", 'width': 110});
				this.modelCommandMenu.items.push({'width': 35});
			}

			this.controller.modelChanged(this.modelCommandMenu, this);
			
			this.appsView.style.display = "none";
			this.settingsView.style.display = "none";
			this.triggersView.style.display = "none";
			
			this.configurationView.style.display = "block";

			// FIXME: bug in Mojo if name field changed while hidden it is not shown properly.
			
			var name = this.modelNameText.value;
			this.modelNameText.value = "";
			this.controller.modelChanged(this.modelNameText, this);
			this.modelNameText.value = name;
			this.controller.modelChanged(this.modelNameText, this);
			
			this.controller.sceneScroller.mojo.revealTop(0);

			var transition = this.controller.prepareTransition(Mojo.Transition.crossFade);
	
			transition.run();
		}
		else if(event.command == "settings") {
			this.currentView = "Settings";
			
			this.modelCommandMenu.items.clear();
			this.modelCommandMenu.items.push({});
			this.modelCommandMenu.items.push({'label': "Add System Setting", 'command': "settings-add"});
			this.modelCommandMenu.items.push({});

			this.controller.modelChanged(this.modelCommandMenu, this);
			
			this.configurationView.style.display = "none";
			this.settingsView.style.display = "block";
			
			this.controller.sceneScroller.mojo.revealTop(0);

			// FIXME: Bug in slider widget, it has to be visible on setup or refreshed.

			this.controller.modelChanged(this.modelSettingsList, this);

			var transition = this.controller.prepareTransition(Mojo.Transition.crossFade);

			transition.run();
		}
		else if(event.command == "applications") {
			this.currentView = "Applications";
			
			this.modelCommandMenu.items.clear();
			this.modelCommandMenu.items.push({});
			this.modelCommandMenu.items.push({'label': "Add Application", 'command': "applications-add"});
			this.modelCommandMenu.items.push({});

			this.controller.modelChanged(this.modelCommandMenu, this);
			
			this.configurationView.style.display = "none";
			this.appsView.style.display = "block";
			
			this.controller.sceneScroller.mojo.revealTop(0);

			var transition = this.controller.prepareTransition(Mojo.Transition.crossFade);
	
			transition.run();
		}
		else if(event.command == 'triggers') {
			this.currentView = "Triggers";

			this.modelCommandMenu.items.clear();
			this.modelCommandMenu.items.push({});
			this.modelCommandMenu.items.push({'label': "Add Activation Trigger", 'command': "triggers-add"});
			this.modelCommandMenu.items.push({});

			this.controller.modelChanged(this.modelCommandMenu, this);

			this.configurationView.style.display = "none";
			this.triggersView.style.display = "block";
			
			this.controller.sceneScroller.mojo.revealTop(0);

			var transition = this.controller.prepareTransition(Mojo.Transition.crossFade);
	
			transition.run();
		}
		else if(event.command == "settings-add") {
				var settingItems = [];
				
				settingItems.push({'label': "Append All Settings", 'command': "everything"});
							
				for(var i = 0; i < this.settings.length; i++) {
					if(eval("this.mode.settingsList[i]." + this.settings[i].id + ".length") == 0)
						settingItems.push({'label': this.settings[i].config.label(), 'command': i});
				}

				settingItems.push({'label': "Remove All Settings", 'command': "nosettings"});
	
				this.controller.popupSubmenu({
					'onChoose': this.handleSettingsChoose.bind(this), 'items': settingItems});
		}
		else if(event.command == "applications-add") {
			this.controller.serviceRequest('palm://com.palm.applicationManager/', {
				'method': 'listLaunchPoints', 'parameters': {},
				'onSuccess': function(payload) {
					var appItems = [];

					this.launchPoints = payload.launchPoints;
				
					this.launchPoints.sort(this.sortAlphabeticallyFunction);
				
					this.launchPoints.each(function(item, index){
						appItems.push({'label': item.title, 'command': index});
					}.bind(this));

					this.controller.popupSubmenu({
						'onChoose':  this.handleAppsChoose.bind(this), 'items': appItems});
				}.bind(this)});
		}
		else if(event.command == "triggers-add") {
			var triggerItems = [];
			
			for(var i = 0; i < this.triggers.length; i++)
				triggerItems.push({'label': this.triggers[i].config.label(), 'command': i});
	
			this.controller.popupSubmenu({
				'onChoose':  this.handleTriggersChoose.bind(this), 'items': triggerItems});
		}	
		else if(event.command == "launchpoint") {
			this.controller.serviceRequest('palm://com.palm.applicationManager/', {
				'method': "addLaunchPoint", 'parameters': {'id': this.appAssistant.appid,
					'icon': "images/default_icon.png", 'title': this.mode.name,
					'params': {'action': "execute", 'event': "toggle", 'name': this.mode.name}}});
		}
		else if(event.command == 'retrieve') {
			for(var i = 0; i < this.settings.length; i++)
				eval('this.mode.settingsList[i].' + this.settings[i].id + '.clear()');
		
			this.handleSettingsChoose("everything");
		}
	}
}

//

EditmodeAssistant.prototype.handleSettingsChoose = function(target) {
	if(target != undefined) {
		if(target == "nosettings") {
			for(var i = 0; i < this.settings.length; i++)
				eval("this.mode.settingsList[i]." + this.settings[i].id +".clear()");
			
			this.setModeData(true);
		}
		else {
			Mojo.Log.info("Retrieving current system settings");

			this.appControl.showBanner("Retrieving current system settings", {});

			this.retrieving = true;

			if(target == "everything")
				this.retrieveCurrentSettings(0, target);			
			else
				this.retrieveCurrentSettings(target, "single");				
		}
	}
}

EditmodeAssistant.prototype.handleAppsChoose = function(index) {
	var cfgIndex = 0;

	if(index != undefined) {
		for(var i = 0; i < this.applications.length; i++) {
			if(this.applications[i].id == "default")
				cfgIndex = i;
			else if(this.applications[i].appid == this.launchPoints[index].id) {
				cfgIndex = i;
				
				break;
			}
		}
		
		var id = this.applications[cfgIndex].id;
		var element = id.charAt(0).toUpperCase() + id.slice(1) + "List";

		var setting = {};
		
		setting[id] = []; 
		setting['list'] = "<div name='" + element + "' x-mojo-element='List'></div>";

		this.mode.appsList.push(setting);
		
		this.controller.setupWidget(element, {
			'itemTemplate': '../extensions/applications/' + id + '-listitem',
			'swipeToDelete': false, 'autoconfirmDelete': false,
			'reorderable': false, 'itemsProperty': id});

		eval("var list = this.mode.appsList[this.mode.appsList.length - 1]['" + this.applications[cfgIndex].id + "']");
		
		this.applications[cfgIndex].config.append(list, this.launchPoints[index], this.setModeData.bind(this, true));
	}
}

EditmodeAssistant.prototype.handleTriggersChoose = function(index) {
	if(index != undefined) {
		eval("var list = this.mode.triggersList[index]." + this.triggers[index].id);

		this.triggers[index].config.append(list, this.setModeData.bind(this, true));
		
		list[list.length - 1].type = this.triggers[index].id;
	}
}

//

EditmodeAssistant.prototype.handleListTap = function(list, event) {
	if(event != undefined) {
		if(list == "settings") {
			for(var i = 0; i < this.settings.length; i++) {
				if(eval("event.model." + this.settings[i].id) != undefined) {
					eval("var list = this.mode.settingsList[i]." + this.settings[i].id);
					
					this.settings[i].config.tapped(list[event.index], event.originalEvent, 
						this.setModeData.bind(this, true));
		
					break;
				}
			}
		}
		else if(list == "triggers") {
			for(var i = 0; i < this.triggers.length; i++) {
				if(eval("event.model." + this.triggers[i].id) != undefined) {
					eval("var list = this.mode.triggersList[i]." + this.triggers[i].id);
					
					this.triggers[i].config.tapped(list[event.index], event.originalEvent, 
						this.setModeData.bind(this, true));
		
					break;
				}
			}
		}
	}
}

EditmodeAssistant.prototype.handleListChange = function(list, event) {
	if(event != undefined) {
		if(event.model == undefined) {
			// Sliders don't have model with them.
		
			this.setModeData(true);
		}
		else {
			if(list == "settings") {
				for(var i = 0; i < this.settings.length; i++) {
					if(event.model.type == this.settings[i].id) {
						eval("var list = this.mode.settingsList[i]." + this.settings[i].id);
					
						this.settings[i].config.changed(event.model, event, 
							this.setModeData.bind(this, true));
		
						break;
					}
				}
			}
			else if(list == "apps") {
				this.setModeData(false);
			}
			else if(list == "triggers") {
				for(var i = 0; i < this.triggers.length; i++) {
					if(event.model.type == this.triggers[i].id) {
						eval("var list = this.mode.triggersList[i]." + this.triggers[i].id);
					
						this.triggers[i].config.changed(event.model, event, 
							this.setModeData.bind(this, true));
		
						break;
					}
				}
			}
		}
	}
}

EditmodeAssistant.prototype.handleListReorder = function(list, event) {
	if(list == "apps") {
		var tempApp = this.mode.appsList[event.fromIndex];
	
		this.mode.appsList.splice(event.fromIndex,1);
		this.mode.appsList.splice(event.toIndex,0,tempApp);
	}
	
	this.setModeData(false);
}

EditmodeAssistant.prototype.handleListDelete = function(list, event) {
	if(list == "settings") {
		for(var i = 0; i < this.settings.length; i++) {
			if(eval("event.model." + this.settings[i].id) != undefined) {
				eval("var list = this.mode.settingsList[i]." + this.settings[i].id);
				
				this.settings[i].config.remove(list, event.index, 
					this.setModeData.bind(this, true));
		
				break;
			}
		}
	}
	else if(list == "apps") {
		for(var i = 0; i < this.applications.length; i++) {
			if(eval("event.model.items[event.index]['" + this.applications[i].id + "']") != undefined) {
				eval("var list = this.mode.appsList[event.index]['" + this.applications[i].id + "']");
				
				this.applications[i].config.remove(list, 0, 
					this.setModeData.bind(this, true));

				this.mode.appsList.splice(event.index,1);
		
				break;
			}
		}
	}
	else if(list == "triggers") {
		for(var i = 0; i < this.triggers.length; i++) {
			if(eval("event.model." + this.triggers[i].id) != undefined) {
				eval("var list = this.mode.triggersList[i]." + this.triggers[i].id);
				
				this.triggers[i].config.remove(list, event.index, 
					this.setModeData.bind(this, true));
		
				break;
			}
		}
	}
	
	this.setModeData(false);
}

//

EditmodeAssistant.prototype.checkModeName = function() {
	if(this.modelNameText.value.length == 0)
		this.modelNameText.value = 'New Mode';

	for(var i = 0; i < 100; i++) {
		if(i == 0)
			var name = this.modelNameText.value;
		else
			var name = this.modelNameText.value + "-" + i;
	
		var exists = false;
		
		for(var j = 0 ; j < this.config.modesConfig.length ; j++) {
			if((j != this.modeidx) && (this.config.modesConfig[j].name == name)) {
				exists = true;
				break;
			}
		}

		if((exists) || ((this.type == "custom") && (name == "Default Mode")))
			continue;
		else {
			if(i > 0)
				this.modelNameText.value = name;
			
			break;
		}
	}

	this.controller.modelChanged(this.modelNameText, this);
}

//

EditmodeAssistant.prototype.sortAlphabeticallyFunction = function(a,b){
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

//

EditmodeAssistant.prototype.activate = function(event) {
	/* Put in event handlers here that should only be in effect when this scene is active. 
	 *	For  example, key handlers that are observing the document. 
	 */
}
	
EditmodeAssistant.prototype.deactivate = function(event) {
	/* Remove any event handlers you added in activate and do any other cleanup that should 
	 * happen before this scene is popped or another scene is pushed on top. 
	 */
	
	this.setModeData(false);
}

EditmodeAssistant.prototype.cleanup = function(event) {
	/* This function should do any cleanup needed before the scene is destroyed as a result
	 * of being popped off the scene stack.
	 */
}

