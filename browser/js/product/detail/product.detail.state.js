'use strict';

app.config(function ($stateProvider) {
	$stateProvider.state('model', {
		url: '/model/:id',
		templateUrl: 'js/product/detail/product.detail.html',
		controller: 'ModelDetailController',
		resolve: {
			model: function (Model, $stateParams, $http) {
				var model = new Model({_id: $stateParams.id});
				return model.fetch();
			},
			models: function (Model) {
				// "Users Also Download" recommendation
				return Model.fetchAll();
			}
		}				
	});
});