'use strict';

app.directive('collection', function(){
	return {
		restrict: 'E',
		templateUrl: 'js/components/collection/collection.html',
		controller: 'ManagerController'
	}
});