function SceneAssistant(action, choice, config, callback) {
	this.action = action;

	this.choice = choice;

	this.config = config;
	
	this.callback = callback;

	this.save = false;
}

//

SceneAssistant.prototype.setup = function() {
	if((this.action == "emailAlert") || (this.action == "emailRingtone") || (this.action == "emailSync")) {
		this.controller.get('configuration').show();
	
		this.controller.serviceRequest("palm://com.palm.mail/", {
			'method': "accountList", 'parameters': {'subscribe': false}, 
			'onComplete': this.handleEmailAccounts.bind(this)} );

		if(this.action == "emailAlert")
			this.itemsViewMenu = [{'label': "Email Alert Configuration", 'command': "", 'width': 320}];
		else if(this.action == "emailRingtone")
			this.itemsViewMenu = [{'label': "Email Ringtone Configuration", 'command': "", 'width': 320}];
		else if(this.action == "emailSync")
			this.itemsViewMenu = [{'label': "Email Sync Configuration", 'command': "", 'width': 320}];

		this.modelViewMenu = {'visible': true, 'items': this.itemsViewMenu};

		this.controller.setupWidget(Mojo.Menu.viewMenu, undefined, this.modelViewMenu);	
		
		this.modelAccountsList = {items: []};
	
		this.controller.setupWidget("AccountsList", {
			itemTemplate: 'scene/listitem-config',
			swipeToDelete: false,
			autoconfirmDelete: false,
			reorderable: false},
			this.modelAccountsList);
		
		if(this.action == "emailAlert") {
			this.choicesConfigSelector = [
				{'label': this.choice, 'value': -1},
				{'label': "Vibrate", 'value': 2},
				{'label': "System Sound", 'value': 1},
				{'label': "Ringtone", 'value': 3},
				{'label': "Mute", 'value': 0} ];  

			this.controller.setupWidget("ConfigSelector", {'label': "Alert", 
				'labelPlacement': "left", 'modelProperty': "emailAlert",
				'choices': this.choicesConfigSelector});
		}
		else if(this.action == "emailRingtone") {
			this.choicesConfigSelector = [
				{'label': this.choice, 'value': ""},
				{'label': "Select", 'value': "select"} ];  

			this.controller.setupWidget("ConfigSelector", {'label': "Ringtone", 
				'labelPlacement': "left", 'modelProperty': "emailRingtoneName",
				'choices': this.choicesConfigSelector});
				
			Mojo.Event.listen(this.controller.get("AccountsList"), Mojo.Event.propertyChange, 
				this.handleRingtoneSelect.bind(this));
		}		
		else if(this.action == "emailSync") {
			this.choicesConfigSelector = [
				{'label': this.choice, 'value': -1},
				{'label': "As Items Arrive", 'value': 0}, 
				{'label': "5 Minutes", 'value': 5},
				{'label': "10 Minutes", 'value': 10},
				{'label': "15 Minutes", 'value': 15},
				{'label': "30 Minutes", 'value': 30},
				{'label': "1 Hour", 'value': 60},
				{'label': "6 Hours", 'value': 360},		
				{'label': "12 Hours", 'value': 720},
				{'label': "24 Hours", 'value': 1440},		
				{'label': "Manual", 'value': 1000000} ];

			this.controller.setupWidget("ConfigSelector", {'label': "Get Email", 
				'labelPlacement': "left", 'modelProperty': "emailSync",
				'choices': this.choicesConfigSelector});
		}
		
		this.modelDoneButton = {buttonClass: '', disabled: false};

		this.controller.setupWidget('DoneButton', 
			{label: "Done Configuring"}, this.modelDoneButton);
			
		Mojo.Event.listen(this.controller.get('DoneButton'), Mojo.Event.tap, 
			this.close.bind(this));
	}
	else if(this.action == "imStatus") {
		this.controller.get('configuration').show();

		this.controller.serviceRequest('palm://im.libpurpleext.greg/', { 
			'method': "GetAcceptBadCertSetting", 'parameters': {}, 
			'onSuccess': this.handleIMStatusTest.bind(this),
			'onFailure': this.handleIMStatusTest.bind(this)});

		this.itemsViewMenu = [{'label': "IM Status Configuration", 'command': "", 'width': 320}];

		this.modelViewMenu = {'visible': true, 'items': this.itemsViewMenu};

		this.controller.setupWidget(Mojo.Menu.viewMenu, undefined, this.modelViewMenu);	
			
		this.modelAccountsList = {items: []};
	
		this.controller.setupWidget("AccountsList", {
			itemTemplate: 'scene/listitem-config',
			swipeToDelete: false,
			autoconfirmDelete: false,
			reorderable: false},
			this.modelAccountsList);
		
		this.choicesConfigSelector = [
			{'label': this.choice, 'value': -1},
			{'label': "Available", 'value': 0},
			{'label': "Busy", 'value': 2},
			{'label': "Sign Off", 'value': 4} ];

		this.controller.setupWidget("ConfigSelector", {'label': "Status", 
			'labelPlacement': "left", 'modelProperty': "messagingIMStatus",
			'choices': this.choicesConfigSelector});

		this.modelDoneButton = {buttonClass: '', disabled: false};

		this.controller.setupWidget('DoneButton', 
			{label: "Done Configuring"}, this.modelDoneButton);
			
		Mojo.Event.listen(this.controller.get('DoneButton'), Mojo.Event.tap, 
			this.close.bind(this));
	}
	else {
		this.modelList = {items: []};
	
		this.controller.setupWidget("AccountsList", {}, this.modelList);
	
		this.modelButton = {buttonClass: '', disabled: false};

		this.controller.setupWidget('DoneButton', {label: ""}, this.modelButton);
	}
}

