'use strict';

app.controller('Payments', function($scope){

Stripe.setPublishableKey('fillMePlease')

$scope.handleStripe = function(status, response){
	
        if(response.error) {
          // there was an error. Fix it.
        } else {
          // got stripe token, now charge it or smt
          token = response.id
        }
      }

})