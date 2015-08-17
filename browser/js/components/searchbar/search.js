'use strict';

app.directive('searchOnEnter', function ($http, $state){
	return {
		restrict: 'A',
		link: function (scope, element, attrs){
			element.bind('keydown keypress', function (event) {

				var dirtyQueryString = element.val();

				if (dirtyQueryString.length){
					if (event.which === 13) {
						scope.$apply(function(){
							scope.searchOpened = false;
							scope.$eval($state.go('search',{queryString: element.val()}));
						});

						event.preventDefault();
					}
				}
				
			});
		}
	}
});