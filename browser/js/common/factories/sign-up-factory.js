
app.factory('SignUp', function ($http, $state, $location) {
	return{
		signup: function (credentials) {
		return $http.post('api/user', credentials).then(function (res) {
			return res.data;
		});
		},

        getUsers: function(){
            return $http.get('api/user').then(function(response){
                return response.data;
            })
        }
	}
});

