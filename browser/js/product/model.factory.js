'use strict';

app.factory('Model', function ($http) {
	// Model Constructor
	function Model (props) {
		angular.extend(this, props);
	}
	Model.url = 'api/product'
	Object.defineProperty(Model.prototype, 'url', {
		get: function () {
			return Model.url + this._id;
		}
	});

	// Currently Rendered Object
	var renderObj = {
		modelFileUrl: 'models/untitled-scene/untitled-scene.json',
		creator: 'Mary Anne'
	};

	// Listing Functionality
	Model.prototype.fetch = function(){
		return $http.get(this.url).then(function (res) {
			return new Model(res.data);
		});
	}

	Model.fetchAll = function(){
		// return $htpp.get(Model.url).then(function (data) {
		// 	return res.data.map(function (obj) {
		// 		return new Model(obj);
		// 	});
		// });
		return [
		{
			_id: 12424,
			title: 'Floating Island',
			snapshotFileUrl: 'images/snapshots/untitled-scene.png',
			modelFileUrl: 'models/untitled-scene/untitled-scene.json',
			creator: 'Mary Anne',
			tags: ['Environment','Low-Poly']
		}, 
		{
			_id: 12362,
			title: 'Baymax',
			snapshotFileUrl: 'images/snapshots/baymax.png',
			modelFileUrl: 'models/baymax.json',
			creator: 'Milton Glaser',
			tags: ['Character','Futuristic']
		},
		{
			_id: 12424,
			title: 'Floating Island',
			snapshotFileUrl: 'images/snapshots/untitled-scene.png',
			modelFileUrl: 'models/untitled-scene/untitled-scene.json',
			creator: 'Mary Anne',
			tags: ['Environment','Low-Poly']
		}, 
		{
			_id: 12362,
			title: 'Baymax',
			snapshotFileUrl: 'images/snapshots/baymax.png',
			modelFileUrl: 'models/baymax.json',
			creator: 'Milton Glaser',
			tags: ['Character','Futuristic']
		},
		{
			_id: 12424,
			title: 'Floating Island',
			snapshotFileUrl: 'images/snapshots/untitled-scene.png',
			modelFileUrl: 'models/untitled-scene/untitled-scene.json',
			creator: 'Mary Anne',
			tags: ['Environment','Low-Poly']
		}, 
		{
			_id: 12362,
			title: 'Baymax',
			snapshotFileUrl: 'images/snapshots/baymax.png',
			modelFileUrl: 'models/baymax.json',
			creator: 'Milton Glaser',
			tags: ['Character','Futuristic']
		}, 
		{
			_id: 12362,
			title: 'Baymax',
			snapshotFileUrl: 'images/snapshots/baymax.png',
			modelFileUrl: 'models/baymax.json',
			creator: 'Milton Glaser',
			tags: ['Character','Futuristic']
		},
		{
			_id: 12424,
			title: 'Floating Island',
			snapshotFileUrl: 'images/snapshots/untitled-scene.png',
			modelFileUrl: 'models/untitled-scene/untitled-scene.json',
			creator: 'Mary Anne',
			tags: ['Environment','Low-Poly']
		}, 
		{
			_id: 12362,
			title: 'Baymax',
			snapshotFileUrl: 'images/snapshots/baymax.png',
			modelFileUrl: 'models/baymax.json',
			creator: 'Milton Glaser',
			tags: ['Character','Futuristic']
		}, 
		{
			_id: 12362,
			title: 'Baymax',
			snapshotFileUrl: 'images/snapshots/baymax.png',
			modelFileUrl: 'models/baymax.json',
			creator: 'Milton Glaser',
			tags: ['Character','Futuristic']
		},
		{
			_id: 12362,
			title: 'Baymax',
			snapshotFileUrl: 'images/snapshots/baymax.png',
			modelFileUrl: 'models/baymax.json',
			creator: 'Milton Glaser',
			tags: ['Character','Futuristic']
		},
		{
			_id: 12424,
			title: 'Floating Island',
			snapshotFileUrl: 'images/snapshots/untitled-scene.png',
			modelFileUrl: 'models/untitled-scene/untitled-scene.json',
			creator: 'Mary Anne',
			tags: ['Environment','Low-Poly']
		}, 
		{
			_id: 12362,
			title: 'Baymax',
			snapshotFileUrl: 'images/snapshots/baymax.png',
			modelFileUrl: 'models/baymax.json',
			creator: 'Milton Glaser',
			tags: ['Character','Futuristic']
		},
		{
			_id: 12424,
			title: 'Floating Island',
			snapshotFileUrl: 'images/snapshots/untitled-scene.png',
			modelFileUrl: 'models/untitled-scene/untitled-scene.json',
			creator: 'Mary Anne',
			tags: ['Environment','Low-Poly']
		}, 
		{
			_id: 12362,
			title: 'Baymax',
			snapshotFileUrl: 'images/snapshots/baymax.png',
			modelFileUrl: 'models/baymax.json',
			creator: 'Milton Glaser',
			tags: ['Character','Futuristic']
		},
		{
			_id: 12424,
			title: 'Floating Island',
			snapshotFileUrl: 'images/snapshots/untitled-scene.png',
			modelFileUrl: 'models/untitled-scene/untitled-scene.json',
			creator: 'Mary Anne',
			tags: ['Environment','Low-Poly']
		}, 
		{
			_id: 12362,
			title: 'Baymax',
			snapshotFileUrl: 'images/snapshots/baymax.png',
			modelFileUrl: 'models/baymax.json',
			creator: 'Milton Glaser',
			tags: ['Character','Futuristic']
		},
		{
			_id: 12424,
			title: 'Floating Island',
			snapshotFileUrl: 'images/snapshots/untitled-scene.png',
			modelFileUrl: 'models/untitled-scene/untitled-scene.json',
			creator: 'Mary Anne',
			tags: ['Environment','Low-Poly']
		}, 
		{
			_id: 12362,
			title: 'Baymax',
			snapshotFileUrl: 'images/snapshots/baymax.png',
			modelFileUrl: 'models/baymax.json',
			creator: 'Milton Glaser',
			tags: ['Character','Futuristic']
		}, 
		{
			_id: 12362,
			title: 'Baymax',
			snapshotFileUrl: 'images/snapshots/baymax.png',
			modelFileUrl: 'models/baymax.json',
			creator: 'Milton Glaser',
			tags: ['Character','Futuristic']
		},
		{
			_id: 12424,
			title: 'Floating Island',
			snapshotFileUrl: 'images/snapshots/untitled-scene.png',
			modelFileUrl: 'models/untitled-scene/untitled-scene.json',
			creator: 'Mary Anne',
			tags: ['Environment','Low-Poly']
		}, 
		{
			_id: 12362,
			title: 'Baymax',
			snapshotFileUrl: 'images/snapshots/baymax.png',
			modelFileUrl: 'models/baymax.json',
			creator: 'Milton Glaser',
			tags: ['Character','Futuristic']
		}, 
		{
			_id: 12362,
			title: 'Baymax',
			snapshotFileUrl: 'images/snapshots/baymax.png',
			modelFileUrl: 'models/baymax.json',
			creator: 'Milton Glaser',
			tags: ['Character','Futuristic']
		},
		{
			_id: 12362,
			title: 'Baymax',
			snapshotFileUrl: 'images/snapshots/baymax.png',
			modelFileUrl: 'models/baymax.json',
			creator: 'Milton Glaser',
			tags: ['Character','Futuristic']
		},
		{
			_id: 12424,
			title: 'Floating Island',
			snapshotFileUrl: 'images/snapshots/untitled-scene.png',
			modelFileUrl: 'models/untitled-scene/untitled-scene.json',
			creator: 'Mary Anne',
			tags: ['Environment','Low-Poly']
		}, 
		{
			_id: 12362,
			title: 'Baymax',
			snapshotFileUrl: 'images/snapshots/baymax.png',
			modelFileUrl: 'models/baymax.json',
			creator: 'Milton Glaser',
			tags: ['Character','Futuristic']
		}];

	}


	// Renderer Functionality
	Model.changeModelUrl = function (newUrl) {
		renderObj.modelFileUrl = newUrl;
		return renderObj;
	};
	Model.changeModel = function (newObj) {
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
	Model.getModelUrl = function () {
		return renderObj.modelFileUrl;
	};
	Model.getModel = function () {
		return renderObj;
	};



	return Model;

});