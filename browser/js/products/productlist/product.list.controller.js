'use strict';

app.controller('ProductListCtrl', function ($scope,$state, Product) {
	
    $scope.login = {};
    $scope.error = null;

    $scope.addProduct = function (productInfo) {

        $scope.error = null;

        Product.addProduct(productInfo).then(function () {
            $state.go('products');
        }).catch(function () {
            $scope.error = 'Invalid login credentials.';
        });

    };
    
    $scope.getProducts = function(){
        Product.getUsers().then(function(users){
            console.log(users)
        })
    }
	
	

});