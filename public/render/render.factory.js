'use strict';

app.factory('RenderService', function(){

	var renderObj = {
		url: 'models/untitled-scene/untitled-scene.json'
	}

	return {
		changeModelUrl: function(newUrl){
			renderObj.url = newUrl;
			return renderObj.url;
		},
		getModelUrl: function(){
			return renderObj.url;
		}
	}

});