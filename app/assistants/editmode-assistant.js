/*
 *    EditmodeAssistant - Mode Launcher's Mode Edition Scene
*/

function EditmodeAssistant(type, modeidx) {
	/* This is the creator function for your scene assistant object. It will be passed all the 
	 * additional parameters (after the scene name) that were passed to pushScene. The reference
	 * to the scene controller (this.controller) has not be established yet, so any initialization
	 * that needs the scene controller should be done in the setup function below. 
	 */

	this.type = type;
	this.modeidx = modeidx;

	this.appControl = Mojo.Controller.getAppController();
	this.appAssistant = this.appControl.assistant;
	
	this.modes = this.appAssistant.modes;

	this.defmode = this.appAssistant.defmode;

	this.retrieving = false;

	if(modeidx == undefined)
	{
		this.mode = {
			name: "", type: "custom",
			
			notifyMode: 1,	autoStart: 1, autoClose: 1,
			
			settings: {charging: 1}, settingsList: [],
			
			apps: {start:0, close: 1}, appsList: [],
			
			triggers: {required: 1}, triggersList: []
		};
		
		if(this.type == "default") {
			this.mode.name = "Default Mode";
			this.mode.type = "default";
			
			this.mode.notifyMode = 0;
			this.mode.autoStart = 3;
			this.mode.autoClose = 3;
			
			this.mode.apps.close = 0;
		}		
	}
	else
	{
		this.mode = this.getModeData();
	}
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
		this.controller.setupWidget(Mojo.Menu.appMenu, {omitDefaultItems: true},
			{visible: true, items: [ 
				{label: 'Add to Launcher', command: 'launchpoint'}]});
	}
	else {
		this.controller.setupWidget(Mojo.Menu.appMenu, {omitDefaultItems: true},
			{visible: true, items: [ 
				{label: 'Get Settings', command: 'retrieve'}]});
	}
	
//
// View Menu
//

	this.currentView = "Configuration";

	this.configurationView = this.controller.get('ConfigurationView');
	
	if(this.type == "custom")
		this.itemsViewMenu = [{label: 'Mode Configuration', command: 'configuration', width:320}];
	else
		this.itemsViewMenu = [{label: 'Default Mode Settings', command: '', width:320}];

	this.modelViewMenu = {
		visible: true, 
		items: this.itemsViewMenu};

	this.controller.setupWidget(Mojo.Menu.viewMenu, undefined, this.modelViewMenu);

//
// Command menu
//

	this.settingsView = this.controller.get('ModeSettingsView');
	this.appsView = this.controller.get('ModeAppsView');
	this.triggersView = this.controller.get('ModeTriggersView');

	if(this.type == "custom") {
		this.settingsView.style.display = 'none';
		this.appsView.style.display = 'none';
		this.triggersView.style.display = 'none';
	
		this.itemsCommandMenu = [
			{width: 5},
			{label: 'Settings', command: 'settings', width:100},
			{label: 'Apps', command: 'applications', width:80},
			{label: 'Triggers', command: 'triggers', width:100},
			{width: 5}];
	}
	else {
		this.configurationView.style.display = 'none';

		this.triggersView.style.display = 'none';
		this.appsView.style.display = 'none';
		this.settingsView.style.display = 'block';

		this.currentView = "Settings";

		this.itemsCommandMenu = [];
	}

	this.modelCommandMenu = {
		visible: true, 
		items: this.itemsCommandMenu};
		
	this.controller.setupWidget(Mojo.Menu.commandMenu, undefined, this.modelCommandMenu);

//
// DEFAULT MODE VIEW
//

	if(this.type == "default") {
		this.controller.get('Preferences').style.display = 'none';
		this.controller.get('Settings').style.display = 'none';
	}
	
//
// MODE CONFIGURATION
//

	// Mode name text field
	
	this.modelNameText = {value: this.mode.name, disabled: false};
		   
	this.controller.setupWidget('NameText', {
		hintText: 'Unique Mode Name', multiline: false, enterSubmits: false, focus: true},
		this.modelNameText);

	Mojo.Event.listen(this.controller.get('NameText'), Mojo.Event.propertyChange, 
		this.setModeData.bind(this, false));

	// Notify selector

	this.modelNotifySelector = {value: this.mode.notifyMode, disabled: false};

	this.choicesNotifySelector = [
		{label: 'Disabled', value: 0},
		{label: 'Use Banner', value: 1}/*,
		{label: 'System Alert', value: 2},
		{label: 'Short Vibrate', value: 3}*/];  

	this.controller.setupWidget('NotifySelector',	{
		label: 'Notify', labelPlacement: 'left', 							
		choices: this.choicesNotifySelector},
		this.modelNotifySelector);

	Mojo.Event.listen(this.controller.get('NotifySelector'), Mojo.Event.propertyChange, 
		this.setModeData.bind(this, false));

	// Auto start and close selectors

	this.modelStartSelector = {value: this.mode.autoStart, disabled: false};

	this.choicesStartSelector = [
		{label: 'Only Manually', value: 0},
		{label: 'By Selection', value: 1},
		{label: 'After Timer', value: 2},
		{label: 'Immediate', value: 3}];  
		
	this.controller.setupWidget('StartSelector',	{
		label: 'Auto Start', labelPlacement: 'left', 							
		choices: this.choicesStartSelector},
		this.modelStartSelector);	
	
	Mojo.Event.listen(this.controller.get('StartSelector'), Mojo.Event.propertyChange, 
		this.setModeData.bind(this, false));
		
	this.modelCloseSelector = {value: this.mode.autoClose, disabled: false};

	this.choicesCloseSelector = [
		{label: 'Only Manually', value: 0},
		{label: 'By Selection', value: 1},
		{label: 'After Timer', value: 2},
		{label: 'Immediate', value: 3}];  

	this.controller.setupWidget('CloseSelector',	{
		label: 'Auto Close', labelPlacement: 'left', 							
		choices: this.choicesCloseSelector},
		this.modelCloseSelector);	
	
	Mojo.Event.listen(this.controller.get('CloseSelector'), Mojo.Event.propertyChange, 
		this.setModeData.bind(this, false));
		
//
// SETTINGS
//

	this.modelChargingSelector = {value: this.mode.settings.charging, disabled: false};
	
	this.choicesChargingSelector = [
		{label: 'Lock Screen', value: 1},
		{label: 'Always On', value: 2},
		{label: 'Turn Off', value: 3}];  

	this.controller.setupWidget('ChargingSelector',	{
		label: 'On Charger', labelPlacement: 'left',
		choices: this.choicesChargingSelector},
		this.modelChargingSelector);

	Mojo.Event.listen(this.controller.get('ChargingSelector'), Mojo.Event.propertyChange, 
		this.setModeData.bind(this, false));

	// Settings list
	
	if(this.type == "custom")
		var allowDelete = true;
	else
		var allowDelete = false;
	
	this.modelSettingsList = {items: this.mode.settingsList};
	
	this.controller.setupWidget('SettingsList', {
		itemTemplate: 'editmode/listitem-settings',
		swipeToDelete: allowDelete,
		autoconfirmDelete: true,
		reorderable: false},
		this.modelSettingsList);

	Mojo.Event.listen(this.controller.get('SettingsList'), Mojo.Event.listTap, 
		this.handleListTap.bind(this, "settings"));

	Mojo.Event.listen(this.controller.get('SettingsList'), Mojo.Event.listDelete, 
		this.handleListDelete.bind(this, "settings"));

	Mojo.Event.listen(this.controller.get('SettingsList'), Mojo.Event.propertyChange, 
		this.setModeData.bind(this, true));

