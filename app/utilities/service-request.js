function ServiceRequest() {
	this.requestId = 0;
	this.requests = {};
	
	this.retries = 3;
}

//

ServiceRequest.prototype.request = function(url, options) {
	this.executeRequest(url, options, 0);
}

//

ServiceRequest.prototype.executeRequest = function(url, options, retry) {
	var requestOpt = Object.clone(options);

	var requestId = this.requestId++;

	requestOpt.onComplete = this.completeHandler.bind(this, url, options, retry, requestId);
	
	this.requests[requestId] = new Mojo.Service.Request(url, requestOpt);

	return this.requests[requestId];
}

ServiceRequest.prototype.completeHandler = function(url, options, retry, request, response) {
	delete this.requests[request];

	if((response.returnValue != undefined) && (response.returnValue == false)) {
		if(retry < this.retries) {
			Mojo.Log.warn("Retrying service request");
			
			this.executeRequest(url, options, ++retry);
		}
		else {
			Mojo.Log.error("Dropping service request");
			
			options.onComplete && options.onComplete({'returnValue': false});
		}
	}
	else {
		if(response.returnValue == undefined)
			response.returnValue = true;
			
		options.onComplete && options.onComplete(response);
	}
}

