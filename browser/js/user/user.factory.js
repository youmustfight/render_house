'use strict';

app.factory('User', function ($http) {
	// User Contructor
	function User (props){
		angular.extend(this, props);
	}
	User.url = 'api/user'

	// 

	return User;
});