//
// SETTINGS LIST ITEM
//

	// Wi-Fi, Bluetooth, GPS, Data and Phone toggle selectors

	this.choicesWIFISelector = [
		{label: 'Enabled', value: 1},
		{label: 'Disabled', value: 0}];  

	this.controller.setupWidget('WIFISelector',	{
		label: 'Wi-Fi', labelPlacement: 'left', modelProperty: "connectionWiFi",
		choices: this.choicesWIFISelector});

	this.choicesBTSelector = [
		{label: 'Enabled', value: 1},
		{label: 'Disabled', value: 0}];  

	this.controller.setupWidget('BTSelector',	{
		label: 'Bluetooth', labelPlacement: 'left', modelProperty: "connectionBT",
		choices: this.choicesBTSelector});

	this.choicesGPSSelector = [
		{label: 'Enabled', value: 1},
		{label: 'Disabled', value: 0}];  

	this.controller.setupWidget('GPSSelector',	{
		label: 'GPS', labelPlacement: 'left', modelProperty: "connectionGPS",
		choices: this.choicesGPSSelector});

	this.choicesDataSelector = [
		{label: 'Enabled', value: 1},
		{label: 'Disabled', value: 0}];  

	this.controller.setupWidget('DataSelector',	{
		label: 'Data', labelPlacement: 'left', modelProperty: "connectionData",
		choices: this.choicesDataSelector});

	this.choicesPhoneSelector = [
		{label: 'Enabled', value: 1},
		{label: 'Disabled', value: 0}];  

	this.controller.setupWidget('PhoneSelector',	{
		label: 'Phone', labelPlacement: 'left', modelProperty: "connectionPhone",
		choices: this.choicesPhoneSelector});

	// IM status, sound and ringtone selectors

	this.choicesIMStatusSelector = [
		{label: 'Available', value: 0},
		{label: 'Busy', value: 2},
		{label: 'Sign Off', value: 4}];  

	this.controller.setupWidget('IMStatusSelector',	{
		label: 'IM Status', labelPlacement: 'left', modelProperty: "messagingIMStatus",
		choices: this.choicesIMStatusSelector});

	this.choicesSoundSelector = [
		{label: 'System Alert', value: 1},
		{label: 'Ringtone', value: 2},
		{label: 'Mute', value: 0}];  

	this.controller.setupWidget('MsgSoundSelector',	{
		label: 'Sound', labelPlacement: 'left', modelProperty: "messagingSoundMode",
		choices: this.choicesSoundSelector});

	// Ringer on, ringer off and ringtone selectors

	this.choicesRingerOnSelector = [
		{label: 'Sound & Vibrate', value: 1},
		{label: 'Sound Only', value: 2}];  

	this.controller.setupWidget('RingerOnSelector',	{
		label: 'Ringer On', labelPlacement: 'left', modelProperty: "ringerRingerOn",
		choices: this.choicesRingerOnSelector});

	this.choicesRingerOffSelector = [
		{label: 'Vibrate', value: 1},
		{label: 'Mute', value: 2}];  

	this.controller.setupWidget('RingerOffSelector',	{
		label: 'Ringer Off', labelPlacement: 'left', modelProperty: "ringerRingerOff",
		choices: this.choicesRingerOffSelector});
	
	// Screen brightness slider, timeout and wallpaper selector
	
	this.controller.setupWidget('ScreenSlider', {
		minValue: 0, maxValue: 100, round: true, modelProperty: "screenBrightnessLevel"});

	this.choicesTimeoutSelector = [
		{label: '30 Seconds', value: 30},
		{label: '1 Minute', value: 60},
		{label: '2 Minutes', value: 120},
		{label: '3 Minutes', value: 180}];  

	this.controller.setupWidget('TimeoutSelector',	{
		label: 'Turn off After', labelPlacement: 'left', modelProperty: "screenTurnOffTimeout",
		choices: this.choicesTimeoutSelector});

	// Ringer, System and Media volume selectors
	
	this.controller.setupWidget('RingerSlider', {
		minValue: 0, maxValue: 100, round: true, modelProperty: "soundRingerVolume"});

	this.controller.setupWidget('SystemSlider', {
		minValue: 0, maxValue: 100, round: true, modelProperty: "soundSystemVolume"});

	this.controller.setupWidget('MediaSlider', {
		minValue: 0, maxValue: 100, round: true, modelProperty: "soundMediaVolume"});

//
// APPLICATIONS
//

	// Application start selector
	
	this.choicesAppsStartSelector = [
		{label: 'Do Nothing', value: 0},
		{label: 'Close All Apps', value: 2}];  
		
	this.modelAppsStartSelector = {value: this.mode.apps.start, disabled: false};
		
	this.controller.setupWidget('AppsStartSelector', {
		label: 'On Start', labelPlacement: 'left', 							
		choices: this.choicesAppsStartSelector},
		this.modelAppsStartSelector);

	// Application close selector

	this.choicesAppsCloseSelector = [
		{label: 'Do Nothing', value: 0},
		{label: 'Close Started', value: 1},
		{label: 'Close All Apps', value: 2}];  
		
	this.modelAppsCloseSelector = {value: this.mode.apps.close, disabled: false};
		
	this.controller.setupWidget('AppsCloseSelector', {
		label: 'On Close', labelPlacement: 'left', 							
		choices: this.choicesAppsCloseSelector},
		this.modelAppsCloseSelector);

	// Applications list
	
	this.modelAppsList = {items: this.mode.appsList};
	
	this.controller.setupWidget('AppsList', {
		itemTemplate: 'editmode/listitem-apps',
		swipeToDelete: true,
		autoconfirmDelete: true,
		reorderable: true},
		this.modelAppsList);

	Mojo.Event.listen(this.controller.get('AppsList'), Mojo.Event.listReorder, 
		this.handleListReorder.bind(this, "apps"));

	Mojo.Event.listen(this.controller.get('AppsList'), Mojo.Event.listDelete, 
		this.handleListDelete.bind(this, "apps"));

	Mojo.Event.listen(this.controller.get('AppsList'), Mojo.Event.propertyChange, 
		this.setModeData.bind(this, false));

//
// APPS LIST ITEM
//

	// Params text field

	this.controller.setupWidget('ParamsText', {
		hintText: 'Launch Parameters', multiline: false, focus: false, 
		autoFocus: false, enterSubmits: false, modelProperty: 'params'});

