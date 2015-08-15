'use strict';

app.factory('Product', function ($http){
		return{
		addProduct: function (credentials) {
		return $http.post('api/products', credentials).then(function (res) {
			return res.data;
		});
		},

        getProducts: function(){
            return $http.get('api/products').then(function(response){
                return response.data;
            })
        }
	}





})