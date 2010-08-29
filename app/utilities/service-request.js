function ServiceRequest() {
	this.requestId = 0;
	this.requests = {};
	
	this.retries = 5;
}

//

ServiceRequest.prototype.request = function(url, options) {
	this.executeRequest(url, options, 0);
}

//

ServiceRequest.prototype.executeRequest = function(url, options, retry) {
	var requestOpt = Object.clone(options);

	var requestId = this.requestId++;

	if(retry < this.retries)
		requestOpt.onFailure = null;

	requestOpt.onComplete = this.completeHandler.bind(this, url, options, retry, requestId);
	
	this.requests[requestId] = new Mojo.Service.Request(url, requestOpt);

	return this.requests[requestId];
}

ServiceRequest.prototype.completeHandler = function(url, options, retry, request, response) {
	if(((!options.parameters) || (!options.parameters.subscribe)) && (options.method != "addmatch"))
		delete this.requests[request];

	if((response.returnValue != undefined) && (response.returnValue == false)) {
		if(retry < this.retries) {
			Mojo.Log.error("Retrying service request (count: " + retry + ")");
			
			this.executeRequest(url, options, ++retry);
		}
		else {
			Mojo.Log.error("Dropping service request (count: " + retry + ")");
			
			options.onComplete && options.onComplete({'returnValue': false});
		}
	}
	else {
		if(response.returnValue == undefined)
			response.returnValue = true;
			
		options.onComplete && options.onComplete(response);
	}
}

