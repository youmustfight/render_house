'use strict';

app.directive('focusMe', function($parse, $timeout){
	return {
		restrict: 'A',
		link: function (scope, element, attrs){
			var status = $parse(attrs.focusMe);
			scope.$watch(status, function(val){
				console.log('status = ', val);
				if (val === true){
					$timeout(function(){
						element[0].focus();
					})
				}
			})
		}
	}
})