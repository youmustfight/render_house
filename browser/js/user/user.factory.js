'use strict';

app.factory('User', function ($http) {

	// User Contructor
	function User (props){
		angular.extend(this, props);
	}
	User.url = '/api/user/';
	Object.defineProperty(User.prototype, 'url', {
		get: function () {
			return User.url + this._id;
		}
	})

	//Get User
	User.prototype.fetch = function () {
		return $http.get(this.url)
			.then(function (res) {
				console.log("Res.data: ", res.data);
				return new User(res.data);
			});
	}

	return User;
});