'use strict';

app.directive('payment', function(){
	return{
		restrict: 'E',
		replace: true,
		templateUrl: 'js/components/payment/payment.html',
		controller: 'Payments'
	}
})