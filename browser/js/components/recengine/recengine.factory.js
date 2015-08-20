'use strict';

app.factory('RecEng', function(){

function RecEng (props) {
		angular.extend(this, props);
	}
	RecEng.url = 'api/recommendation'
	Object.defineProperty(RecEng.prototype, 'url', {
		get: function () {
			return RecEng.url + this._id;
		}
	});

RecEng.prototype.test = function(){
	alert('got here!')
}

	// Currently Rendered Object
	var renderObj = {
		modelFileUrl: 'models/untitled-scene/untitled-scene.json',
		creator: 'Mary Anne'
	};

	// Listing Functionality
	RecEng.prototype.fetch = function(){
		return $http.get(this.url).then(function (res) {
			return new RecEng(res.data);
		});
	}

	RecEng.fetchAll = function(){
		return $htpp.get(RecEng.url).then(function (data) {
			return res.data.map(function (obj) {
				return new RecEng(obj);
			});
		});
		
	}

	// Renderer Functionality
	RecEng.changeRecUrl = function (newUrl) {
		renderObj.modelFileUrl = newUrl;
		return renderObj;
	};
	RecEng.changeRec = function (newObj) {
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
	RecEng.getRecUrl = function () {
		return renderObj.modelFileUrl;
	};
	RecEng.getRec = function () {
		return renderObj;
	};



	return RecEng;



})