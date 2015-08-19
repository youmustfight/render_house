'use strict';

app.factory('RecEngineEngine', function(){

function RecEngine (props) {
		angular.extend(this, props);
	}
	RecEngine.url = 'api/recommendation'
	Object.defineProperty(RecEngine.prototype, 'url', {
		get: function () {
			return RecEngine.url + this._id;
		}
	});



	// Currently Rendered Object
	var renderObj = {
		modelFileUrl: 'models/untitled-scene/untitled-scene.json',
		creator: 'Mary Anne'
	};

	// Listing Functionality
	RecEngine.prototype.fetch = function(){
		return $http.get(this.url).then(function (res) {
			return new RecEngine(res.data);
		});
	}

	RecEngine.fetchAll = function(){
		return $htpp.get(RecEngine.url).then(function (data) {
			return res.data.map(function (obj) {
				return new RecEngine(obj);
			});
		});
		
	}

	// Renderer Functionality
	RecEngine.changeRecUrl = function (newUrl) {
		renderObj.modelFileUrl = newUrl;
		return renderObj;
	};
	RecEngine.changeRec = function (newObj) {
		// Temp attributes for testing
		renderObj = newObj || {
			_id: 12424,
			title: 'Floating Island',
			snapshotFileUrl: 'images/snapshots/untitled-scene.png',
			modelFileUrl: 'models/untitled-scene/untitled-scene.json',
			creator: 'Mary Anne',
			tags: ['Environment','Low-Poly']
		};
	};
	RecEngine.getRecUrl = function () {
		return renderObj.modelFileUrl;
	};
	RecEngine.getRec = function () {
		return renderObj;
	};



	return RecEngine;



})