//
// TRIGGERS
//

	// Trigger selector

	this.modelRequiredSelector = {value: this.mode.triggers.required, disabled: false};

	this.choicesTriggerSelector = [
		{label: 'All Unique', value: 1},
		{label: 'One Trigger', value: 2}];  

	this.controller.setupWidget('RequiredSelector',	{
		label: 'Required', labelPlacement: 'left', 							
		choices: this.choicesTriggerSelector},
		this.modelRequiredSelector);	
	
	Mojo.Event.listen(this.controller.get('RequiredSelector'), Mojo.Event.propertyChange, 
		this.setModeData.bind(this, false));

	// Triggers list

	this.modelTriggersList = {items: this.mode.triggersList};	
	
	this.controller.setupWidget('TriggersList', {
		itemTemplate: 'editmode/listitem-triggers',
		swipeToDelete: true,
		autoconfirmDelete: true,
		reorderable: false},
		this.modelTriggersList);

	Mojo.Event.listen(this.controller.get('TriggersList'), Mojo.Event.listDelete, 
		this.handleListDelete.bind(this, "triggers"));

	Mojo.Event.listen(this.controller.get('TriggersList'), Mojo.Event.propertyChange, 
		this.setModeData.bind(this, true));

//
// TRIGGERS LIST ITEM
//

	// Charger and delay selector

	this.choicesChargerSelector = [
		{label: 'Touchstone', value: 1},
		{label: 'Wall Charger', value: 2},
		{label: 'USB Charger', value: 3}];  

	this.controller.setupWidget('ChargerSelector',	{
		label: 'Charger', labelPlacement: 'left', modelProperty: "chargerCharger",
		choices: this.choicesChargerSelector});	
	
	this.choicesDelaySelector = [
		{label: 'No Delay', value: 0},
		{label: '3 Seconds', value: 3},
		{label: '30 Seconds', value: 30},
		{label: '60 Seconds', value: 60}];  

	this.controller.setupWidget('DelaySelector',	{
		label: 'Delay', labelPlacement: 'left', modelProperty: "chargerDelay",
		choices: this.choicesDelaySelector});	

	// Location trigger selectors

	this.choicesRadiusSelector = [
		{label: '200 Meters', value: 200},
		{label: '500 Meters', value: 500},
		{label: '800 Meters', value: 800},
		{label: '1000 Meters', value: 1000},
		{label: '1500 Meters', value: 1500},
		{label: '2000 Meters', value: 2000}];  

	this.controller.setupWidget('RadiusSelector', {
		label: 'Radius', labelPlacement: 'left', modelProperty: "locationRadius",
		choices: this.choicesRadiusSelector});

	// Time days selector and Time from/to pickers

	this.choicesTimeSelector = [
		{label: 'Every Day', value: 0},
		{label: 'Weekdays', value: 1},
		{label: 'Weekends', value: 2},
		{label: 'Custom', value: 3}];  

	this.controller.setupWidget('TimeSelector', {
		label: 'Days', labelPlacement: 'left', modelProperty: "timeoutDays",
		choices: this.choicesTimeSelector});

	this.controller.setupWidget('DayCheckBoxMon', {modelProperty: 'timeoutDay1'});
	this.controller.setupWidget('DayCheckBoxTue', {modelProperty: 'timeoutDay2'});
	this.controller.setupWidget('DayCheckBoxWed', {modelProperty: 'timeoutDay3'});
	this.controller.setupWidget('DayCheckBoxThu', {modelProperty: 'timeoutDay4'});		
	this.controller.setupWidget('DayCheckBoxFri', {modelProperty: 'timeoutDay5'});
	this.controller.setupWidget('DayCheckBoxSat', {modelProperty: 'timeoutDay6'});
	this.controller.setupWidget('DayCheckBoxSun', {modelProperty: 'timeoutDay0'});		

	this.controller.setupWidget('StartTime', {
		label: 'Start', modelProperty: 'timeoutStart'});

	this.controller.setupWidget('CloseTime', {
		label: 'Close', modelProperty: 'timeoutClose'});

//
// DEFAULT MODE 
//

	if((this.type == "default") && (this.modeidx == undefined)) {
		this.handleSettingsChoose("everything");
	}
}

//

