'use strict';

app.config(function ($stateProvider) {
	$stateProvider.state('model', {
		url: '/model/:id',
		templateUrl: 'js/product/detail/product.detail.html',
		controller: 'ModelDetailController',
		resolve: {
			model: function (Model, $stateParams) {
				// Get Model
				// var model = new Model({_id: $statemParams.id}).fetch();
				var model = {
					_id: 12362,
					title: 'Baymax',
					snapshotFileUrl: '/images/snapshots/baymax.png',
					modelFileUrl: 'models/baymax.json',
					creator: 'Milton Glaser',
					tags: ['Character','Futuristic']
				};

				// Set new renderObj
				Model.changeModel(model);

				// Attach returned model to scope
				return model;
			},
			models: function (Model) {
				return Model.fetchAll();
			}
		}				
	});
});