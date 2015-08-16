'use strict';

app.directive('productTile', function(){
	return {
		restrict: 'E',
		scope: {
			model: '='
		},
		templateUrl: 'js/product/tile/product.tile.html'
	}
});