//

SceneAssistant.prototype.handleEmailAccounts = function(response) {
	if(response.list) {
		for(var i = 0; i < response.list.length; i++) {
			this.controller.serviceRequest("palm://com.palm.mail/", {'method': "accountPreferences",
				'parameters': {'subscribe': false, 'account': response.list[i].id}, 
				'onComplete': this.handleEmailAccount.bind(this)} );
		}
	}
}

SceneAssistant.prototype.handleEmailAccount = function(response) {
	var emailAlert = -1;
	var emailRingtoneName = "";
	var emailRingtonePath = "";
	var emailSync = -1;

	for(var i = 0; i < this.config.length; i++) {
		if(response.id == this.config[i].accountId) {
			if(this.action == "emailAlert") {
				emailAlert = this.config[i].emailAlert;
			}
			else if(this.action == "emailRingtone") {
				emailRingtoneName = this.config[i].emailRingtone.name;
				emailRingtonePath = this.config[i].emailRingtone.path;
			}
			else if(this.action == "emailSync") {
				emailSync = this.config[i].emailSync;
			}
		
			break;
		}
	}
	
	if(this.action == "emailAlert") {
		this.modelAccountsList.items.push({
			'configTitle': response.name + " - " + response.originalLogin, 
			'accountId': response.id,
			'emailAlert': emailAlert});
	}
	else if(this.action == "emailRingtone") {
		this.modelAccountsList.items.push({
			'configTitle': response.name + " - " + response.originalLogin, 
			'accountId': response.id,
			'emailRingtoneName': emailRingtoneName,
			'emailRingtonePath': emailRingtonePath});
	}
	else if(this.action == "emailSync") {
		this.modelAccountsList.items.push({
			'configTitle': response.name + " - " + response.originalLogin, 
			'accountId': response.id,
			'emailSync': emailSync});
	}

	this.controller.modelChanged(this.modelAccountsList, this);
}

//

SceneAssistant.prototype.handleIMStatusTest = function(response) {
	if(response.errorCode != undefined)
		this.showIMStatusError(response);
	else {
		this.controller.serviceRequest('palm://com.palm.messaging/', { 
			'method': "getAccountList", 'parameters': {'subscribe': false}, 
			'onSuccess': this.handleIMAccounts.bind(this, 0),
			'onFailure': this.showIMStatusError.bind(this)});
	}
}

SceneAssistant.prototype.showIMStatusError = function(response) {
	this.controller.get('ErrorText').update(
		"Unable to retrieve per account configuration. " +
		"Maybe you don't have messaging plugins installed?");
}

SceneAssistant.prototype.handleIMAccounts = function(index, response) {
	if(index < response.list.length) {
		var messagingIMStatus = -1;
	
		for(var i = 0; i < this.config.length; i++) {
			if(response.list[index].accountId == this.config[i].accountId) {
				messagingIMStatus = this.config[i].messagingIMStatus;
			
				break;
			}
		}

		this.modelAccountsList.items.push({
			'configTitle': response.list[index].accountDisplayName + " - " + response.list[index].username, 
			'accountId': response.list[index].accountId,
			'accountDomain': response.list[index].domain,
			'accountUsername': response.list[index].username,
			'messagingIMStatus': messagingIMStatus});

		this.controller.modelChanged(this.modelAccountsList, this);

		this.handleIMAccounts(++index, response);
	}
}

//

SceneAssistant.prototype.handleRingtoneSelect = function(event) {
	event.model.emailRingtoneName = "";		
	event.model.emailRingtonePath = "";		
		
	this.controller.modelChanged(event.model, this);

	if(event.value == "select") {
		this.executeRingtoneSelect(event.model);
	}
}

SceneAssistant.prototype.executeRingtoneSelect = function(config) {
	Mojo.FilePicker.pickFile({'defaultKind': "ringtone", 'kinds': ["ringtone"], 
		'actionType': "attach", 'actionName': "Done", 'onSelect': 
			function(config, payload) {
				config.emailRingtoneName = payload.name;
				config.emailRingtonePath = payload.fullPath;
				
				this.controller.modelChanged(config, this);
			}.bind(this, config)},
		this.controller.stageController);
}

//

SceneAssistant.prototype.close = function() {
	this.save = true;

	if(this.action == "launchPopup")
		this.controller.window.close();
	else {
		for(var i = 0; i < this.modelAccountsList.items.length; i++) {
			delete this.modelAccountsList.items[i]['configTitle'];
			
			if(this.action == "emailRingtone") {
				var ringtone = {
					'name': this.modelAccountsList.items[i].emailRingtoneName,
					'path': this.modelAccountsList.items[i].emailRingtonePath };
								
				this.modelAccountsList.items[i].emailRingtone = ringtone;

				delete this.modelAccountsList.items[i]['emailRingtoneName'];
				delete this.modelAccountsList.items[i]['emailRingtonePath'];
			}
		}
		
		this.callback(this.modelAccountsList.items, this.save);
	
		this.controller.stageController.popScene();
	}
}

SceneAssistant.prototype.cleanup = function() {
}

SceneAssistant.prototype.activate = function() {
	if(this.action == "launchPopup")
		setTimeout(this.close.bind(this), 100);
}

SceneAssistant.prototype.deactivate = function() {
}

