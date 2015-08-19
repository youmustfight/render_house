'use strict';

app.factory('Model', function ($http) {

	// Model Constructor
	function Model (props) {
		angular.extend(this, props);
	}
	Model.url = '/api/product/';
	Object.defineProperty(Model.prototype, 'url', {
		get: function () {
			return Model.url + this._id;
		}
	});

	// Used in product-detail state
	Model.prototype.fetch = function(){
		console.log(this.url);
		return $http.get(this.url)
			.then(function (res) {
				console.log("individual fetch returned");
				Model.changeModel(res.data);
				return new Model(res.data);
			});
	}

	// Used for listing mostly
	Model.fetchAll = function(){
		return $http.get(Model.url)
			.then(function (res) {
				var mappedResponse = res.data.map(function (obj){
					return new Model(obj);
				});
				return mappedResponse;
			});
	}





	// Rendering
	var renderObj = {
		modelFileUrl: 'models/untitled-scene/untitled-scene.json',
		creator: 'Mary Anne'
	};
	// Renderer Access Methods
	Model.changeModel = function (newObj) {
		renderObj = newObj || {
			modelFileUrl: 'models/untitled-scene/untitled-scene.json',
			creator: 'Could Be You'
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