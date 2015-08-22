'use strict';

app.controller('ModelDetailController', function($scope, AuthService, Model, model, models, $http, $window) {
    $scope.model = model;
    $scope.models = models;
    $scope.paymentProcess = 'noPay';
    $scope.card = {};
    $scope.amount = Number;

    $scope.submit = function () {
    	alert("got here")
        $window.Stripe.card.createToken($scope.card, function (status, response) {
        	$scope.stripeToken = response.id;
        	console.log('ths is response', status)
        	$http.post('/api/payment', {
        		token: $scope.token,
                manifest: $scope.card,
                amount: $scope.amount
        	}).then(function(response){
        		console.log('this is response', response)
        	})
        	
        });

    };

    // Set User
    $scope.user = null;
    var User = function() {
        AuthService.getLoggedInUser().then(function(user) {
            $scope.user = user;
        });
    }
    User();

    $scope.download = function() {

        var pHistory = $scope.user.purchaseHistory;
        var modelPurchased = false

        for (var i = 0; i < pHistory.length; i++) {
            if (pHistory[0] == $scope.model._id) modelPurchased = true;
        }

        if (!modelPurchased) {
            $http.put('/api/user/download', {
                    userId: $scope.user._id,
                    modelId: $scope.model._id
                })
                .then(function(successResponse) {
                    console.log(successResponse);
                    pHistory.push($scope.model);
                }, function(failedResponse) {
                    console.log(failedResponse);
                });
        }

        $http.put('/api/product/download', {
                modelId: $scope.model._id
            })
            .then(function(successResponse) {
                console.log(successResponse);
                $scope.model.timesDownloaded++;
            }, function(failedResponse) {
                console.log(failedResponse);
            });

    }
});
