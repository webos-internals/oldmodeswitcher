function BluetoothConfig() {
}

BluetoothConfig.prototype.version = function() {
	return "1.1";
}

BluetoothConfig.prototype.label = function() {
	return "BT Connection Trigger";
}

//

BluetoothConfig.prototype.activate = function() {
}

BluetoothConfig.prototype.deactivate = function() {
}

//

BluetoothConfig.prototype.setup = function(controller) {
	this.controller = controller;

	this.choicesProfileStateSelector = [
		{'label': "Connected", 'value': 0},
		{'label': "Disconnected", 'value': 1},
		{'label': "Connected to", 'value': 2},
		{'label': "Disconnected from", 'value': 3} ];
		
	controller.setupWidget("BluetoothStateSelector", {'label': "State",
		'labelPlacement': "left", 'modelProperty': "bluetoothState",
		'choices': this.choicesProfileStateSelector});        

	this.choicesProfileSelector = [
		{'label': "Any Profile", 'value': "any"},
		{'label': "Stereo Music", 'value': "a2dp"},
		{'label': "AV Remote Control", 'value': "avrcp"},
		{'label': "Hands-Free", 'value': "hfg"},
		{'label': "Headset", 'value': "hsp"},
		{'label': "Personal Area Network", 'value': "pan"},
		{'label': "Phone Book Access", 'value': "pba"} ];

	controller.setupWidget("BluetoothProfileSelector", {'label': "Profile",
		'labelPlacement': "left", 'modelProperty': "bluetoothProfile",
		'choices': this.choicesProfileSelector});        

	controller.setupWidget("BluetoothDeviceText", {'hintText': "Bluetooth Device Name", 
		'multiline': false, 'enterSubmits': false, 'focus': true, 
		'textCase': Mojo.Widget.steModeLowerCase, 'modelProperty': "bluetoothDevice"}); 

	// Listen for state selector change event

	Mojo.Event.listen(controller.get("TriggersList"), Mojo.Event.propertyChange, 
		this.handleListChange.bind(this));
}

//

BluetoothConfig.prototype.config = function() {
	var config = {
		'bluetoothState': 0,
		'bluetoothProfile': "any",
		'bluetoothDevice': "",
		'bluetoothProfileRow': "last",
		'bluetoothDeviceDisplay': "none" };
	
	return config;
}

//

BluetoothConfig.prototype.load = function(preferences) {
	var row = "last";
	var display = "none";

	if(preferences.bluetoothState >= 2) {
		row = "";
		display = "block";
	}

	var config = {
		'bluetoothState': preferences.bluetoothState,
		'bluetoothProfile': preferences.bluetoothProfile,
		'bluetoothDevice': preferences.bluetoothDevice,
		'bluetoothProfileRow': row,
		'bluetoothDeviceDisplay': display };
	
	return config;
}

BluetoothConfig.prototype.save = function(config) {
	var preferences = {
		'bluetoothState': config.bluetoothState,
		'bluetoothProfile': config.bluetoothProfile,
		'bluetoothDevice': config.bluetoothDevice };
	
	return preferences;
}

BluetoothConfig.prototype.handleListChange = function(event) {
	if(event.property == "bluetoothState") {
		if(event.value >= 2) {
			event.model.bluetoothProfileRow = "";			
			event.model.bluetoothDeviceDisplay = "block";
		}
		else {
			event.model.bluetoothProfileRow = "last";			
			event.model.bluetoothDeviceDisplay = "none";
		}
		
		var state = this.controller.get('mojo-scene-editmode-scene-scroller').mojo.getState();

		this.controller.get("TriggersList").mojo.invalidateItems(0);
		
		this.controller.get('mojo-scene-editmode-scene-scroller').mojo.setState(state);
	}
}


