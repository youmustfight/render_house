'use strict';

app.filter('modelsSort', function () {

	return function (arrayOfModels, $scope){
		return arrayOfModels.filter(function (tile) {
			var query = $scope.query
			var tagsLength = tile.tags.length;

			for (var i = 0; i < tagsLength; i++){
				if (tile.tags[i] === query) return true
			}

			return false;

		});
	}

});