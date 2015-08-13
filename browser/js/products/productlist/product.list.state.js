'use strict';

app.config(function ($stateProvider) {
	$stateProvider.state('products', {
		url: '/products',
		templateUrl: '/browser/app/product/list/product.list.html',
		controller: 'ProductListCtrl',
		resolve: {
			stories: function (Product) {
				return Product.fetchAll();
			},
			users: function (User) {
				return User.fetchAll();
			}
		}
	});
});