EditmodeAssistant.prototype.handleCommand = function(event) {
	if(event.type == Mojo.Event.back) {
		event.stop();

		if(this.retrieving) {
			var appCtl = Mojo.Controller.getAppController();
	
			appCtl.showBanner("Retrieving process still in progress", {});
									 
			return;
		}

		if((this.type == "default") || (this.currentView == "Configuration")) {
			this.controller.stageController.popScene();
			return;
		}
	}

	if((event.type == Mojo.Event.command) || (event.type == Mojo.Event.back)) {
		if((event.command == 'configuration') || (event.type == Mojo.Event.back)) {
			this.currentView = "Configuration";

			this.modelCommandMenu.items.clear();
			
			if(this.type == "custom") {
				this.modelCommandMenu.items.push({width: 5});
				this.modelCommandMenu.items.push({label: 'Settings', command: 'settings', width: 100});
				this.modelCommandMenu.items.push({label: 'Apps', command: 'applications', width: 80});
				this.modelCommandMenu.items.push({label: 'Triggers', command: 'triggers', width: 100});
				this.modelCommandMenu.items.push({width: 5});
			}
			else {
				this.modelCommandMenu.items.push({width: 5});
				this.modelCommandMenu.items.push({label: 'Settings', command: 'settings', width: 310});
				this.modelCommandMenu.items.push({width: 5});
			}

			this.controller.modelChanged(this.modelCommandMenu, this);
			
			this.appsView.style.display = 'none';
			this.settingsView.style.display = 'none';
			this.triggersView.style.display = 'none';
			this.configurationView.style.display = 'block';
			
			this.controller.sceneScroller.mojo.revealTop(0);

			var transition = null;

			transition = this.controller.prepareTransition(Mojo.Transition.crossFade);
	
			transition.run();
		}
		else if(event.command == 'settings') {
			this.currentView = "Settings";
			
			this.modelCommandMenu.items.clear();
			this.modelCommandMenu.items.push({});
			this.modelCommandMenu.items.push({label: 'Add System Setting', command: 'settings-add'});
			this.modelCommandMenu.items.push({});

			this.controller.modelChanged(this.modelCommandMenu, this);
			
			this.configurationView.style.display = 'none';
			this.triggersView.style.display = 'none';
			this.appsView.style.display = 'none';
			this.settingsView.style.display = 'block';
			this.controller.sceneScroller.mojo.revealTop(0);

			// FIXME: Bug in slider widget, it has to be visible on setup or refreshed .

			this.controller.modelChanged(this.modelSettingsList, this);

			var transition = null;

			transition = this.controller.prepareTransition(Mojo.Transition.crossFade);

			transition.run();
		}
		else if(event.command == 'applications') {
			this.currentView = "Applications";
			
			this.modelCommandMenu.items.clear();
			this.modelCommandMenu.items.push({});
			this.modelCommandMenu.items.push({label: 'Add Application', command: 'applications-add'});
			this.modelCommandMenu.items.push({});

			this.controller.modelChanged(this.modelCommandMenu, this);
			
			this.configurationView.style.display = 'none';
			this.triggersView.style.display = 'none';
			this.settingsView.style.display = 'none';
			this.appsView.style.display = 'block';
			this.controller.sceneScroller.mojo.revealTop(0);

			var transition = null;

			transition = this.controller.prepareTransition(Mojo.Transition.crossFade);
	
			transition.run();
		}
		else if(event.command == 'triggers') {
			this.currentView = "Triggers";

			this.modelCommandMenu.items.clear();
			this.modelCommandMenu.items.push({});
			this.modelCommandMenu.items.push({label: 'Add Activation Trigger', command: 'triggers-add'});
			this.modelCommandMenu.items.push({});

			this.controller.modelChanged(this.modelCommandMenu, this);

			this.configurationView.style.display = 'none';
			this.appsView.style.display = 'none';
			this.settingsView.style.display = 'none';
			this.triggersView.style.display = 'block';
			this.controller.sceneScroller.mojo.revealTop(0);

			var transition = null;

			transition = this.controller.prepareTransition(Mojo.Transition.crossFade);
	
			transition.run();
		}
		else if(event.command == 'settings-add') {
			var settingItems = [];

			if(this.mode.settingsList.length == 0)
				settingItems.push({label: "All System Settings", command: "everything"});
		
			if(this.checkConfigOption("settings", "connection") == null)
				settingItems.push({label: "Connection Settings", command: "connection"});
	
			if(this.checkConfigOption("settings", "messaging") == null)
				settingItems.push({label: "Messaging Settings", command: "messaging"});

			if(this.checkConfigOption("settings", "ringer") == null)
				settingItems.push({label: "Ringer Settings", command: "ringer"});
	
			if(this.checkConfigOption("settings", "screen") == null)
				settingItems.push({label: "Screen Settings", command: "screen"});

			if(this.checkConfigOption("settings", "sound") == null)
				settingItems.push({label: "Sound Settings", command: "sound"});

			this.controller.popupSubmenu({
				onChoose:  this.handleSettingsChoose.bind(this),
				items: settingItems});
		}
		else if(event.command == 'applications-add') {
			this.listLaunchPoints = this.controller.serviceRequest('palm://com.palm.applicationManager/', {
				method: 'listLaunchPoints', parameters: {},
				onSuccess: function(payload) {
					var appItems = [];

					this.launchPoints = payload.launchPoints;
				
					this.launchPoints.sort(this.sortAlphabeticallyFunction);
				
					this.launchPoints.each(function(item, index){
						appItems.push({label: item.title, command: index});
					}.bind(this));

					this.controller.popupSubmenu({
						onChoose:  this.handleAppsChoose.bind(this),
						items: appItems});
				}.bind(this)});
		}
		else if(event.command == 'triggers-add') {
			var triggerItems = [];
		
			triggerItems.push({label: "Charger Event Trigger", command: "charger"});

//			triggerItems.push({label: "GPS Location Trigger", command: "location"});

			triggerItems.push({label: "Time of Day Trigger", command: "timeout"});
	
			this.controller.popupSubmenu({
				onChoose:  this.handleTriggersChoose.bind(this),
				items: triggerItems});
		}	
		else if(event.command == 'launchpoint') {
			this.controller.serviceRequest('palm://com.palm.applicationManager/', {
				method: 'addLaunchPoint',
            parameters: {'id': 'com.palm.app.modeswitcher',
					'icon': 'images/default_icon.png',
					'title': this.mode.name,
					'params': {'action': 'execute', 'event': 'toggle', 'name': this.mode.name}}});
		}
		else if(event.command == 'retrieve') {
			this.mode.settingsList.clear();
		
			this.handleSettingsChoose("everything");
		}
	}
}

//

EditmodeAssistant.prototype.handleSettingsChoose = function(command) {
	if(command != undefined) {
		if((command == "connection") || (command == "everything"))
			this.mode.settingsList.push({"type": "connection", "connectionWiFi": "(querying)", "connectionBT": "(querying)", "connectionGPS": "(querying)", "connectionData": "(querying)", "connectionPhone": "(querying)"});

		if((command == "messaging") || (command == "everything"))
			this.mode.settingsList.push({"type": "messaging", "messagingIMStatus": "(querying)", "messagingSoundMode": "(querying)", "messagingRingtoneName": "(querying)", "messagingRingtonePath": ""});

		if((command == "ringer") || (command == "everything"))
			this.mode.settingsList.push({"type": "ringer", "ringerRingerOn": "(querying)", "ringerRingerOff": "(querying)", "ringerRingtoneName": "(querying)", "ringerRingtonePath": ""});

		if((command == "screen") || (command == "everything"))
			this.mode.settingsList.push({"type": "screen", "screenBrightnessLevel": "(querying)", "screenTurnOffTimeout": "(querying)", "screenWallpaperName": "(querying)", "screenWallpaperPath": ""});

		if((command == "sound") || (command == "everything"))
			this.mode.settingsList.push({"type": "sound", "soundRingerVolume": "(querying)", "soundSystemVolume": "(querying)", "soundMediaVolume": "(querying)"});

		this.retrieving = true;

		this.mode.settingsList.sort(this.sortAlphabeticallyFunction);

		var appCtl = Mojo.Controller.getAppController();
	
		appCtl.showBanner("Retrieving current system settings", {});

		if(command == "everything")
			this.retrieveCurrentSettings("connection", 0, 0, true);
		else
			this.retrieveCurrentSettings(command, 0, 0, false);
	}
}

EditmodeAssistant.prototype.handleAppsChoose = function(index) {
	if(index != undefined) {
		this.mode.appsList.push({name: this.launchPoints[index].title, appid: this.launchPoints[index].id});

		this.controller.sceneScroller.mojo.revealBottom();
	
		this.setModeData(true);
	}
}

EditmodeAssistant.prototype.handleTriggersChoose = function(command) {
	if(command != undefined) {
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

		// FIXME: Mojo bug, the time settings has to be in the model or it will fail...

		if(command == "charger") {
			this.mode.triggersList.push({"type": "charger", "chargerCharger": 1, "chargerDelay": 3, "timeoutStart": startTime, "timeoutClose": closeTime});
			this.mode.triggersList.sort(this.sortAlphabeticallyFunction);
		}
		else if(command == "location") {
			this.mode.triggersList.push({"type": "location", "locationRadius": 200, "locationLatitude": "(locating)", "locationLongitude": "(locating)", "timeoutStart": startTime, "timeoutClose": closeTime});
			this.mode.triggersList.sort(this.sortAlphabeticallyFunction);
	
			var index = this.mode.triggersList.length - 1;
		
			this.fetchCurrentLocation(index, 0);
		}
		else if(command == "timeout") {
			this.mode.triggersList.push({"type": "timeout", "timeoutDays": 0, "timeoutCustom": "none", "timeoutDay0": false, "timeoutDay1": false, "timeoutDay2": false, "timeoutDay3": false, "timeoutDay4": false, "timeoutDay5": false, "timeoutDay6": false, "timeoutStart": startTime, "timeoutClose": closeTime});
			this.mode.triggersList.sort(this.sortAlphabeticallyFunction);
		}
	
		this.setModeData(true);
	}
}

//

