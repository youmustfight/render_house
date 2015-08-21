
app.factory('SignUp', function ($http, $state, $location) {
	return{
		signup: function (credentials) {
		return $http.post('api/user', credentials).then(function (res) {
			console.log(res.data)
			return res.data;
		});
		},

        getUsers: function(){
            return $http.get('api/user').then(function(response){
                return response.data;
            })
        },
		update: function (credentials) {
		return $http.put('api/user/update/', credentials).then(function (res) {
			console.log(res.data)
			return res.data;
		});
		},
		pass: function (credentials) {
		return $http.put('api/user/newpassword', credentials).then(function (res) {
			console.log(res.data)
			return res.data;
		});
		},
		deleteUser: function(creds){
			return $http.delete('api/user/'+ creds).then(function(res){
				console.log("this user is gone" + res.data)
				return res.data;
			})
		}
	}
});

