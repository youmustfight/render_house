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
		return $http.get(this.url)
			.then(function (res) {
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
		modelFileUrl: 'models/untitled-scene/untitled-scene.json'
	};
	// Renderer Access Methods
	Model.changeModel = function (newObj) {
		renderObj = newObj || {
			modelFileUrl: 'models/untitled-scene/untitled-scene.json'
		};
	};
	Model.getModelUrl = function () {
		return renderObj.modelFileUrl;
	};
	Model.getModel = function () {
		return renderObj;
	};
	
	Model.deleteModel = function(productid){
		return $http.delete(Model.url+productid).then(function(res){
			return res.data;
		})
	}
	
	Model.getUploads = function(userid){
		console.log("hit 2")
		return $http.get(Model.url+userid).then(function(res){
			return res.data;
		})
	}


	return Model;

});