EditmodeAssistant.prototype.handleListTap = function(list, event) {
	if(event != undefined) {
		if(event.originalEvent.target.id == "Ringtone") {
			this.executeRingtoneSelect();
		}
		else if(event.originalEvent.target.id == "Wallpaper") {
			this.executeWallpaperSelect();
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
	if(this.requestCurrentSettings) {
		this.requestCurrentSettings.cancel();
		this.retrieving = false;
	}

	if(list == "settings")
		this.mode.settingsList.splice(event.index,1);
	else if(list == "apps")
		this.mode.appsList.splice(event.index,1);
	else if(list == "triggers")
		this.mode.triggersList.splice(event.index,1);
			
	this.setModeData(false);
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

EditmodeAssistant.prototype.checkConfigOption = function(list, option){
	var index = null;

	if(list == "settings") {
		for(var i = 0; i < this.mode.settingsList.length; i++) {
			if(this.mode.settingsList[i].type == option)
				index = i;
		}
	}
	else if(list == "apps") {
		for(var i = 0; i < this.mode.appsList.length; i++) {
			if(eval("this.mode.appsList[i]." + option) != undefined)
				index = i;
		}
	}
	else if(list == "triggers") {
		for(var i = 0; i < this.mode.triggersList.length; i++) {
			if(this.mode.triggersList[i].type == option)
				index = i;
		}
	}

	return index;
}

EditmodeAssistant.prototype.checkModeName = function(no) {
	if(no == 0)
		var name = this.modelNameText.value;
	else
		var name = this.modelNameText.value + '-' + no;
	
	if((this.type == "custom") && (this.modelNameText.value == "Default Mode"))
		return false;
		
	for(var i = 0 ; i < this.modes.length ; i++) {
		if((i != this.modeidx) && (this.modes[i].name == name))
			return false;
	}
	
	return true;
}

//

EditmodeAssistant.prototype.retrieveCurrentSettings = function(settings, request, retry, all) {
	this.controller.modelChanged(this.modelSettingsList, this);

	if(retry == 5) {
		Mojo.Log.info("Skipping " + settings + " system settings (" + request + ")");
		request++;
	}

	if(settings == "connection") {
		var index = this.checkConfigOption("settings", "connection");

		if(request == 0) {
			this.requestCurrentSettings = this.controller.serviceRequest('palm://com.palm.wifi/', {
				method: 'getstatus',
				parameters: {'subscribe': false},
				onSuccess: function(index, all, payload) {
					if (payload.status == 'serviceDisabled')
						this.mode.settingsList[index].connectionWiFi = 0;
					else
						this.mode.settingsList[index].connectionWiFi = 1;

					this.retrieveCurrentSettings("connection", 1, 0, all);
				}.bind(this, index, all),
				onFailure: this.retrieveCurrentSettings.bind(this, "connection", 0, ++retry, all)});
		}
		else if(request == 1) {	
			this.requestCurrentSettings = this.controller.serviceRequest('palm://com.palm.btmonitor/monitor/',{
				method:'getradiostate',
				onSuccess: function(index, all, payload) {
					if((payload.radio == "turningoff") || (payload.radio == "off"))
						this.mode.settingsList[index].connectionBT = 0;
					else
						this.mode.settingsList[index].connectionBT = 1;

					this.retrieveCurrentSettings("connection", 2, 0, all);
				}.bind(this, index, all),
				onFailure: this.retrieveCurrentSettings.bind(this, "connection", 1, ++retry, all)});
		}
		else if(request == 2) {			
			this.requestCurrentSettings = this.controller.serviceRequest('palm://com.palm.location/', {
				method: 'getUseGps',
				parameters: {},
				onSuccess: function(index, all, payload) {
					if(payload.useGps == true)
						this.mode.settingsList[index].connectionGPS = 1;
					else
						this.mode.settingsList[index].connectionGPS = 0;

					this.retrieveCurrentSettings("connection", 3, 0, all);
				}.bind(this, index, all),
				onFailure: this.retrieveCurrentSettings.bind(this, "connection", 2, ++retry, all)});
		}
		else if(request == 3) {			
			this.requestCurrentSettings = this.controller.serviceRequest('palm://com.palm.connectionmanager/', {
				method: 'getstatus',
				parameters: {},
				onSuccess: function(index, all, payload) {
					if(payload.wan.state == "connected")
						this.mode.settingsList[index].connectionData = 1;
					else if(payload.wan.state == "disconnected")
						this.mode.settingsList[index].connectionData = 0;
				
					this.retrieveCurrentSettings("connection", 4, 0, all);
				}.bind(this, index, all),
				onFailure: this.retrieveCurrentSettings.bind(this, "connection", 3, ++retry, all)});
		}
		else if(request == 4) {			
			this.requestCurrentSettings = this.controller.serviceRequest('palm://com.palm.telephony/', {
				method: 'powerQuery',
				onSuccess: function(index, all, payload) {
					if((payload.extended.powerState) && (payload.extended.powerState == 'on'))
						this.mode.settingsList[index].connectionPhone = 1;		
					else
						this.mode.settingsList[index].connectionPhone = 0;
				
					if(all)
						this.retrieveCurrentSettings("messaging", 0, 0, all);
					else
						this.retrievedCurrentSettings();
				}.bind(this, index, all),
				onFailure: this.retrieveCurrentSettings.bind(this, "connection", 4, ++retry, all)});
		}
		else {
			if(all)
				this.retrieveCurrentSettings("messaging", 0, 0, all);
			else
				this.retrievedCurrentSettings();
		}
	}
	else if(settings == "messaging") {
		var index = this.checkConfigOption("settings", "messaging");

		if(request == 0) {
			this.requestCurrentSettings = this.controller.serviceRequest('palm://com.palm.messaging/', {
				method: 'getAccountList',
				parameters: {'subscribe': false},
				onSuccess: function(index, all, payload) {
					if(payload.count > 0) {
						this.mode.settingsList[index].messagingIMStatus = payload.list[0].availability;
					}
				
					this.retrieveCurrentSettings("messaging", 1, 0, all);
				}.bind(this, index, all),
				onFailure: this.retrieveCurrentSettings.bind(this, "messaging", 0, ++retry, all)});
		}
		else if(request == 1) {
			this.requestCurrentSettings = this.controller.serviceRequest("palm://com.palm.messaging/", {
				method: 'getNotificationPreferences', 
				parameters: {'subscribe':false},
				onSuccess: function(index, all, payload) {
					this.mode.settingsList[index].messagingSoundMode = payload.isEnabledNotificationSound;
								
					if(all)
						this.retrieveCurrentSettings("ringer", 0, 0, all);
					else
						this.retrievedCurrentSettings();
				}.bind(this, index, all),
				onFailure: this.retrieveCurrentSettings.bind(this, "messaging", 1, ++retry, all)});
		}
		else {
			if(all)
				this.retrieveCurrentSettings("ringer", 0, 0, all);
			else
				this.retrievedCurrentSettings();
		}
		
		// FIXME: No way to get the messaging ringtone yet.
		
		//	this.mode.settingsList[index].messagingRingtoneName = payload.ringtoneName;
		//	this.mode.settingsList[index].messagingRingtonePath = payload.ringtonePath;
	}
	else if(settings == "ringer") {
		var index = this.checkConfigOption("settings", "ringer");

		if(request == 0) {		
			this.requestCurrentSettings = new Mojo.Service.Request('palm://com.palm.audio/vibrate/', {
				method: 'get',
				parameters: {},
				onSuccess: function(index, all, payload) {
					if(payload.VibrateWhenRingerOn == false)
						this.mode.settingsList[index].ringerRingerOn = 2;
					else
						this.mode.settingsList[index].ringerRingerOn = 1;

					if(payload.VibrateWhenRingerOff == false)
						this.mode.settingsList[index].ringerRingerOff = 2;
					else
						this.mode.settingsList[index].ringerRingerOff = 1;

					this.retrieveCurrentSettings("ringer", 1, 0, all);
				}.bind(this, index, all),
				onFailure: this.retrieveCurrentSettings.bind(this, "ringer", 0, ++retry, all)});
		}
		else if(request == 1) {
			this.requestCurrentSettings = new Mojo.Service.Request("palm://com.palm.systemservice/", {
				method: 'getPreferences', 
				parameters: {'subscribe':false, 'keys': ["ringtone"]},
				onSuccess: function(index, all, payload) {
					this.mode.settingsList[index].ringerRingtoneName = payload.ringtone.name;
					this.mode.settingsList[index].ringerRingtonePath = payload.ringtone.fullPath;
						
					if(all)
						this.retrieveCurrentSettings("screen", 0, 0, all);
					else
						this.retrievedCurrentSettings();
				}.bind(this, index, all),
				onFailure: this.retrieveCurrentSettings.bind(this, "ringer", 1, ++retry, all)});
		}
		else {
			if(all)
				this.retrieveCurrentSettings("screen", 0, 0, all);
			else
				this.retrievedCurrentSettings();
		}
	}
	else if(settings == "screen") {
		var index = this.checkConfigOption("settings", "screen");

		if(request == 0) {
			this.requestCurrentSettings = this.controller.serviceRequest('palm://com.palm.display/control/', {
				method: 'getProperty',
				parameters:{properties:['maximumBrightness','timeout']},
				onSuccess: function(index, all, payload) {
					this.mode.settingsList[index].screenBrightnessLevel = payload.maximumBrightness;
					this.mode.settingsList[index].screenTurnOffTimeout = payload.timeout;

					this.retrieveCurrentSettings("screen", 1, 0, all);
				}.bind(this, index, all),
				onFailure: this.retrieveCurrentSettings.bind(this, "screen", 0, ++retry, all)});
		}
		else if(request == 1) {
			this.requestCurrentSettings = new Mojo.Service.Request("palm://com.palm.systemservice/", {
				method: 'getPreferences', 
				parameters: {'subscribe':false, 'keys': ["wallpaper"]},
				onSuccess: function(index, all, payload) {
					this.mode.settingsList[index].screenWallpaperName = payload.wallpaper.wallpaperName;
					this.mode.settingsList[index].screenWallpaperPath = payload.wallpaper.wallpaperFile;

					if(all)
						this.retrieveCurrentSettings("sound", 0, 0, all);
					else
						this.retrievedCurrentSettings();
				}.bind(this, index, all),
				onFailure: this.retrieveCurrentSettings.bind(this, "screen", 1, ++retry, all)});
		}
		else {
			if(all)
				this.retrieveCurrentSettings("sound", 0, 0, all);
			else
				this.retrievedCurrentSettings();
		}
	}
	else if(settings == "sound") {
		var index = this.checkConfigOption("settings", "sound");

		if(request == 0) {
			this.requestCurrentSettings = this.controller.serviceRequest('palm://com.palm.audio/ringtone/', {
				method: 'getVolume',
				parameters: {},
				onSuccess: function(index, all, payload) {
					this.mode.settingsList[index].soundRingerVolume = payload.volume;
				
					this.retrieveCurrentSettings("sound", 1, 0, all);
				}.bind(this, index, all),
				onFailure: this.retrieveCurrentSettings.bind(this, "sound", 0, ++retry, all)});
		}
		else if(request == 1) {
			this.requestCurrentSettings = this.controller.serviceRequest('palm://com.palm.audio/system/', {
				method: 'status',
				parameters: {},
				onSuccess: function(index, all, payload) {
					this.mode.settingsList[index].soundSystemVolume = payload.volume;
				
					this.retrieveCurrentSettings("sound", 2, 0, all);
				}.bind(this, index, all),
				onFailure: this.retrieveCurrentSettings.bind(this, "sound", 1, ++retry, all)});
		}
		else if(request == 2) {
			this.requestCurrentSettings = this.controller.serviceRequest('palm://com.palm.audio/media/', {
				method: 'status',
				parameters: {},
				onSuccess: function(index, all, payload) {
					this.mode.settingsList[index].soundMediaVolume = payload.volume;
					
					this.retrievedCurrentSettings();
				}.bind(this, index, all),
				onFailure: this.retrieveCurrentSettings.bind(this, "sound", 2, ++retry, all)});
		}
		else
			this.retrievedCurrentSettings();
	}
}

EditmodeAssistant.prototype.retrievedCurrentSettings = function() {
	this.setModeData(true);

	this.retrieving = false;

	var appCtl = Mojo.Controller.getAppController();
	
	appCtl.showBanner("Retrieving system settings finished", {});
}

//

EditmodeAssistant.prototype.executeRingtoneSelect = function(event) {
	Mojo.FilePicker.pickFile({"defaultKind": "ringtone", "kinds": ["ringtone"], "actionType": "attach", 
		"actionName": "Done", "onSelect": function(payload) {
			var index = this.checkConfigOption("settings", "ringer");
			this.mode.settingsList[index].ringerRingtoneName = payload.name;
			this.mode.settingsList[index].ringerRingtonePath = payload.fullPath;

			this.setModeData(true);
		}.bind(this)},
	this.controller.stageController);
}


EditmodeAssistant.prototype.executeWallpaperSelect = function(event) {
	Mojo.FilePicker.pickFile({"kinds": ["image"], "actionType": "open", 
		"actionName": "Select wallpaper", "crop": {"width": 318,"height":479},
		"onSelect": function(payload) {
			if((!payload) || (!payload.fullPath)) {
				var index = this.checkConfigOption("settings", "screen");
				this.mode.settingsList[index].screenWallpaperName = "Default";
				this.mode.settingsList[index].screenWallpaperPath = "";

				this.setModeData(true);
				return;
			}
	
			var params = {"target": encodeURIComponent(payload.fullPath)};
	
			if(payload.cropInfo.window) {
				if(payload.cropInfo.window.scale)
					params["scale"] = payload.cropInfo.window.scale;
		
				if(payload.cropInfo.window.focusX)
					params["focusX"] = payload.cropInfo.window.focusX;
		
				if(payload.cropInfo.window.focusY)
					params["focusY"] = payload.cropInfo.window.focusY;
			}			
		
			var importWallpaperRequest = this.controller.serviceRequest("palm://com.palm.systemservice/wallpaper/", {
				method: 'importWallpaper', 
				parameters: params,
				onSuccess: function(payload) {
					var index = this.checkConfigOption("settings", "screen");
					if(payload.wallpaper) {
//						this.mode.settingsList[index].screenWallpaperName = "Selected";
						this.mode.settingsList[index].screenWallpaperName = payload.wallpaper.wallpaperName;
						this.mode.settingsList[index].screenWallpaperPath = payload.wallpaper.wallpaperFile;
					}
					else {
						this.mode.settingsList[index].screenWallpaperName = "Default";
						this.mode.settingsList[index].screenWallpaperPath = "";
					}
					
					this.setModeData(true);
				}.bind(this),
				onFailure: function(payload) {
					var index = this.checkConfigOption("settings", "screen");

					this.mode.settingsList[index].screenWallpaperName = "Default";
					this.mode.settingsList[index].screenWallpaperPath = "";
				
					this.setModeData(true);
				}.bind(this)});
		}.bind(this)},
	this.controller.stageController);
}

//

EditmodeAssistant.prototype.fetchCurrentLocation = function(index, count) {
	if(count < 3) {
		count = count + 1;

		this.requestLocation = this.controller.serviceRequest('palm://com.palm.location/', {
			method:'getCurrentPosition',
			parameters:{Accuracy: 1},
			onSuccess: function(index, event){
				this.mode.triggersList[index].locationLatitude = Math.round(event.latitude*1000000)/1000000;
				this.mode.triggersList[index].locationLongitude = Math.round(event.longitude*1000000)/1000000;
					
				this.setModeData(true);
			}.bind(this, index),
			onFailure: function(index, count){
				this.fetchCurrentLocation(index, count);
			}.bind(this, index, count)});
	}
	else {
		this.mode.triggersList[index].locationLatitude = "(failed)";
		this.mode.triggersList[index].locationLongitude = "(failed)";
					
		this.setModeData(true);
	}
}

//

EditmodeAssistant.prototype.getModeData = function() {
	if(this.type == "default") {
		return this.defmode;
	}
	else {
		var mode = {
			name: this.modes[this.modeidx].name,
			type: this.modes[this.modeidx].type,
						
			notifyMode: this.modes[this.modeidx].notifyMode,
			
			autoStart: this.modes[this.modeidx].autoStart,
			autoClose: this.modes[this.modeidx].autoClose,
			
			settings: {charging: this.modes[this.modeidx].settings.charging},
						
			apps: {
				start: this.modes[this.modeidx].apps.start,
				close: this.modes[this.modeidx].apps.close
			},
			
			triggers: {required: this.modes[this.modeidx].triggers.required},
			
			settingsList: [],
			appsList: [],
			triggersList: []
		};
	
		for(var i = 0; i < this.modes[this.modeidx].settingsList.length; i++) {
			if(this.modes[this.modeidx].settingsList[i].type == "connection") {
				mode.settingsList.push({"type": "connection",
					"connectionWiFi": this.modes[this.modeidx].settingsList[i].connectionWiFi,
					"connectionBT": this.modes[this.modeidx].settingsList[i].connectionBT, 
					"connectionGPS": this.modes[this.modeidx].settingsList[i].connectionGPS, 
					"connectionData": this.modes[this.modeidx].settingsList[i].connectionData,
					"connectionPhone": this.modes[this.modeidx].settingsList[i].connectionPhone});
			}
			else if(this.modes[this.modeidx].settingsList[i].type == "messaging") {
				mode.settingsList.push({"type": "messaging",
					"messagingIMStatus": this.modes[this.modeidx].settingsList[i].messagingIMStatus,
					"messagingSoundMode": this.modes[this.modeidx].settingsList[i].messagingSoundMode, 
					"messagingRingtoneName": this.modes[this.modeidx].settingsList[i].messagingRingtoneName, 
					"messagingRingtonePath": this.modes[this.modeidx].settingsList[i].messagingRingtonePath});
			}
			else if(this.modes[this.modeidx].settingsList[i].type == "ringer") {
				mode.settingsList.push({"type": "ringer",
					"ringerRingerOn": this.modes[this.modeidx].settingsList[i].ringerRingerOn,
					"ringerRingerOff": this.modes[this.modeidx].settingsList[i].ringerRingerOff, 
					"ringerRingtoneName": this.modes[this.modeidx].settingsList[i].ringerRingtoneName, 
					"ringerRingtonePath": this.modes[this.modeidx].settingsList[i].ringerRingtonePath});
			}
			else if(this.modes[this.modeidx].settingsList[i].type == "screen") {
				mode.settingsList.push({"type": "screen",
					"screenBrightnessLevel": this.modes[this.modeidx].settingsList[i].screenBrightnessLevel,
					"screenTurnOffTimeout": this.modes[this.modeidx].settingsList[i].screenTurnOffTimeout, 
					"screenWallpaperName": this.modes[this.modeidx].settingsList[i].screenWallpaperName, 
					"screenWallpaperPath": this.modes[this.modeidx].settingsList[i].screenWallpaperPath});
			}
			else if(this.modes[this.modeidx].settingsList[i].type == "sound") {
				mode.settingsList.push({"type": "sound",
					"soundRingerVolume": this.modes[this.modeidx].settingsList[i].soundRingerVolume,
					"soundSystemVolume": this.modes[this.modeidx].settingsList[i].soundSystemVolume, 
					"soundMediaVolume": this.modes[this.modeidx].settingsList[i].soundMediaVolume});
			}
		}
	
		for(var i = 0; i < this.modes[this.modeidx].appsList.length; i++) {
			mode.appsList.push({"name": this.modes[this.modeidx].appsList[i].name, 
				"appid": this.modes[this.modeidx].appsList[i].appid,
				"params": this.modes[this.modeidx].appsList[i].params});
		}

		// FIXME: dates need to be in every item even if timepickers are hidden (bug).
	
		var date = new Date();

		for(var i = 0; i < this.modes[this.modeidx].triggersList.length; i++) {
			if(this.modes[this.modeidx].triggersList[i].type == "charger") {
				mode.triggersList.push({"type": "charger", 
					"chargerCharger": this.modes[this.modeidx].triggersList[i].chargerCharger,
					"chargerDelay": this.modes[this.modeidx].triggersList[i].chargerDelay,
					"timeoutStart": date,
					"timeoutClose": date});
			}
			else if(this.modes[this.modeidx].triggersList[i].type == "location") {
				mode.triggersList.push({"type": "location", 
					"locationRadius": this.modes[this.modeidx].triggersList[i].locationRadius,
					"locationLatitude": this.modes[this.modeidx].triggersList[i].locationLatitude,
					"locationLongitude": this.modes[this.modeidx].triggersList[i].locationLongitude,
					"timeoutStart": date,
					"timeoutClose": date});
			}
			else if(this.modes[this.modeidx].triggersList[i].type == "timeout") {
				var startDate = new Date(this.modes[this.modeidx].triggersList[i].timeoutStart * 1000);
				var closeDate = new Date(this.modes[this.modeidx].triggersList[i].timeoutClose * 1000);

				if(this.modes[this.modeidx].triggersList[i].timeoutDays == 3)
					var display = "block";
				else
					var display = "none";

				mode.triggersList.push({"type": "timeout", 
					"timeoutDays": this.modes[this.modeidx].triggersList[i].timeoutDays,
					"timeoutCustom": display,
					"timeoutDay0": this.modes[this.modeidx].triggersList[i].timeoutCustom[0],
					"timeoutDay1": this.modes[this.modeidx].triggersList[i].timeoutCustom[1],
					"timeoutDay2": this.modes[this.modeidx].triggersList[i].timeoutCustom[2],
					"timeoutDay3": this.modes[this.modeidx].triggersList[i].timeoutCustom[3],
					"timeoutDay4": this.modes[this.modeidx].triggersList[i].timeoutCustom[4],
					"timeoutDay5": this.modes[this.modeidx].triggersList[i].timeoutCustom[5],
					"timeoutDay6": this.modes[this.modeidx].triggersList[i].timeoutCustom[6],					
					"timeoutStart": startDate,
					"timeoutClose": closeDate});
			}
		}

		return mode;
	}
}

EditmodeAssistant.prototype.setModeData = function(refresh) {
	if(refresh) {
		if(this.currentView == "Settings")
			this.controller.modelChanged(this.modelSettingsList, this);
		else if(this.currentView == "Applications")
			this.controller.modelChanged(this.modelAppsList, this);
		else if(this.currentView == "Triggers") {
			for(var i = 0; i < this.mode.triggersList.length; i++) {
				if(this.mode.triggersList[i].type == "timeout") {
					if(this.mode.triggersList[i].timeoutDays == 3)
						this.mode.triggersList[i].timeoutCustom = "block";
					else
						this.mode.triggersList[i].timeoutCustom = "none";
				}
			}
			
			this.controller.modelChanged(this.modelTriggersList, this);
		}
	}

	if(this.type == "default") {
		this.mode.settings.charging = this.modelChargingSelector.value;
		
		this.appAssistant.defmode = this.mode;
		
		this.appAssistant.saveConfigData("defmode");
	}
	else {
		if(this.modelNameText.value.length == 0)
		{
			this.modelNameText.value = 'New Mode';
			this.controller.modelChanged(this.modelNameText, this);
		}

		var i = 0;
	
		while(!this.checkModeName(i++));

		if(--i > 0) {
			this.modelNameText.value = this.modelNameText.value + '-' + i;
			this.controller.modelChanged(this.modelNameText, this);
		}

		var mode = {
			name: this.modelNameText.value,
			type: this.mode.type,
			
			notifyMode: this.modelNotifySelector.value,
			
			autoStart: this.modelStartSelector.value,
			autoClose: this.modelCloseSelector.value,
		
			settings: {charging: this.modelChargingSelector.value},
				
			apps: {
				start: this.modelAppsStartSelector.value,
				close: this.modelAppsCloseSelector.value
			},
			
			triggers: {required: this.modelRequiredSelector.value},
			
			settingsList: [],
			appsList: [],
			triggersList: []		
		};
	
		for(var i = 0; i < this.mode.settingsList.length; i++) {
			if(this.mode.settingsList[i].type == "connection") {
				mode.settingsList.push({"type": "connection",
					"connectionWiFi": this.mode.settingsList[i].connectionWiFi,
					"connectionBT": this.mode.settingsList[i].connectionBT, 
					"connectionGPS": this.mode.settingsList[i].connectionGPS, 
					"connectionData": this.mode.settingsList[i].connectionData,
					"connectionPhone": this.mode.settingsList[i].connectionPhone});
			}
			else if(this.mode.settingsList[i].type == "messaging") {
				mode.settingsList.push({"type": "messaging",
					"messagingIMStatus": this.mode.settingsList[i].messagingIMStatus,
					"messagingSoundMode": this.mode.settingsList[i].messagingSoundMode, 
					"messagingRingtoneName": this.mode.settingsList[i].messagingRingtoneName, 
					"messagingRingtonePath": this.mode.settingsList[i].messagingRingtonePath});
			}
			else if(this.mode.settingsList[i].type == "ringer") {
				mode.settingsList.push({"type": "ringer",
					"ringerRingerOn": this.mode.settingsList[i].ringerRingerOn,
					"ringerRingerOff": this.mode.settingsList[i].ringerRingerOff, 
					"ringerRingtoneName": this.mode.settingsList[i].ringerRingtoneName, 
					"ringerRingtonePath": this.mode.settingsList[i].ringerRingtonePath});
			}
			else if(this.mode.settingsList[i].type == "screen") {
				mode.settingsList.push({"type": "screen",
					"screenBrightnessLevel": this.mode.settingsList[i].screenBrightnessLevel,
					"screenTurnOffTimeout": this.mode.settingsList[i].screenTurnOffTimeout, 
					"screenWallpaperName": this.mode.settingsList[i].screenWallpaperName, 
					"screenWallpaperPath": this.mode.settingsList[i].screenWallpaperPath});
			}
			else if(this.mode.settingsList[i].type == "sound") {
				mode.settingsList.push({"type": "sound",
					"soundRingerVolume": this.mode.settingsList[i].soundRingerVolume,
					"soundSystemVolume": this.mode.settingsList[i].soundSystemVolume, 
					"soundMediaVolume": this.mode.settingsList[i].soundMediaVolume});
			}
		}
	
		for(var i = 0; i < this.mode.appsList.length; i++) {
			mode.appsList.push({"name": this.mode.appsList[i].name, 
				"appid": this.mode.appsList[i].appid,
				"params": this.mode.appsList[i].params});
		}

		for(var i = 0; i < this.mode.triggersList.length; i++) {
			if(this.mode.triggersList[i].type == "charger") {
				mode.triggersList.push({"type": "charger", 
					"chargerCharger": this.mode.triggersList[i].chargerCharger,
					"chargerDelay": this.mode.triggersList[i].chargerDelay});
			}
			else if(this.mode.triggersList[i].type == "location") {
				mode.triggersList.push({"type": "location", 
					"locationRadius": this.mode.triggersList[i].locationRadius,
					"locationLatitude": this.mode.triggersList[i].locationLatitude,
					"locationLongitude": this.mode.triggersList[i].locationLongitude});
			}
			else if(this.mode.triggersList[i].type == "timeout") {
				var days = new Array();
			
				for(var j = 0; j < 7; j++) {
					if(eval("this.mode.triggersList[" + i + "].timeoutDay" + j) == true)
						days.push(true);
					else
						days.push(false);
				}
			
				mode.triggersList.push({"type": "timeout", 
					"timeoutDays": this.mode.triggersList[i].timeoutDays,
					"timeoutCustom": days,
					"timeoutStart": this.mode.triggersList[i].timeoutStart.getTime() / 1000,
					"timeoutClose": this.mode.triggersList[i].timeoutClose.getTime() / 1000});
			}
		}

		if(this.modeidx == undefined)
		{
			this.modeidx = this.appAssistant.modes.length;
			this.appAssistant.modes.push(mode);
		}
		else {
			this.appAssistant.modes.splice(this.modeidx, 1, mode);
		}

		this.appAssistant.saveConfigData("modes");
	}
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
}

EditmodeAssistant.prototype.cleanup = function(event) {
	/* This function should do any cleanup needed before the scene is destroyed as a result
	 * of being popped off the scene stack.
	 */    
}

