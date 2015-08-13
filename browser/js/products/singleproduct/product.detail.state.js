'use strict';

app.config(function ($stateProvider) {
	$stateProvider.state('product', {
		url: '/product/:id',
		templateUrl: '/browser/app/product/detail/product.detail.html',
		controller: 'ProductDetailCtrl',
		resolve: {
			story: function (Product, $stateParams) {
				var story = new Product({_id: $stateParams.id});
				return product.fetch();
			},
			users: function (User) {
				return User.fetchAll();
			}
		}
	});
});