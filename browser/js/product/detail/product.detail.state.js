'use strict';

app.config(function ($stateProvider) {
	$stateProvider
	.state('model', {
		url: '/model/:id',
		abstract: true,
		templateUrl: 'js/product/detail/product.html',
		controller: 'ModelController',
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
	})
	.state('model.detail', {
		url: '',
		templateUrl: 'js/product/detail/product.detail.html'
	})
	.state('model.payment', {
		url: '',
		templateUrl: 'js/product/detail/product.payment.html'		
	})
	.state('model.comments', {
		url: '',
		templateUrl: 'js/product/detail/product.comments.html'
	})
	.state('model.edit', {
		url: '',
		templateUrl: 'js/product/detail/product.edit.html'
	});
});