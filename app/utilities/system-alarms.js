function SystemAlarms(ServiceRequestWrapper) {
	this.service = ServiceRequestWrapper;

	this.alarms = new Array();
	this.delays = new Array();
}

//

SystemAlarms.prototype.clearAlarmTimeouts = function(trigger) {

}

SystemAlarms.prototype.clearAlarmTimeout = function(trigger, time) {
	var timestamp = time.getTime() / 1000;

	var key = Mojo.Controller.appInfo.id + "." + trigger + "." + timestamp;

	Mojo.Log.error("Alarm for " + trigger + " event canceled");
		
	this.service.request("palm://com.palm.power/timeout", {
		'method': "clear", 'parameters': {'key': key} });
}

SystemAlarms.prototype.setupAlarmTimeout = function(trigger, time, data) {
	var timestamp = time.getTime() / 1000;

	var key = Mojo.Controller.appInfo.id + "." + trigger + "." + timestamp;
	
	// Setup the actual start / close timeout with the above time.

	var alarmStr = this.convertDateToUtfStr(time);
	
	Mojo.Log.error("Alarm for " + trigger + ": " + alarmStr);
	
	this.service.request('palm://com.palm.power/timeout', {
 		'method': "set", 'parameters': {
 			'wakeup': true,
 			'key': key,
 			'uri': "palm://com.palm.applicationManager/launch",
 			'params': {'id':Mojo.Controller.appInfo.id, 'params': {
 				'action':"trigger", 'event': trigger, 'data': data}},
			'at': alarmStr} }); 
}

//

SystemAlarms.prototype.clearDelayTimeout = function(trigger) {
	var key = Mojo.Controller.appInfo.id + "." + trigger + ".delay";

	Mojo.Log.error("Delay for " + trigger + " event canceled");
		
	this.service.request("palm://com.palm.power/timeout", {
		'method': "clear", 'parameters': {"key": key} });
}

SystemAlarms.prototype.setupDelayTimeout = function(trigger, delay, data) {
	// Delay will be calculated to be on a half minute so it won't happen 
	// at the same time with alarm timeout due to bug in Mojo re-launch.

	var key = Mojo.Controller.appInfo.id + "." + trigger + ".delay";

	var date = new Date();
	
	var hours = Math.floor(delay / 60);
	
	var minutes = delay - (hours * 60);
	
	if(date.getSeconds() > 30)
		var seconds = 30 + (60 - date.getSeconds());
	else
		var seconds = 30 - date.getSeconds();
	
	if(hours < 10)
		hours = "0" + hours;

	if(minutes < 10)
		minutes = "0" + minutes;
	
	var delayStr = hours + ":" + minutes + ":" + seconds;
	
	// Setup the actual delay timeout with the above delay.

	Mojo.Log.error("Delay for " + trigger + ": " + delayStr);
	
	this.service.request('palm://com.palm.power/timeout', {
 		'method': "set", 'parameters': {
 			'wakeup': true,
 			'key': key,
 			'uri': "palm://com.palm.applicationManager/launch",
 			'params': {'id': Mojo.Controller.appInfo.id, 'params': {
 				'action': "trigger", 'event': trigger, 'data': data}},
			'in': delayStr} });
}

//

SystemAlarms.prototype.convertDateToUtfStr = function(date) {
	var day = date.getUTCDate();
	if(day < 10) day = "0" + day;
	var month = date.getUTCMonth()+1;
	if(month < 10) month = "0" + month;
	var year = date.getUTCFullYear();

	var hours = date.getUTCHours();
	if(hours < 10) hours = "0" + hours;
	var minutes = date.getUTCMinutes();
	if(minutes < 10) minutes = "0" + minutes;

	var seconds = date.getUTCSeconds();
	if(seconds < 10) seconds = "0" + seconds;
	
	var str = month + "/" + day + "/" + year + " " + hours + ":" + minutes + ":" + seconds;

	return str;
}

