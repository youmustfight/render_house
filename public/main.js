'use strict';
var app = angular.module('FullstackGeneratedApp', ['ui.router', 'fsaPreBuilt']);

app.config(function ($urlRouterProvider, $locationProvider) {
	// This turns off hashbang urls (/#about) and changes it to something normal (/about)
	$locationProvider.html5Mode(true);
	// If we go to a URL that ui-router doesn't have registered, go to the "/" url.
	$urlRouterProvider.otherwise('/');
	$urlRouterProvider.when('/auth/:provider', function () {
		window.location.reload();
	});
});

// This app.run is for controlling access to specific states.
app.run(function ($rootScope, AuthService, $state) {

	// The given state requires an authenticated user.
	var destinationStateRequiresAuth = function destinationStateRequiresAuth(state) {
		return state.data && state.data.authenticate;
	};

	// $stateChangeStart is an event fired
	// whenever the process of changing a state begins.
	$rootScope.$on('$stateChangeStart', function (event, toState) {

		if (!destinationStateRequiresAuth(toState)) {
			// The destination state does not require authentication
			// Short circuit with return.
			return;
		}

		if (AuthService.isAuthenticated()) {
			// The user is authenticated.
			// Short circuit with return.
			return;
		}

		// Cancel navigating to new state.
		event.preventDefault();

		AuthService.getLoggedInUser().then(function (user) {
			// If a user is retrieved, then renavigate to the destination
			// (the second time, AuthService.isAuthenticated() will work)
			// otherwise, if no user is logged in, go to "login" state.
			var destination = user ? toState.name : 'login';
			$state.go(destination);
		});
	});
});
(function () {

	'use strict';

	// Hope you didn't forget Angular! Duh-doy.
	if (!window.angular) throw new Error('I can\'t find Angular!');

	var app = angular.module('fsaPreBuilt', []);

	app.factory('Socket', function () {
		if (!window.io) throw new Error('socket.io not found!');
		return window.io(window.location.origin);
	});

	// AUTH_EVENTS is used throughout our app to
	// broadcast and listen from and to the $rootScope
	// for important events about authentication flow.
	app.constant('AUTH_EVENTS', {
		loginSuccess: 'auth-login-success',
		loginFailed: 'auth-login-failed',
		logoutSuccess: 'auth-logout-success',
		sessionTimeout: 'auth-session-timeout',
		notAuthenticated: 'auth-not-authenticated',
		notAuthorized: 'auth-not-authorized'
	});

	app.factory('AuthInterceptor', function ($rootScope, $q, AUTH_EVENTS) {
		var statusDict = {
			401: AUTH_EVENTS.notAuthenticated,
			403: AUTH_EVENTS.notAuthorized,
			419: AUTH_EVENTS.sessionTimeout,
			440: AUTH_EVENTS.sessionTimeout
		};
		return {
			responseError: function responseError(response) {
				$rootScope.$broadcast(statusDict[response.status], response);
				return $q.reject(response);
			}
		};
	});

	app.config(function ($httpProvider) {
		$httpProvider.interceptors.push(['$injector', function ($injector) {
			return $injector.get('AuthInterceptor');
		}]);
	});

	app.service('AuthService', function ($http, Session, $rootScope, AUTH_EVENTS, $q) {

		function onSuccessfulLogin(response) {
			var data = response.data;
			console.log("logged in");
			Session.create(data.id, data.user);
			$rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
			return data.user;
		}

		// Uses the session factory to see if an
		// authenticated user is currently registered.
		this.isAuthenticated = function () {
			return !!Session.user;
		};

		this.getLoggedInUser = function (fromServer) {

			// If an authenticated session exists, we
			// return the user attached to that session
			// with a promise. This ensures that we can
			// always interface with this method asynchronously.

			// Optionally, if true is given as the fromServer parameter,
			// then this cached value will not be used.

			if (this.isAuthenticated() && fromServer !== true) {
				return $q.when(Session.user);
			}

			// Make request GET /session.
			// If it returns a user, call onSuccessfulLogin with the response.
			// If it returns a 401 response, we catch it and instead resolve to null.
			return $http.get('/session').then(onSuccessfulLogin)['catch'](function () {
				return null;
			});
		};

		this.login = function (credentials) {
			return $http.post('/login', credentials).then(onSuccessfulLogin)['catch'](function () {
				return $q.reject({ message: 'Invalid login credentials.' });
			});
		};

		this.logout = function () {
			return $http.get('/logout').then(function () {
				Session.destroy();
				$rootScope.$broadcast(AUTH_EVENTS.logoutSuccess);
			});
		};
	});

	app.service('Session', function ($rootScope, AUTH_EVENTS) {

		var self = this;

		$rootScope.$on(AUTH_EVENTS.notAuthenticated, function () {
			self.destroy();
		});

		$rootScope.$on(AUTH_EVENTS.sessionTimeout, function () {
			self.destroy();
		});

		this.id = null;
		this.user = null;

		this.create = function (sessionId, user) {
			this.id = sessionId;
			this.user = user;
		};

		this.destroy = function () {
			this.id = null;
			this.user = null;
		};
	});
})();

app.config(function ($stateProvider) {

	$stateProvider.state('login', {
		url: '/login',
		templateUrl: 'js/login/login.html',
		controller: 'LoginCtrl'
	});
});

app.controller('LoginCtrl', function ($scope, AuthService, $state) {

	$scope.login = {};
	$scope.error = null;

	$scope.sendLogin = function (loginInfo) {
		console.log("hit controller");
		$scope.error = null;

		AuthService.login(loginInfo).then(function () {
			$state.go('home');
		})['catch'](function () {
			$scope.error = 'Invalid login credentials.';
		});
	};
});
'use strict';

app.controller('ManagerController', function ($scope, $timeout) {

	// Navbar
	$scope.navbarExpand = false;

	// Collection Panel
	$scope.collectionOpen = false;
	$scope.collectionToggle = function () {
		if (!$scope.collectionOpen) $scope.collectionOpen = true;else {
			$scope.collectionOpen = false;
		}
	};

	//Collapse All
	$scope.collapseTop = function () {
		$scope.collectionOpen = false;
		$timeout(function () {
			$scope.navbarExpand = false;
		}, 200);
	};

	// Actual collection
	$scope.collection = [];
});
'use strict';

app.factory('Model', function ($http) {

	// Currently Rendered Object
	var renderObj = {
		modelFileUrl: 'models/untitled-scene/untitled-scene.json',
		creator: 'Mary Anne'
	};

	// Model Constructor
	function Model(props) {
		angular.extend(this, props);
	};

	Model.url = 'api/product';
	Object.defineProperty(Model.prototype, 'url', {
		get: function get() {
			return Model.url + this._id;
		}
	});

	// Listing Functionality
	Model.prototype.fetch = function () {
		return $http.get(this.url).then(function (res) {
			return new Model(res.data);
		});
	};

	Model.fetchAll = function () {
		// return $htpp.get(Model.url).then(function (data) {
		// 	return res.data.map(function (obj) {
		// 		return new Model(obj);
		// 	});
		// });
		console.log();
		return [{
			_id: 12424,
			title: 'Floating Island',
			snapshotFileUrl: '/images/snapshots/floatingIsland.png',
			modelFileUrl: 'models/untitled-scene/untitled-scene.json',
			creator: 'Mary Anne',
			tags: ['Environment', 'Low-Poly']
		}, {
			_id: 12362,
			title: 'Baymax',
			snapshotFileUrl: '/images/snapshots/baymax.png',
			modelFileUrl: 'models/baymax.json',
			creator: 'Milton Glaser',
			tags: ['Character', 'Futuristic']
		}, {
			_id: 12424,
			title: 'Floating Island',
			snapshotFileUrl: '/images/snapshots/floatingIsland.png',
			modelFileUrl: 'models/untitled-scene/untitled-scene.json',
			creator: 'Mary Anne',
			tags: ['Environment', 'Low-Poly']
		}, {
			_id: 12362,
			title: 'Baymax',
			snapshotFileUrl: '/images/snapshots/baymax.png',
			modelFileUrl: 'models/baymax.json',
			creator: 'Milton Glaser',
			tags: ['Character', 'Futuristic']
		}, {
			_id: 12424,
			title: 'Floating Island',
			snapshotFileUrl: '/images/snapshots/floatingIsland.png',
			modelFileUrl: 'models/untitled-scene/untitled-scene.json',
			creator: 'Mary Anne',
			tags: ['Environment', 'Low-Poly']
		}, {
			_id: 12362,
			title: 'Baymax',
			snapshotFileUrl: '/images/snapshots/baymax.png',
			modelFileUrl: 'models/baymax.json',
			creator: 'Milton Glaser',
			tags: ['Character', 'Futuristic']
		}, {
			_id: 12362,
			title: 'Baymax',
			snapshotFileUrl: '/images/snapshots/baymax.png',
			modelFileUrl: 'models/baymax.json',
			creator: 'Milton Glaser',
			tags: ['Character', 'Futuristic']
		}, {
			_id: 12424,
			title: 'Floating Island',
			snapshotFileUrl: '/images/snapshots/floatingIsland.png',
			modelFileUrl: 'models/untitled-scene/untitled-scene.json',
			creator: 'Mary Anne',
			tags: ['Environment', 'Low-Poly']
		}, {
			_id: 12362,
			title: 'Baymax',
			snapshotFileUrl: '/images/snapshots/baymax.png',
			modelFileUrl: 'models/baymax.json',
			creator: 'Milton Glaser',
			tags: ['Character', 'Futuristic']
		}, {
			_id: 12362,
			title: 'Baymax',
			snapshotFileUrl: '/images/snapshots/baymax.png',
			modelFileUrl: 'models/baymax.json',
			creator: 'Milton Glaser',
			tags: ['Character', 'Futuristic']
		}, {
			_id: 12362,
			title: 'Baymax',
			snapshotFileUrl: '/images/snapshots/baymax.png',
			modelFileUrl: 'models/baymax.json',
			creator: 'Milton Glaser',
			tags: ['Character', 'Futuristic']
		}, {
			_id: 12424,
			title: 'Floating Island',
			snapshotFileUrl: '/images/snapshots/floatingIsland.png',
			modelFileUrl: 'models/untitled-scene/untitled-scene.json',
			creator: 'Mary Anne',
			tags: ['Environment', 'Low-Poly']
		}, {
			_id: 12362,
			title: 'Baymax',
			snapshotFileUrl: '/images/snapshots/baymax.png',
			modelFileUrl: 'models/baymax.json',
			creator: 'Milton Glaser',
			tags: ['Character', 'Futuristic']
		}, {
			_id: 12424,
			title: 'Floating Island',
			snapshotFileUrl: '/images/snapshots/floatingIsland.png',
			modelFileUrl: 'models/untitled-scene/untitled-scene.json',
			creator: 'Mary Anne',
			tags: ['Environment', 'Low-Poly']
		}, {
			_id: 12362,
			title: 'Baymax',
			snapshotFileUrl: '/images/snapshots/baymax.png',
			modelFileUrl: 'models/baymax.json',
			creator: 'Milton Glaser',
			tags: ['Character', 'Futuristic']
		}, {
			_id: 12424,
			title: 'Floating Island',
			snapshotFileUrl: '/images/snapshots/floatingIsland.png',
			modelFileUrl: 'models/untitled-scene/untitled-scene.json',
			creator: 'Mary Anne',
			tags: ['Environment', 'Low-Poly']
		}, {
			_id: 12362,
			title: 'Baymax',
			snapshotFileUrl: '/images/snapshots/baymax.png',
			modelFileUrl: 'models/baymax.json',
			creator: 'Milton Glaser',
			tags: ['Character', 'Futuristic']
		}, {
			_id: 12424,
			title: 'Floating Island',
			snapshotFileUrl: '/images/snapshots/floatingIsland.png',
			modelFileUrl: 'models/untitled-scene/untitled-scene.json',
			creator: 'Mary Anne',
			tags: ['Environment', 'Low-Poly']
		}, {
			_id: 12362,
			title: 'Baymax',
			snapshotFileUrl: '/images/snapshots/baymax.png',
			modelFileUrl: 'models/baymax.json',
			creator: 'Milton Glaser',
			tags: ['Character', 'Futuristic']
		}, {
			_id: 12362,
			title: 'Baymax',
			snapshotFileUrl: '/images/snapshots/baymax.png',
			modelFileUrl: 'models/baymax.json',
			creator: 'Milton Glaser',
			tags: ['Character', 'Futuristic']
		}, {
			_id: 12424,
			title: 'Floating Island',
			snapshotFileUrl: '/images/snapshots/floatingIsland.png',
			modelFileUrl: 'models/untitled-scene/untitled-scene.json',
			creator: 'Mary Anne',
			tags: ['Environment', 'Low-Poly']
		}, {
			_id: 12362,
			title: 'Baymax',
			snapshotFileUrl: '/images/snapshots/baymax.png',
			modelFileUrl: 'models/baymax.json',
			creator: 'Milton Glaser',
			tags: ['Character', 'Futuristic']
		}, {
			_id: 12362,
			title: 'Baymax',
			snapshotFileUrl: '/images/snapshots/baymax.png',
			modelFileUrl: 'models/baymax.json',
			creator: 'Milton Glaser',
			tags: ['Character', 'Futuristic']
		}, {
			_id: 12362,
			title: 'Baymax',
			snapshotFileUrl: '/images/snapshots/baymax.png',
			modelFileUrl: 'models/baymax.json',
			creator: 'Milton Glaser',
			tags: ['Character', 'Futuristic']
		}, {
			_id: 12424,
			title: 'Floating Island',
			snapshotFileUrl: '/images/snapshots/floatingIsland.png',
			modelFileUrl: 'models/untitled-scene/untitled-scene.json',
			creator: 'Mary Anne',
			tags: ['Environment', 'Low-Poly']
		}, {
			_id: 12362,
			title: 'Baymax',
			snapshotFileUrl: '/images/snapshots/baymax.png',
			modelFileUrl: 'models/baymax.json',
			creator: 'Milton Glaser',
			tags: ['Character', 'Futuristic']
		}];
	};

	// Renderer Functionality
	Model.changeModelUrl = function (newUrl) {
		renderObj.modelFileUrl = newUrl;
		return renderObj;
	};
	Model.changeModel = function () {
		// Temp attributes for testing
		renderObj = {
			modelFileUrl: 'models/baymax.json',
			creator: 'Milton Glaser'
		};
	};
	Model.getModelUrl = function () {
		return renderObj.modelFileUrl;
	};
	Model.getModel = function () {
		return renderObj;
	};

	return Model;
});
app.config(function ($stateProvider) {

	$stateProvider.state('signUp', {
		url: '/signup',
		templateUrl: 'js/sign-up/sign-up.html',
		controller: 'SignUpCtrl'
	});
});

app.controller('SignUpCtrl', function ($scope, SignUp, $state) {

	$scope.login = {};
	$scope.error = null;

	$scope.sendSignUp = function (signUpInfo) {

		$scope.error = null;

		SignUp.signup(signUpInfo).then(function () {
			$state.go('listing');
		})['catch'](function () {
			$scope.error = 'Invalid login credentials.';
		});
	};

	$scope.getUsers = function () {
		SignUp.getUsers().then(function (users) {
			console.log(users);
		});
	};
});

'use strict';

app.controller('UploadController', function ($scope) {});
'use strict';

app.config(function ($stateProvider) {
	$stateProvider.state('upload', {
		url: '/upload',
		templateUrl: 'js/upload/upload.html',
		controller: 'UploadController'
	});
});
'use strict';

app.controller('UserController', function ($scope) {});
'use strict';

app.config(function ($stateProvider) {
	$stateProvider.state('user', {
		url: '/user/:id',
		templateUrl: '/browser/js/user/user.html',
		controller: 'UserController',
		resolve: {
			user: function user(User, $stateParams) {
				var user = new User({ _id: $stateParams.id });
				return user.fetch();
			}
		}
	});
});

'use strict';

app.directive('fieldFocus', function ($parse, $timeout) {
	return {
		restrict: 'A',
		link: function link(scope, element, attrs) {
			var status = $parse(attrs.fieldFocus);
			scope.$watch(status, function (val) {
				console.log('status = ', val);
				if (val === true) {
					$timeout(function () {
						element[0].focus();
					});
				}
			});
		}
	};
});

app.factory('SignUp', function ($http, $state, $location) {
	return {
		signup: function signup(credentials) {
			return $http.post('api/user', credentials).then(function (res) {
				console.log(res.data);
				return res.data;
			});
		},

		getUsers: function getUsers() {
			return $http.get('api/user').then(function (response) {
				return response.data;
			});
		}
	};
});

'use strict';

app.directive('collection', function () {
	return {
		restrict: 'E',
		templateUrl: 'js/components/collection/collection.html',
		controller: 'ManagerController'
	};
});
'use strict';

app.directive('navbar', function () {
	return {
		restrict: "E",
		templateUrl: "js/components/navbar/navbar.html",
		controller: 'ManagerController'
	};
});
'use strict';

app.directive('oauthButton', function () {
	return {
		scope: {
			providerName: '@'
		},
		restrict: 'E',
		templateUrl: 'js/components/oauth-button/oauth-button.html'
	};
});
'use strict';

<<<<<<< HEAD
app.directive('searchbar', function () {
	return {
		restrict: 'E',
=======
app.controller('RecEngineController', function ($scope, RenderService) {

	$scope.modelUrl = RenderService.getModelUrl();
});
'use strict';

app.directive('recengine', function () {
	return {
		restrict: 'E',
		replace: true,
		templateUrl: 'js/components/recengine/recengine.html',
		link: function link(scope, element, attr) {}
	};
});
'use strict';

app.factory('RecEngine', function () {

	var recs = function recs() {};
});
'use strict';

app.directive('searchbar', function () {
	return {
		restrict: 'E',
>>>>>>> 8a491b6cc7745de004d40f68d6046ad82dc4a444
		templateUrl: 'js/components/searchbar/searchbar.html'
	};
});

'use strict';

app.controller('ListingController', function ($scope, models, Model) {

	$scope.changeModel = function () {
		console.log($scope.models);
		Model.changeModel();
	};

	$scope.models = models;
});
'use strict';

app.config(function ($stateProvider) {

	$stateProvider.state('listing', {
		url: '/',
		templateUrl: 'js/product/listing/listing.html',
		controller: 'ListingController',
		resolve: {
			models: function models(Model) {
				console.log(Model.fetchAll());
				return Model.fetchAll();
			}
		}
	});
});
'use strict';

app.controller('RenderController', function ($scope, Model) {

	$scope.model = Model.getModel();

	$scope.$watch(function () {
		return Model.getModelUrl();
	}, function (newVal, oldVal) {
		$scope.model = Model.getModel();
	});
});
'use strict';

app.directive('ngWebgl', function () {
	return {
		restrict: 'A',
		scope: {
			model: '=modelFileUrl'
		},
		controller: "RenderController",
		link: function link(scope, element, attr) {

			// Setup selections
			scope.renderFrame = $('#render-frame');
			var renderFrameWidth = scope.renderFrame.width();
			var renderFrameHeight = scope.renderFrame.height();
			var renderObjectScaleModifier = renderFrameWidth / 1024;

			// Setup THREE.js variables with scope
			var camera;
			scope.camera = camera;
			var scene;
			scope.scene = scene;
			var renderer;
			scope.renderer = renderer;
			var previous;
			scope.previous = previous;

			// initialize scene
			init();

			// load default model on scope -- jeep model -- via AssimpJSONLoader
			var loader2 = new THREE.ObjectLoader();
			var loader3 = new THREE.JSONLoader();

			// Watch for changes to scope
			scope.$watch('model.modelFileUrl', function (newValue, oldValue) {
				if (newValue != oldValue) {
					loadModel(newValue);
				}
			});

			//!! Handle removing object and adding new object
			function loadModel(modUrl) {
				loader2.load(modUrl, function (object) {
					object.scale.x = object.scale.y = object.scale.z = .028 * renderObjectScaleModifier;
					object.position.y = .5;
					object.updateMatrix();
					if (previous) scene.remove(previous);
					scene.add(object);

					previous = object;
				});
			}

			// run load model on current modelUrl
			loadModel(scope.model.modelFileUrl);
			animate();

			// Setup THREE.js cameras, scene, renderer, lighting
			function init() {

				// Camera
				camera = new THREE.PerspectiveCamera(50, renderFrameWidth / renderFrameHeight, 1, 2000);
				camera.position.set(2, 4, 5);

				// Scene
				scene = new THREE.Scene();
				// scene.fog = new THREE.FogExp2(0x000000, 0.0001);

				// Lights
				scene.add(new THREE.AmbientLight(0xcccccc));

				var directionalLight = new THREE.DirectionalLight(0xcccccc);
				directionalLight.position.x = Math.random() - 0.5;
				directionalLight.position.y = Math.random() - 0.5;
				directionalLight.position.z = Math.random() - 0.5;
				directionalLight.position.normalize();
				scene.add(directionalLight);

				//!!!! Renderer
				renderer = new THREE.WebGLRenderer({ antialias: true });
				renderer.setSize(renderFrameWidth, renderFrameHeight);
				renderer.setClearColor(0xffffff);
				element[0].appendChild(renderer.domElement);

				// Check for Resize Event
				window.addEventListener('resize', onWindowResize, false);

				// console.log(scene);
			}

			// Handle Resize
			function onWindowResize(event) {
				renderer.setSize(scope.renderFrame.width(), renderFrameHeight);
				camera.aspect = scope.renderFrame.width() / renderFrameHeight;
				camera.updateProjectionMatrix();
			}

			// Animate
			var t = 0; // ?
			function animate() {
				render();
				requestAnimationFrame(animate);
			}

			// Handle re-Rendering of scene for spinning
			function render() {
				var timer = Date.now() * 0.00015;
				camera.position.x = Math.cos(timer) * 10;
				camera.position.y = 4;
				camera.position.z = Math.sin(timer) * 8.5;
				camera.lookAt(scene.position);
				renderer.render(scene, camera);
			}
		}
	};
});
<<<<<<< HEAD
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImZzYS1wcmUtYnVpbHQuanMiLCJsb2dpbi9sb2dpbi5qcyIsImNvbXBvbmVudHMvbWFuYWdlci5jb250cm9sbGVyLmpzIiwicHJvZHVjdC9tb2RlbC5mYWN0b3J5LmpzIiwic2lnbi11cC9zaWduLXVwLmpzIiwidXBsb2FkL3VwbG9hZC5jb250cm9sbGVyLmpzIiwidXBsb2FkL3VwbG9hZC5zdGF0ZS5qcyIsInVzZXIvdXNlci5jb250cm9sbGVyLmpzIiwidXNlci91c2VyLnN0YXRlLmpzIiwidXRpbHMvZmllbGRGb2N1cy5kaXJlY3RpdmUuanMiLCJ1dGlscy9zaWduLXVwLWZhY3RvcnkuanMiLCJjb21wb25lbnRzL2NvbGxlY3Rpb24vY29sbGVjdGlvbi5kaXJlY3RpdmUuanMiLCJjb21wb25lbnRzL25hdmJhci9uYXZiYXIuZGlyZWN0aXZlLmpzIiwiY29tcG9uZW50cy9vYXV0aC1idXR0b24vb2F1dGgtYnV0dG9uLmRpcmVjdGl2ZS5qcyIsImNvbXBvbmVudHMvc2VhcmNoYmFyL3NlYXJjaGJhci5kaXJlY3RpdmUuanMiLCJwcm9kdWN0L2xpc3RpbmcvbGlzdGluZy5jb250cm9sbGVyLmpzIiwicHJvZHVjdC9saXN0aW5nL2xpc3Rpbmcuc3RhdGUuanMiLCJwcm9kdWN0L3JlbmRlci9yZW5kZXIuY29udHJvbGxlci5qcyIsInByb2R1Y3QvcmVuZGVyL3JlbmRlci5kaXJlY3RpdmUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBQSxDQUFBO0FBQ0EsSUFBQSxHQUFBLEdBQUEsT0FBQSxDQUFBLE1BQUEsQ0FBQSx1QkFBQSxFQUFBLENBQUEsV0FBQSxFQUFBLGFBQUEsQ0FBQSxDQUFBLENBQUE7O0FBRUEsR0FBQSxDQUFBLE1BQUEsQ0FBQSxVQUFBLGtCQUFBLEVBQUEsaUJBQUEsRUFBQTs7QUFFQSxrQkFBQSxDQUFBLFNBQUEsQ0FBQSxJQUFBLENBQUEsQ0FBQTs7QUFFQSxtQkFBQSxDQUFBLFNBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQTtBQUNBLG1CQUFBLENBQUEsSUFBQSxDQUFBLGlCQUFBLEVBQUEsWUFBQTtBQUNBLFFBQUEsQ0FBQSxRQUFBLENBQUEsTUFBQSxFQUFBLENBQUE7RUFDQSxDQUFBLENBQUE7Q0FFQSxDQUFBLENBQUE7OztBQUdBLEdBQUEsQ0FBQSxHQUFBLENBQUEsVUFBQSxVQUFBLEVBQUEsV0FBQSxFQUFBLE1BQUEsRUFBQTs7O0FBR0EsS0FBQSw0QkFBQSxHQUFBLFNBQUEsNEJBQUEsQ0FBQSxLQUFBLEVBQUE7QUFDQSxTQUFBLEtBQUEsQ0FBQSxJQUFBLElBQUEsS0FBQSxDQUFBLElBQUEsQ0FBQSxZQUFBLENBQUE7RUFDQSxDQUFBOzs7O0FBSUEsV0FBQSxDQUFBLEdBQUEsQ0FBQSxtQkFBQSxFQUFBLFVBQUEsS0FBQSxFQUFBLE9BQUEsRUFBQTs7QUFFQSxNQUFBLENBQUEsNEJBQUEsQ0FBQSxPQUFBLENBQUEsRUFBQTs7O0FBR0EsVUFBQTtHQUNBOztBQUVBLE1BQUEsV0FBQSxDQUFBLGVBQUEsRUFBQSxFQUFBOzs7QUFHQSxVQUFBO0dBQ0E7OztBQUdBLE9BQUEsQ0FBQSxjQUFBLEVBQUEsQ0FBQTs7QUFFQSxhQUFBLENBQUEsZUFBQSxFQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsSUFBQSxFQUFBOzs7O0FBSUEsT0FBQSxXQUFBLEdBQUEsSUFBQSxHQUFBLE9BQUEsQ0FBQSxJQUFBLEdBQUEsT0FBQSxDQUFBO0FBQ0EsU0FBQSxDQUFBLEVBQUEsQ0FBQSxXQUFBLENBQUEsQ0FBQTtHQUNBLENBQUEsQ0FBQTtFQUVBLENBQUEsQ0FBQTtDQUVBLENBQUEsQ0FBQTtBQ25EQSxDQUFBLFlBQUE7O0FBRUEsYUFBQSxDQUFBOzs7QUFHQSxLQUFBLENBQUEsTUFBQSxDQUFBLE9BQUEsRUFBQSxNQUFBLElBQUEsS0FBQSxDQUFBLHdCQUFBLENBQUEsQ0FBQTs7QUFFQSxLQUFBLEdBQUEsR0FBQSxPQUFBLENBQUEsTUFBQSxDQUFBLGFBQUEsRUFBQSxFQUFBLENBQUEsQ0FBQTs7QUFFQSxJQUFBLENBQUEsT0FBQSxDQUFBLFFBQUEsRUFBQSxZQUFBO0FBQ0EsTUFBQSxDQUFBLE1BQUEsQ0FBQSxFQUFBLEVBQUEsTUFBQSxJQUFBLEtBQUEsQ0FBQSxzQkFBQSxDQUFBLENBQUE7QUFDQSxTQUFBLE1BQUEsQ0FBQSxFQUFBLENBQUEsTUFBQSxDQUFBLFFBQUEsQ0FBQSxNQUFBLENBQUEsQ0FBQTtFQUNBLENBQUEsQ0FBQTs7Ozs7QUFLQSxJQUFBLENBQUEsUUFBQSxDQUFBLGFBQUEsRUFBQTtBQUNBLGNBQUEsRUFBQSxvQkFBQTtBQUNBLGFBQUEsRUFBQSxtQkFBQTtBQUNBLGVBQUEsRUFBQSxxQkFBQTtBQUNBLGdCQUFBLEVBQUEsc0JBQUE7QUFDQSxrQkFBQSxFQUFBLHdCQUFBO0FBQ0EsZUFBQSxFQUFBLHFCQUFBO0VBQ0EsQ0FBQSxDQUFBOztBQUVBLElBQUEsQ0FBQSxPQUFBLENBQUEsaUJBQUEsRUFBQSxVQUFBLFVBQUEsRUFBQSxFQUFBLEVBQUEsV0FBQSxFQUFBO0FBQ0EsTUFBQSxVQUFBLEdBQUE7QUFDQSxNQUFBLEVBQUEsV0FBQSxDQUFBLGdCQUFBO0FBQ0EsTUFBQSxFQUFBLFdBQUEsQ0FBQSxhQUFBO0FBQ0EsTUFBQSxFQUFBLFdBQUEsQ0FBQSxjQUFBO0FBQ0EsTUFBQSxFQUFBLFdBQUEsQ0FBQSxjQUFBO0dBQ0EsQ0FBQTtBQUNBLFNBQUE7QUFDQSxnQkFBQSxFQUFBLHVCQUFBLFFBQUEsRUFBQTtBQUNBLGNBQUEsQ0FBQSxVQUFBLENBQUEsVUFBQSxDQUFBLFFBQUEsQ0FBQSxNQUFBLENBQUEsRUFBQSxRQUFBLENBQUEsQ0FBQTtBQUNBLFdBQUEsRUFBQSxDQUFBLE1BQUEsQ0FBQSxRQUFBLENBQUEsQ0FBQTtJQUNBO0dBQ0EsQ0FBQTtFQUNBLENBQUEsQ0FBQTs7QUFFQSxJQUFBLENBQUEsTUFBQSxDQUFBLFVBQUEsYUFBQSxFQUFBO0FBQ0EsZUFBQSxDQUFBLFlBQUEsQ0FBQSxJQUFBLENBQUEsQ0FDQSxXQUFBLEVBQ0EsVUFBQSxTQUFBLEVBQUE7QUFDQSxVQUFBLFNBQUEsQ0FBQSxHQUFBLENBQUEsaUJBQUEsQ0FBQSxDQUFBO0dBQ0EsQ0FDQSxDQUFBLENBQUE7RUFDQSxDQUFBLENBQUE7O0FBRUEsSUFBQSxDQUFBLE9BQUEsQ0FBQSxhQUFBLEVBQUEsVUFBQSxLQUFBLEVBQUEsT0FBQSxFQUFBLFVBQUEsRUFBQSxXQUFBLEVBQUEsRUFBQSxFQUFBOztBQUVBLFdBQUEsaUJBQUEsQ0FBQSxRQUFBLEVBQUE7QUFDQSxPQUFBLElBQUEsR0FBQSxRQUFBLENBQUEsSUFBQSxDQUFBO0FBQ0EsVUFBQSxDQUFBLEdBQUEsQ0FBQSxXQUFBLENBQUEsQ0FBQTtBQUNBLFVBQUEsQ0FBQSxNQUFBLENBQUEsSUFBQSxDQUFBLEVBQUEsRUFBQSxJQUFBLENBQUEsSUFBQSxDQUFBLENBQUE7QUFDQSxhQUFBLENBQUEsVUFBQSxDQUFBLFdBQUEsQ0FBQSxZQUFBLENBQUEsQ0FBQTtBQUNBLFVBQUEsSUFBQSxDQUFBLElBQUEsQ0FBQTtHQUNBOzs7O0FBSUEsTUFBQSxDQUFBLGVBQUEsR0FBQSxZQUFBO0FBQ0EsVUFBQSxDQUFBLENBQUEsT0FBQSxDQUFBLElBQUEsQ0FBQTtHQUNBLENBQUE7O0FBRUEsTUFBQSxDQUFBLGVBQUEsR0FBQSxVQUFBLFVBQUEsRUFBQTs7Ozs7Ozs7OztBQVVBLE9BQUEsSUFBQSxDQUFBLGVBQUEsRUFBQSxJQUFBLFVBQUEsS0FBQSxJQUFBLEVBQUE7QUFDQSxXQUFBLEVBQUEsQ0FBQSxJQUFBLENBQUEsT0FBQSxDQUFBLElBQUEsQ0FBQSxDQUFBO0lBQ0E7Ozs7O0FBS0EsVUFBQSxLQUFBLENBQUEsR0FBQSxDQUFBLFVBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBQSxpQkFBQSxDQUFBLFNBQUEsQ0FBQSxZQUFBO0FBQ0EsV0FBQSxJQUFBLENBQUE7SUFDQSxDQUFBLENBQUE7R0FFQSxDQUFBOztBQUVBLE1BQUEsQ0FBQSxLQUFBLEdBQUEsVUFBQSxXQUFBLEVBQUE7QUFDQSxVQUFBLEtBQUEsQ0FBQSxJQUFBLENBQUEsUUFBQSxFQUFBLFdBQUEsQ0FBQSxDQUNBLElBQUEsQ0FBQSxpQkFBQSxDQUFBLFNBQ0EsQ0FBQSxZQUFBO0FBQ0EsV0FBQSxFQUFBLENBQUEsTUFBQSxDQUFBLEVBQUEsT0FBQSxFQUFBLDRCQUFBLEVBQUEsQ0FBQSxDQUFBO0lBQ0EsQ0FBQSxDQUFBO0dBQ0EsQ0FBQTs7QUFFQSxNQUFBLENBQUEsTUFBQSxHQUFBLFlBQUE7QUFDQSxVQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUEsU0FBQSxDQUFBLENBQUEsSUFBQSxDQUFBLFlBQUE7QUFDQSxXQUFBLENBQUEsT0FBQSxFQUFBLENBQUE7QUFDQSxjQUFBLENBQUEsVUFBQSxDQUFBLFdBQUEsQ0FBQSxhQUFBLENBQUEsQ0FBQTtJQUNBLENBQUEsQ0FBQTtHQUNBLENBQUE7RUFFQSxDQUFBLENBQUE7O0FBRUEsSUFBQSxDQUFBLE9BQUEsQ0FBQSxTQUFBLEVBQUEsVUFBQSxVQUFBLEVBQUEsV0FBQSxFQUFBOztBQUVBLE1BQUEsSUFBQSxHQUFBLElBQUEsQ0FBQTs7QUFFQSxZQUFBLENBQUEsR0FBQSxDQUFBLFdBQUEsQ0FBQSxnQkFBQSxFQUFBLFlBQUE7QUFDQSxPQUFBLENBQUEsT0FBQSxFQUFBLENBQUE7R0FDQSxDQUFBLENBQUE7O0FBRUEsWUFBQSxDQUFBLEdBQUEsQ0FBQSxXQUFBLENBQUEsY0FBQSxFQUFBLFlBQUE7QUFDQSxPQUFBLENBQUEsT0FBQSxFQUFBLENBQUE7R0FDQSxDQUFBLENBQUE7O0FBRUEsTUFBQSxDQUFBLEVBQUEsR0FBQSxJQUFBLENBQUE7QUFDQSxNQUFBLENBQUEsSUFBQSxHQUFBLElBQUEsQ0FBQTs7QUFFQSxNQUFBLENBQUEsTUFBQSxHQUFBLFVBQUEsU0FBQSxFQUFBLElBQUEsRUFBQTtBQUNBLE9BQUEsQ0FBQSxFQUFBLEdBQUEsU0FBQSxDQUFBO0FBQ0EsT0FBQSxDQUFBLElBQUEsR0FBQSxJQUFBLENBQUE7R0FDQSxDQUFBOztBQUVBLE1BQUEsQ0FBQSxPQUFBLEdBQUEsWUFBQTtBQUNBLE9BQUEsQ0FBQSxFQUFBLEdBQUEsSUFBQSxDQUFBO0FBQ0EsT0FBQSxDQUFBLElBQUEsR0FBQSxJQUFBLENBQUE7R0FDQSxDQUFBO0VBRUEsQ0FBQSxDQUFBO0NBRUEsQ0FBQSxFQUFBLENBQUE7O0FDcklBLEdBQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxjQUFBLEVBQUE7O0FBRUEsZUFBQSxDQUFBLEtBQUEsQ0FBQSxPQUFBLEVBQUE7QUFDQSxLQUFBLEVBQUEsUUFBQTtBQUNBLGFBQUEsRUFBQSxxQkFBQTtBQUNBLFlBQUEsRUFBQSxXQUFBO0VBQ0EsQ0FBQSxDQUFBO0NBRUEsQ0FBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxVQUFBLENBQUEsV0FBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLFdBQUEsRUFBQSxNQUFBLEVBQUE7O0FBRUEsT0FBQSxDQUFBLEtBQUEsR0FBQSxFQUFBLENBQUE7QUFDQSxPQUFBLENBQUEsS0FBQSxHQUFBLElBQUEsQ0FBQTs7QUFFQSxPQUFBLENBQUEsU0FBQSxHQUFBLFVBQUEsU0FBQSxFQUFBO0FBQ0EsU0FBQSxDQUFBLEdBQUEsQ0FBQSxnQkFBQSxDQUFBLENBQUE7QUFDQSxRQUFBLENBQUEsS0FBQSxHQUFBLElBQUEsQ0FBQTs7QUFFQSxhQUFBLENBQUEsS0FBQSxDQUFBLFNBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBQSxZQUFBO0FBQ0EsU0FBQSxDQUFBLEVBQUEsQ0FBQSxNQUFBLENBQUEsQ0FBQTtHQUNBLENBQUEsU0FBQSxDQUFBLFlBQUE7QUFDQSxTQUFBLENBQUEsS0FBQSxHQUFBLDRCQUFBLENBQUE7R0FDQSxDQUFBLENBQUE7RUFFQSxDQUFBO0NBRUEsQ0FBQSxDQUFBO0FDM0JBLFlBQUEsQ0FBQTs7QUFFQSxHQUFBLENBQUEsVUFBQSxDQUFBLG1CQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsUUFBQSxFQUFBOzs7QUFHQSxPQUFBLENBQUEsWUFBQSxHQUFBLEtBQUEsQ0FBQTs7O0FBR0EsT0FBQSxDQUFBLGNBQUEsR0FBQSxLQUFBLENBQUE7QUFDQSxPQUFBLENBQUEsZ0JBQUEsR0FBQSxZQUFBO0FBQ0EsTUFBQSxDQUFBLE1BQUEsQ0FBQSxjQUFBLEVBQUEsTUFBQSxDQUFBLGNBQUEsR0FBQSxJQUFBLENBQUEsS0FDQTtBQUNBLFNBQUEsQ0FBQSxjQUFBLEdBQUEsS0FBQSxDQUFBO0dBQ0E7RUFDQSxDQUFBOzs7QUFHQSxPQUFBLENBQUEsV0FBQSxHQUFBLFlBQUE7QUFDQSxRQUFBLENBQUEsY0FBQSxHQUFBLEtBQUEsQ0FBQTtBQUNBLFVBQUEsQ0FBQSxZQUFBO0FBQ0EsU0FBQSxDQUFBLFlBQUEsR0FBQSxLQUFBLENBQUE7R0FDQSxFQUFBLEdBQUEsQ0FBQSxDQUFBO0VBQ0EsQ0FBQTs7O0FBR0EsT0FBQSxDQUFBLFVBQUEsR0FBQSxFQUFBLENBQUE7Q0FFQSxDQUFBLENBQUE7QUMzQkEsWUFBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxPQUFBLENBQUEsT0FBQSxFQUFBLFVBQUEsS0FBQSxFQUFBOzs7QUFHQSxLQUFBLFNBQUEsR0FBQTtBQUNBLGNBQUEsRUFBQSwyQ0FBQTtBQUNBLFNBQUEsRUFBQSxXQUFBO0VBQ0EsQ0FBQTs7O0FBSUEsVUFBQSxLQUFBLENBQUEsS0FBQSxFQUFBO0FBQ0EsU0FBQSxDQUFBLE1BQUEsQ0FBQSxJQUFBLEVBQUEsS0FBQSxDQUFBLENBQUE7RUFDQSxDQUFBOztBQUVBLE1BQUEsQ0FBQSxHQUFBLEdBQUEsYUFBQSxDQUFBO0FBQ0EsT0FBQSxDQUFBLGNBQUEsQ0FBQSxLQUFBLENBQUEsU0FBQSxFQUFBLEtBQUEsRUFBQTtBQUNBLEtBQUEsRUFBQSxlQUFBO0FBQ0EsVUFBQSxLQUFBLENBQUEsR0FBQSxHQUFBLElBQUEsQ0FBQSxHQUFBLENBQUE7R0FDQTtFQUNBLENBQUEsQ0FBQTs7O0FBSUEsTUFBQSxDQUFBLFNBQUEsQ0FBQSxLQUFBLEdBQUEsWUFBQTtBQUNBLFNBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQSxJQUFBLENBQUEsR0FBQSxDQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0EsVUFBQSxJQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUEsSUFBQSxDQUFBLENBQUE7R0FDQSxDQUFBLENBQUE7RUFDQSxDQUFBOztBQUVBLE1BQUEsQ0FBQSxRQUFBLEdBQUEsWUFBQTs7Ozs7O0FBTUEsU0FBQSxDQUFBLEdBQUEsRUFBQSxDQUFBO0FBQ0EsU0FBQSxDQUNBO0FBQ0EsTUFBQSxFQUFBLEtBQUE7QUFDQSxRQUFBLEVBQUEsaUJBQUE7QUFDQSxrQkFBQSxFQUFBLHNDQUFBO0FBQ0EsZUFBQSxFQUFBLDJDQUFBO0FBQ0EsVUFBQSxFQUFBLFdBQUE7QUFDQSxPQUFBLEVBQUEsQ0FBQSxhQUFBLEVBQUEsVUFBQSxDQUFBO0dBQ0EsRUFDQTtBQUNBLE1BQUEsRUFBQSxLQUFBO0FBQ0EsUUFBQSxFQUFBLFFBQUE7QUFDQSxrQkFBQSxFQUFBLDhCQUFBO0FBQ0EsZUFBQSxFQUFBLG9CQUFBO0FBQ0EsVUFBQSxFQUFBLGVBQUE7QUFDQSxPQUFBLEVBQUEsQ0FBQSxXQUFBLEVBQUEsWUFBQSxDQUFBO0dBQ0EsRUFDQTtBQUNBLE1BQUEsRUFBQSxLQUFBO0FBQ0EsUUFBQSxFQUFBLGlCQUFBO0FBQ0Esa0JBQUEsRUFBQSxzQ0FBQTtBQUNBLGVBQUEsRUFBQSwyQ0FBQTtBQUNBLFVBQUEsRUFBQSxXQUFBO0FBQ0EsT0FBQSxFQUFBLENBQUEsYUFBQSxFQUFBLFVBQUEsQ0FBQTtHQUNBLEVBQ0E7QUFDQSxNQUFBLEVBQUEsS0FBQTtBQUNBLFFBQUEsRUFBQSxRQUFBO0FBQ0Esa0JBQUEsRUFBQSw4QkFBQTtBQUNBLGVBQUEsRUFBQSxvQkFBQTtBQUNBLFVBQUEsRUFBQSxlQUFBO0FBQ0EsT0FBQSxFQUFBLENBQUEsV0FBQSxFQUFBLFlBQUEsQ0FBQTtHQUNBLEVBQ0E7QUFDQSxNQUFBLEVBQUEsS0FBQTtBQUNBLFFBQUEsRUFBQSxpQkFBQTtBQUNBLGtCQUFBLEVBQUEsc0NBQUE7QUFDQSxlQUFBLEVBQUEsMkNBQUE7QUFDQSxVQUFBLEVBQUEsV0FBQTtBQUNBLE9BQUEsRUFBQSxDQUFBLGFBQUEsRUFBQSxVQUFBLENBQUE7R0FDQSxFQUNBO0FBQ0EsTUFBQSxFQUFBLEtBQUE7QUFDQSxRQUFBLEVBQUEsUUFBQTtBQUNBLGtCQUFBLEVBQUEsOEJBQUE7QUFDQSxlQUFBLEVBQUEsb0JBQUE7QUFDQSxVQUFBLEVBQUEsZUFBQTtBQUNBLE9BQUEsRUFBQSxDQUFBLFdBQUEsRUFBQSxZQUFBLENBQUE7R0FDQSxFQUNBO0FBQ0EsTUFBQSxFQUFBLEtBQUE7QUFDQSxRQUFBLEVBQUEsUUFBQTtBQUNBLGtCQUFBLEVBQUEsOEJBQUE7QUFDQSxlQUFBLEVBQUEsb0JBQUE7QUFDQSxVQUFBLEVBQUEsZUFBQTtBQUNBLE9BQUEsRUFBQSxDQUFBLFdBQUEsRUFBQSxZQUFBLENBQUE7R0FDQSxFQUNBO0FBQ0EsTUFBQSxFQUFBLEtBQUE7QUFDQSxRQUFBLEVBQUEsaUJBQUE7QUFDQSxrQkFBQSxFQUFBLHNDQUFBO0FBQ0EsZUFBQSxFQUFBLDJDQUFBO0FBQ0EsVUFBQSxFQUFBLFdBQUE7QUFDQSxPQUFBLEVBQUEsQ0FBQSxhQUFBLEVBQUEsVUFBQSxDQUFBO0dBQ0EsRUFDQTtBQUNBLE1BQUEsRUFBQSxLQUFBO0FBQ0EsUUFBQSxFQUFBLFFBQUE7QUFDQSxrQkFBQSxFQUFBLDhCQUFBO0FBQ0EsZUFBQSxFQUFBLG9CQUFBO0FBQ0EsVUFBQSxFQUFBLGVBQUE7QUFDQSxPQUFBLEVBQUEsQ0FBQSxXQUFBLEVBQUEsWUFBQSxDQUFBO0dBQ0EsRUFDQTtBQUNBLE1BQUEsRUFBQSxLQUFBO0FBQ0EsUUFBQSxFQUFBLFFBQUE7QUFDQSxrQkFBQSxFQUFBLDhCQUFBO0FBQ0EsZUFBQSxFQUFBLG9CQUFBO0FBQ0EsVUFBQSxFQUFBLGVBQUE7QUFDQSxPQUFBLEVBQUEsQ0FBQSxXQUFBLEVBQUEsWUFBQSxDQUFBO0dBQ0EsRUFDQTtBQUNBLE1BQUEsRUFBQSxLQUFBO0FBQ0EsUUFBQSxFQUFBLFFBQUE7QUFDQSxrQkFBQSxFQUFBLDhCQUFBO0FBQ0EsZUFBQSxFQUFBLG9CQUFBO0FBQ0EsVUFBQSxFQUFBLGVBQUE7QUFDQSxPQUFBLEVBQUEsQ0FBQSxXQUFBLEVBQUEsWUFBQSxDQUFBO0dBQ0EsRUFDQTtBQUNBLE1BQUEsRUFBQSxLQUFB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QSxZQUFBLENBQUE7R0FDQSxFQUNBO0FBQ0EsTUFBQSxFQUFBLEtBQUE7QUFDQSxRQUFBLEVBQUEsUUFBQTtBQUNBLGtCQUFBLEVBQUEsOEJBQUE7QUFDQSxlQUFBLEVBQUEsb0JBQUE7QUFDQSxVQUFBLEVBQUEsZUFBQTtBQUNBLE9BQUEsRUFBQSxDQUFBLFdBQUEsRUFBQSxZQUFBLENBQUE7R0FDQSxFQUNBO0FBQ0EsTUFBQSxFQUFBLEtBQUE7QUFDQSxRQUFBLEVBQUEsaUJBQUE7QUFDQSxrQkFBQSxFQUFBLHNDQUFBO0FBQ0EsZUFBQSxFQUFBLDJDQUFBO0FBQ0EsVUFBQSxFQUFBLFdBQUE7QUFDQSxPQUFBLEVBQUEsQ0FBQSxhQUFBLEVBQUEsVUFBQSxDQUFBO0dBQ0EsRUFDQTtBQUNBLE1BQUEsRUFBQSxLQUFBO0FBQ0EsUUFBQSxFQUFBLFFBQUE7QUFDQSxrQkFBQSxFQUFBLDhCQUFBO0FBQ0EsZUFBQSxFQUFBLG9CQUFBO0FBQ0EsVUFBQSxFQUFBLGVBQUE7QUFDQSxPQUFBLEVBQUEsQ0FBQSxXQUFBLEVBQUEsWUFBQSxDQUFBO0dBQ0EsQ0FBQSxDQUFBO0VBRUEsQ0FBQTs7O0FBSUEsTUFBQSxDQUFBLGNBQUEsR0FBQSxVQUFBLE1BQUEsRUFBQTtBQUNBLFdBQUEsQ0FBQSxZQUFBLEdBQUEsTUFBQSxDQUFBO0FBQ0EsU0FBQSxTQUFBLENBQUE7RUFDQSxDQUFBO0FBQ0EsTUFBQSxDQUFBLFdBQUEsR0FBQSxZQUFBOztBQUVBLFdBQUEsR0FBQTtBQUNBLGVBQUEsRUFBQSxvQkFBQTtBQUNBLFVBQUEsRUFBQSxlQUFBO0dBQ0EsQ0FBQTtFQUNBLENBQUE7QUFDQSxNQUFBLENBQUEsV0FBQSxHQUFBLFlBQUE7QUFDQSxTQUFBLFNBQUEsQ0FBQSxZQUFBLENBQUE7RUFDQSxDQUFBO0FBQ0EsTUFBQSxDQUFBLFFBQUEsR0FBQSxZQUFBO0FBQ0EsU0FBQSxTQUFBLENBQUE7RUFDQSxDQUFBOztBQUlBLFFBQUEsS0FBQSxDQUFBO0NBRUEsQ0FBQSxDQUFBO0FDbFJBLEdBQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxjQUFBLEVBQUE7O0FBRUEsZUFBQSxDQUFBLEtBQUEsQ0FBQSxRQUFBLEVBQUE7QUFDQSxLQUFBLEVBQUEsU0FBQTtBQUNBLGFBQUEsRUFBQSx5QkFBQTtBQUNBLFlBQUEsRUFBQSxZQUFBO0VBQ0EsQ0FBQSxDQUFBO0NBRUEsQ0FBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxVQUFBLENBQUEsWUFBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLE1BQUEsRUFBQSxNQUFBLEVBQUE7O0FBRUEsT0FBQSxDQUFBLEtBQUEsR0FBQSxFQUFBLENBQUE7QUFDQSxPQUFBLENBQUEsS0FBQSxHQUFBLElBQUEsQ0FBQTs7QUFFQSxPQUFBLENBQUEsVUFBQSxHQUFBLFVBQUEsVUFBQSxFQUFBOztBQUVBLFFBQUEsQ0FBQSxLQUFBLEdBQUEsSUFBQSxDQUFBOztBQUVBLFFBQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxDQUFBLENBQUEsSUFBQSxDQUFBLFlBQUE7QUFDQSxTQUFBLENBQUEsRUFBQSxDQUFBLFNBQUEsQ0FBQSxDQUFBO0dBQ0EsQ0FBQSxTQUFBLENBQUEsWUFBQTtBQUNBLFNBQUEsQ0FBQSxLQUFBLEdBQUEsNEJBQUEsQ0FBQTtHQUNBLENBQUEsQ0FBQTtFQUVBLENBQUE7O0FBRUEsT0FBQSxDQUFBLFFBQUEsR0FBQSxZQUFBO0FBQ0EsUUFBQSxDQUFBLFFBQUEsRUFBQSxDQUFBLElBQUEsQ0FBQSxVQUFBLEtBQUEsRUFBQTtBQUNBLFVBQUEsQ0FBQSxHQUFBLENBQUEsS0FBQSxDQUFBLENBQUE7R0FDQSxDQUFBLENBQUE7RUFDQSxDQUFBO0NBRUEsQ0FBQSxDQUFBOztBQ2pDQSxZQUFBLENBQUE7O0FBRUEsR0FBQSxDQUFBLFVBQUEsQ0FBQSxrQkFBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLEVBRUEsQ0FBQSxDQUFBO0FDSkEsWUFBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxjQUFBLEVBQUE7QUFDQSxlQUFBLENBQUEsS0FBQSxDQUFBLFFBQUEsRUFBQTtBQUNBLEtBQUEsRUFBQSxTQUFBO0FBQ0EsYUFBQSxFQUFBLHVCQUFBO0FBQ0EsWUFBQSxFQUFBLGtCQUFBO0VBQ0EsQ0FBQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBO0FDUkEsWUFBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxVQUFBLENBQUEsZ0JBQUEsRUFBQSxVQUFBLE1BQUEsRUFBQSxFQUlBLENBQUEsQ0FBQTtBQ05BLFlBQUEsQ0FBQTs7QUFFQSxHQUFBLENBQUEsTUFBQSxDQUFBLFVBQUEsY0FBQSxFQUFBO0FBQ0EsZUFBQSxDQUFBLEtBQUEsQ0FBQSxNQUFBLEVBQUE7QUFDQSxLQUFBLEVBQUEsV0FBQTtBQUNBLGFBQUEsRUFBQSw0QkFBQTtBQUNBLFlBQUEsRUFBQSxnQkFBQTtBQUNBLFNBQUEsRUFBQTtBQUNBLE9BQUEsRUFBQSxjQUFBLElBQUEsRUFBQSxZQUFBLEVBQUE7QUFDQSxRQUFBLElBQUEsR0FBQSxJQUFBLElBQUEsQ0FBQSxFQUFBLEdBQUEsRUFBQSxZQUFBLENBQUEsRUFBQSxFQUFBLENBQUEsQ0FBQTtBQUNBLFdBQUEsSUFBQSxDQUFBLEtBQUEsRUFBQSxDQUFBO0lBQ0E7R0FDQTtFQUNBLENBQUEsQ0FBQTtDQUNBLENBQUEsQ0FBQTs7QUNkQSxZQUFBLENBQUE7O0FBRUEsR0FBQSxDQUFBLFNBQUEsQ0FBQSxZQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsUUFBQSxFQUFBO0FBQ0EsUUFBQTtBQUNBLFVBQUEsRUFBQSxHQUFBO0FBQ0EsTUFBQSxFQUFBLGNBQUEsS0FBQSxFQUFBLE9BQUEsRUFBQSxLQUFBLEVBQUE7QUFDQSxPQUFBLE1BQUEsR0FBQSxNQUFBLENBQUEsS0FBQSxDQUFBLFVBQUEsQ0FBQSxDQUFBO0FBQ0EsUUFBQSxDQUFBLE1BQUEsQ0FBQSxNQUFBLEVBQUEsVUFBQSxHQUFBLEVBQUE7QUFDQSxXQUFBLENBQUEsR0FBQSxDQUFBLFdBQUEsRUFBQSxHQUFBLENBQUEsQ0FBQTtBQUNBLFFBQUEsR0FBQSxLQUFBLElBQUEsRUFBQTtBQUNBLGFBQUEsQ0FBQSxZQUFBO0FBQ0EsYUFBQSxDQUFBLENBQUEsQ0FBQSxDQUFBLEtBQUEsRUFBQSxDQUFBO01BQ0EsQ0FBQSxDQUFBO0tBQ0E7SUFDQSxDQUFBLENBQUE7R0FDQTtFQUNBLENBQUE7Q0FDQSxDQUFBLENBQUE7O0FDaEJBLEdBQUEsQ0FBQSxPQUFBLENBQUEsUUFBQSxFQUFBLFVBQUEsS0FBQSxFQUFBLE1BQUEsRUFBQSxTQUFBLEVBQUE7QUFDQSxRQUFBO0FBQ0EsUUFBQSxFQUFBLGdCQUFBLFdBQUEsRUFBQTtBQUNBLFVBQUEsS0FBQSxDQUFBLElBQUEsQ0FBQSxVQUFBLEVBQUEsV0FBQSxDQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0EsV0FBQSxDQUFBLEdBQUEsQ0FBQSxHQUFBLENBQUEsSUFBQSxDQUFBLENBQUE7QUFDQSxXQUFBLEdBQUEsQ0FBQSxJQUFBLENBQUE7SUFDQSxDQUFBLENBQUE7R0FDQTs7QUFFQSxVQUFBLEVBQUEsb0JBQUE7QUFDQSxVQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUEsVUFBQSxDQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsUUFBQSxFQUFBO0FBQ0EsV0FBQSxRQUFBLENBQUEsSUFBQSxDQUFBO0lBQ0EsQ0FBQSxDQUFBO0dBQ0E7RUFDQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBOztBQ2hCQSxZQUFBLENBQUE7O0FBRUEsR0FBQSxDQUFBLFNBQUEsQ0FBQSxZQUFBLEVBQUEsWUFBQTtBQUNBLFFBQUE7QUFDQSxVQUFBLEVBQUEsR0FBQTtBQUNBLGFBQUEsRUFBQSwwQ0FBQTtBQUNBLFlBQUEsRUFBQSxtQkFBQTtFQUNBLENBQUE7Q0FDQSxDQUFBLENBQUE7QUNSQSxZQUFBLENBQUE7O0FBRUEsR0FBQSxDQUFBLFNBQUEsQ0FBQSxRQUFBLEVBQUEsWUFBQTtBQUNBLFFBQUE7QUFDQSxVQUFBLEVBQUEsR0FBQTtBQUNBLGFBQUEsRUFBQSxrQ0FBQTtBQUNBLFlBQUEsRUFBQSxtQkFBQTtFQUNBLENBQUE7Q0FDQSxDQUFBLENBQUE7QUNSQSxZQUFBLENBQUE7O0FBRUEsR0FBQSxDQUFBLFNBQUEsQ0FBQSxhQUFBLEVBQUEsWUFBQTtBQUNBLFFBQUE7QUFDQSxPQUFBLEVBQUE7QUFDQSxlQUFBLEVBQUEsR0FBQTtHQUNBO0FBQ0EsVUFBQSxFQUFBLEdBQUE7QUFDQSxhQUFBLEVBQUEsOENBQUE7RUFDQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBO0FDVkEsWUFBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxTQUFBLENBQUEsV0FBQSxFQUFBLFlBQUE7QUFDQSxRQUFBO0FBQ0EsVUFBQSxFQUFBLEdBQUE7QUFDQSxhQUFBLEVBQUEsd0NBQUE7RUFDQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBOztBQ1BBLFlBQUEsQ0FBQTs7QUFFQSxHQUFBLENBQUEsVUFBQSxDQUFBLG1CQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsTUFBQSxFQUFBLEtBQUEsRUFBQTs7QUFFQSxPQUFBLENBQUEsV0FBQSxHQUFBLFlBQUE7QUFDQSxTQUFBLENBQUEsR0FBQSxDQUFBLE1BQUEsQ0FBQSxNQUFBLENBQUEsQ0FBQTtBQUNBLE9BQUEsQ0FBQSxXQUFBLEVBQUEsQ0FBQTtFQUNBLENBQUE7O0FBRUEsT0FBQSxDQUFBLE1BQUEsR0FBQSxNQUFBLENBQUE7Q0FFQSxDQUFBLENBQUE7QUNYQSxZQUFBLENBQUE7O0FBRUEsR0FBQSxDQUFBLE1BQUEsQ0FBQSxVQUFBLGNBQUEsRUFBQTs7QUFFQSxlQUFBLENBQUEsS0FBQSxDQUFBLFNBQUEsRUFBQTtBQUNBLEtBQUEsRUFBQSxHQUFBO0FBQ0EsYUFBQSxFQUFBLGlDQUFBO0FBQ0EsWUFBQSxFQUFBLG1CQUFBO0FBQ0EsU0FBQSxFQUFBO0FBQ0EsU0FBQSxFQUFBLGdCQUFBLEtBQUEsRUFBQTtBQUNBLFdBQUEsQ0FBQSxHQUFBLENBQUEsS0FBQSxDQUFBLFFBQUEsRUFBQSxDQUFBLENBQUE7QUFDQSxXQUFBLEtBQUEsQ0FBQSxRQUFBLEVBQUEsQ0FBQTtJQUNBO0dBQ0E7RUFDQSxDQUFBLENBQUE7Q0FFQSxDQUFBLENBQUE7QUNoQkEsWUFBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxVQUFBLENBQUEsa0JBQUEsRUFBQSxVQUFBLE1BQUEsRUFBQSxLQUFBLEVBQUE7O0FBRUEsT0FBQSxDQUFBLEtBQUEsR0FBQSxLQUFBLENBQUEsUUFBQSxFQUFBLENBQUE7O0FBRUEsT0FBQSxDQUFBLE1BQUEsQ0FBQSxZQUFBO0FBQ0EsU0FBQSxLQUFBLENBQUEsV0FBQSxFQUFBLENBQUE7RUFDQSxFQUFBLFVBQUEsTUFBQSxFQUFBLE1BQUEsRUFBQTtBQUNBLFFBQUEsQ0FBQSxLQUFBLEdBQUEsS0FBQSxDQUFBLFFBQUEsRUFBQSxDQUFBO0VBQ0EsQ0FBQSxDQUFBO0NBRUEsQ0FBQSxDQUFBO0FDWkEsWUFBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxTQUFBLENBQUEsU0FBQSxFQUFBLFlBQUE7QUFDQSxRQUFBO0FBQ0EsVUFBQSxFQUFBLEdBQUE7QUFDQSxPQUFBLEVBQUE7QUFDQSxRQUFBLEVBQUEsZUFBQTtHQUNBO0FBQ0EsWUFBQSxFQUFBLGtCQUFBO0FBQ0EsTUFBQSxFQUFBLGNBQUEsS0FBQSxFQUFBLE9BQUEsRUFBQSxJQUFBLEVBQUE7OztBQUdBLFFBQUEsQ0FBQSxXQUFBLEdBQUEsQ0FBQSxDQUFBLGVBQUEsQ0FBQSxDQUFBO0FBQ0EsT0FBQSxnQkFBQSxHQUFBLEtBQUEsQ0FBQSxXQUFBLENBQUEsS0FBQSxFQUFBLENBQUE7QUFDQSxPQUFBLGlCQUFBLEdBQUEsS0FBQSxDQUFBLFdBQUEsQ0FBQSxNQUFBLEVBQUEsQ0FBQTtBQUNBLE9BQUEseUJBQUEsR0FBQSxnQkFBQSxHQUFBLElBQUEsQ0FBQTs7O0FBR0EsT0FBQSxNQUFBLENBQUE7QUFDQSxRQUFBLENBQUEsTUFBQSxHQUFBLE1BQUEsQ0FBQTtBQUNBLE9BQUEsS0FBQSxDQUFBO0FBQ0EsUUFBQSxDQUFBLEtBQUEsR0FBQSxLQUFBLENBQUE7QUFDQSxPQUFBLFFBQUEsQ0FBQTtBQUNBLFFBQUEsQ0FBQSxRQUFBLEdBQUEsUUFBQSxDQUFBO0FBQ0EsT0FBQSxRQUFBLENBQUE7QUFDQSxRQUFBLENBQUEsUUFBQSxHQUFBLFFBQUEsQ0FBQTs7O0FBR0EsT0FBQSxFQUFBLENBQUE7OztBQUdBLE9BQUEsT0FBQSxHQUFBLElBQUEsS0FBQSxDQUFBLFlBQUEsRUFBQSxDQUFBO0FBQ0EsT0FBQSxPQUFBLEdBQUEsSUFBQSxLQUFBLENBQUEsVUFBQSxFQUFBLENBQUE7OztBQUdBLFFBQUEsQ0FBQSxNQUFBLENBQUEsb0JBQUEsRUFBQSxVQUFBLFFBQUEsRUFBQSxRQUFBLEVBQUE7QUFDQSxRQUFBLFFBQUEsSUFBQSxRQUFBLEVBQUE7QUFDQSxjQUFBLENBQUEsUUFBQSxDQUFBLENBQUE7S0FDQTtJQUNBLENBQUEsQ0FBQTs7O0FBR0EsWUFBQSxTQUFBLENBQUEsTUFBQSxFQUFBO0FBQ0EsV0FBQSxDQUFBLElBQUEsQ0FBQSxNQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUE7QUFDQSxXQUFBLENBQUEsS0FBQSxDQUFBLENBQUEsR0FBQSxNQUFBLENBQUEsS0FBQSxDQUFBLENBQUEsR0FBQSxNQUFBLENBQUEsS0FBQSxDQUFBLENBQUEsR0FBQSxJQUFBLEdBQUEseUJBQUEsQ0FBQTtBQUNBLFdBQUEsQ0FBQSxRQUFBLENBQUEsQ0FBQSxHQUFBLEVBQUEsQ0FBQTtBQUNBLFdBQUEsQ0FBQSxZQUFBLEVBQUEsQ0FBQTtBQUNBLFNBQUEsUUFBQSxFQUFBLEtBQUEsQ0FBQSxNQUFBLENBQUEsUUFBQSxDQUFBLENBQUE7QUFDQSxVQUFBLENBQUEsR0FBQSxDQUFBLE1BQUEsQ0FBQSxDQUFBOztBQUVBLGFBQUEsR0FBQSxNQUFBLENBQUE7S0FDQSxDQUFBLENBQUE7SUFDQTs7O0FBR0EsWUFBQSxDQUFBLEtBQUEsQ0FBQSxLQUFBLENBQUEsWUFBQSxDQUFBLENBQUE7QUFDQSxVQUFBLEVBQUEsQ0FBQTs7O0FBR0EsWUFBQSxJQUFBLEdBQUE7OztBQUdBLFVBQUEsR0FBQSxJQUFBLEtBQUEsQ0FBQSxpQkFBQSxDQUFBLEVBQUEsRUFBQSxnQkFBQSxHQUFBLGlCQUFBLEVBQUEsQ0FBQSxFQUFBLElBQUEsQ0FBQSxDQUFBO0FBQ0EsVUFBQSxDQUFBLFFBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQSxFQUFBLENBQUEsRUFBQSxDQUFBLENBQUEsQ0FBQTs7O0FBR0EsU0FBQSxHQUFBLElBQUEsS0FBQSxDQUFBLEtBQUEsRUFBQSxDQUFBOzs7O0FBSUEsU0FBQSxDQUFBLEdBQUEsQ0FBQSxJQUFBLEtBQUEsQ0FBQSxZQUFBLENBQUEsUUFBQSxDQUFBLENBQUEsQ0FBQTs7QUFFQSxRQUFBLGdCQUFBLEdBQUEsSUFBQSxLQUFBLENBQUEsZ0JBQUEsQ0FBQSxRQUFBLENBQUEsQ0FBQTtBQUNBLG9CQUFBLENBQUEsUUFBQSxDQUFBLENBQUEsR0FBQSxJQUFBLENBQUEsTUFBQSxFQUFBLEdBQUEsR0FBQSxDQUFBO0FBQ0Esb0JBQUEsQ0FBQSxRQUFBLENBQUEsQ0FBQSxHQUFBLElBQUEsQ0FBQSxNQUFBLEVBQUEsR0FBQSxHQUFBLENBQUE7QUFDQSxvQkFBQSxDQUFBLFFBQUEsQ0FBQSxDQUFBLEdBQUEsSUFBQSxDQUFBLE1BQUEsRUFBQSxHQUFBLEdBQUEsQ0FBQTtBQUNBLG9CQUFBLENBQUEsUUFBQSxDQUFBLFNBQUEsRUFBQSxDQUFBO0FBQ0EsU0FBQSxDQUFBLEdBQUEsQ0FBQSxnQkFBQSxDQUFBLENBQUE7OztBQUdBLFlBQUEsR0FBQSxJQUFBLEtBQUEsQ0FBQSxhQUFBLENBQUEsRUFBQSxTQUFBLEVBQUEsSUFBQSxFQUFBLENBQUEsQ0FBQTtBQUNBLFlBQUEsQ0FBQSxPQUFBLENBQUEsZ0JBQUEsRUFBQSxpQkFBQSxDQUFBLENBQUE7QUFDQSxZQUFBLENBQUEsYUFBQSxDQUFBLFFBQUEsQ0FBQSxDQUFBO0FBQ0EsV0FBQSxDQUFBLENBQUEsQ0FBQSxDQUFBLFdBQUEsQ0FBQSxRQUFBLENBQUEsVUFBQSxDQUFBLENBQUE7OztBQUdBLFVBQUEsQ0FBQSxnQkFBQSxDQUFBLFFBQUEsRUFBQSxjQUFBLEVBQUEsS0FBQSxDQUFBLENBQUE7OztJQUdBOzs7QUFHQSxZQUFBLGNBQUEsQ0FBQSxLQUFBLEVBQUE7QUFDQSxZQUFBLENBQUEsT0FBQSxDQUFBLEtBQUEsQ0FBQSxXQUFBLENBQUEsS0FBQSxFQUFBLEVBQUEsaUJBQUEsQ0FBQSxDQUFBO0FBQ0EsVUFBQSxDQUFBLE1BQUEsR0FBQSxLQUFBLENBQUEsV0FBQSxDQUFBLEtBQUEsRUFBQSxHQUFBLGlCQUFBLENBQUE7QUFDQSxVQUFBLENBQUEsc0JBQUEsRUFBQSxDQUFBO0lBQ0E7OztBQUdBLE9BQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQTtBQUNBLFlBQUEsT0FBQSxHQUFBO0FBQ0EsVUFBQSxFQUFBLENBQUE7QUFDQSx5QkFBQSxDQUFBLE9BQUEsQ0FBQSxDQUFBO0lBQ0E7OztBQUdBLFlBQUEsTUFBQSxHQUFBO0FBQ0EsUUFBQSxLQUFBLEdBQUEsSUFBQSxDQUFBLEdBQUEsRUFBQSxHQUFBLE9BQUEsQ0FBQTtBQUNBLFVBQUEsQ0FBQSxRQUFBLENBQUEsQ0FBQSxHQUFBLElBQUEsQ0FBQSxHQUFBLENBQUEsS0FBQSxDQUFBLEdBQUEsRUFBQSxDQUFBO0FBQ0EsVUFBQSxDQUFBLFFBQUEsQ0FBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBO0FBQ0EsVUFBQSxDQUFBLFFBQUEsQ0FBQSxDQUFBLEdBQUEsSUFBQSxDQUFBLEdBQUEsQ0FBQSxLQUFBLENBQUEsR0FBQSxHQUFBLENBQUE7QUFDQSxVQUFBLENBQUEsTUFBQSxDQUFBLEtBQUEsQ0FBQSxRQUFBLENBQUEsQ0FBQTtBQUNBLFlBQUEsQ0FBQSxNQUFBLENBQUEsS0FBQSxFQUFBLE1BQUEsQ0FBQSxDQUFBO0lBQ0E7R0FDQTtFQUNBLENBQUE7Q0FDQSxDQUFBLENBQUEiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcbnZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZSgnRnVsbHN0YWNrR2VuZXJhdGVkQXBwJywgWyd1aS5yb3V0ZXInLCAnZnNhUHJlQnVpbHQnXSk7XG5cbmFwcC5jb25maWcoZnVuY3Rpb24gKCR1cmxSb3V0ZXJQcm92aWRlciwgJGxvY2F0aW9uUHJvdmlkZXIpIHtcbiAgICAvLyBUaGlzIHR1cm5zIG9mZiBoYXNoYmFuZyB1cmxzICgvI2Fib3V0KSBhbmQgY2hhbmdlcyBpdCB0byBzb21ldGhpbmcgbm9ybWFsICgvYWJvdXQpXG4gICAgJGxvY2F0aW9uUHJvdmlkZXIuaHRtbDVNb2RlKHRydWUpO1xuICAgIC8vIElmIHdlIGdvIHRvIGEgVVJMIHRoYXQgdWktcm91dGVyIGRvZXNuJ3QgaGF2ZSByZWdpc3RlcmVkLCBnbyB0byB0aGUgXCIvXCIgdXJsLlxuICAgICR1cmxSb3V0ZXJQcm92aWRlci5vdGhlcndpc2UoJy8nKTtcbiAgICAkdXJsUm91dGVyUHJvdmlkZXIud2hlbignL2F1dGgvOnByb3ZpZGVyJywgZnVuY3Rpb24gKCkge1xuICAgIFx0d2luZG93LmxvY2F0aW9uLnJlbG9hZCgpO1xuXHR9KTtcblxufSk7XG5cbi8vIFRoaXMgYXBwLnJ1biBpcyBmb3IgY29udHJvbGxpbmcgYWNjZXNzIHRvIHNwZWNpZmljIHN0YXRlcy5cbmFwcC5ydW4oZnVuY3Rpb24gKCRyb290U2NvcGUsIEF1dGhTZXJ2aWNlLCAkc3RhdGUpIHtcblxuICAgIC8vIFRoZSBnaXZlbiBzdGF0ZSByZXF1aXJlcyBhbiBhdXRoZW50aWNhdGVkIHVzZXIuXG4gICAgdmFyIGRlc3RpbmF0aW9uU3RhdGVSZXF1aXJlc0F1dGggPSBmdW5jdGlvbiAoc3RhdGUpIHtcbiAgICAgICAgcmV0dXJuIHN0YXRlLmRhdGEgJiYgc3RhdGUuZGF0YS5hdXRoZW50aWNhdGU7XG4gICAgfTtcblxuICAgIC8vICRzdGF0ZUNoYW5nZVN0YXJ0IGlzIGFuIGV2ZW50IGZpcmVkXG4gICAgLy8gd2hlbmV2ZXIgdGhlIHByb2Nlc3Mgb2YgY2hhbmdpbmcgYSBzdGF0ZSBiZWdpbnMuXG4gICAgJHJvb3RTY29wZS4kb24oJyRzdGF0ZUNoYW5nZVN0YXJ0JywgZnVuY3Rpb24gKGV2ZW50LCB0b1N0YXRlKSB7XG5cbiAgICAgICAgaWYgKCFkZXN0aW5hdGlvblN0YXRlUmVxdWlyZXNBdXRoKHRvU3RhdGUpKSB7XG4gICAgICAgICAgICAvLyBUaGUgZGVzdGluYXRpb24gc3RhdGUgZG9lcyBub3QgcmVxdWlyZSBhdXRoZW50aWNhdGlvblxuICAgICAgICAgICAgLy8gU2hvcnQgY2lyY3VpdCB3aXRoIHJldHVybi5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChBdXRoU2VydmljZS5pc0F1dGhlbnRpY2F0ZWQoKSkge1xuICAgICAgICAgICAgLy8gVGhlIHVzZXIgaXMgYXV0aGVudGljYXRlZC5cbiAgICAgICAgICAgIC8vIFNob3J0IGNpcmN1aXQgd2l0aCByZXR1cm4uXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDYW5jZWwgbmF2aWdhdGluZyB0byBuZXcgc3RhdGUuXG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgQXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgICAgICAgLy8gSWYgYSB1c2VyIGlzIHJldHJpZXZlZCwgdGhlbiByZW5hdmlnYXRlIHRvIHRoZSBkZXN0aW5hdGlvblxuICAgICAgICAgICAgLy8gKHRoZSBzZWNvbmQgdGltZSwgQXV0aFNlcnZpY2UuaXNBdXRoZW50aWNhdGVkKCkgd2lsbCB3b3JrKVxuICAgICAgICAgICAgLy8gb3RoZXJ3aXNlLCBpZiBubyB1c2VyIGlzIGxvZ2dlZCBpbiwgZ28gdG8gXCJsb2dpblwiIHN0YXRlLlxuICAgICAgICAgICAgdmFyIGRlc3RpbmF0aW9uID0gdXNlciA/IHRvU3RhdGUubmFtZSA6ICdsb2dpbic7XG4gICAgICAgICAgICAkc3RhdGUuZ28oZGVzdGluYXRpb24pO1xuICAgICAgICB9KTtcblxuICAgIH0pO1xuXG59KTsiLCIoZnVuY3Rpb24gKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgLy8gSG9wZSB5b3UgZGlkbid0IGZvcmdldCBBbmd1bGFyISBEdWgtZG95LlxuICAgIGlmICghd2luZG93LmFuZ3VsYXIpIHRocm93IG5ldyBFcnJvcignSSBjYW5cXCd0IGZpbmQgQW5ndWxhciEnKTtcblxuICAgIHZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZSgnZnNhUHJlQnVpbHQnLCBbXSk7XG5cbiAgICBhcHAuZmFjdG9yeSgnU29ja2V0JywgZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoIXdpbmRvdy5pbykgdGhyb3cgbmV3IEVycm9yKCdzb2NrZXQuaW8gbm90IGZvdW5kIScpO1xuICAgICAgICByZXR1cm4gd2luZG93LmlvKHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4pO1xuICAgIH0pO1xuXG4gICAgLy8gQVVUSF9FVkVOVFMgaXMgdXNlZCB0aHJvdWdob3V0IG91ciBhcHAgdG9cbiAgICAvLyBicm9hZGNhc3QgYW5kIGxpc3RlbiBmcm9tIGFuZCB0byB0aGUgJHJvb3RTY29wZVxuICAgIC8vIGZvciBpbXBvcnRhbnQgZXZlbnRzIGFib3V0IGF1dGhlbnRpY2F0aW9uIGZsb3cuXG4gICAgYXBwLmNvbnN0YW50KCdBVVRIX0VWRU5UUycsIHtcbiAgICAgICAgbG9naW5TdWNjZXNzOiAnYXV0aC1sb2dpbi1zdWNjZXNzJyxcbiAgICAgICAgbG9naW5GYWlsZWQ6ICdhdXRoLWxvZ2luLWZhaWxlZCcsXG4gICAgICAgIGxvZ291dFN1Y2Nlc3M6ICdhdXRoLWxvZ291dC1zdWNjZXNzJyxcbiAgICAgICAgc2Vzc2lvblRpbWVvdXQ6ICdhdXRoLXNlc3Npb24tdGltZW91dCcsXG4gICAgICAgIG5vdEF1dGhlbnRpY2F0ZWQ6ICdhdXRoLW5vdC1hdXRoZW50aWNhdGVkJyxcbiAgICAgICAgbm90QXV0aG9yaXplZDogJ2F1dGgtbm90LWF1dGhvcml6ZWQnXG4gICAgfSk7XG5cbiAgICBhcHAuZmFjdG9yeSgnQXV0aEludGVyY2VwdG9yJywgZnVuY3Rpb24gKCRyb290U2NvcGUsICRxLCBBVVRIX0VWRU5UUykge1xuICAgICAgICB2YXIgc3RhdHVzRGljdCA9IHtcbiAgICAgICAgICAgIDQwMTogQVVUSF9FVkVOVFMubm90QXV0aGVudGljYXRlZCxcbiAgICAgICAgICAgIDQwMzogQVVUSF9FVkVOVFMubm90QXV0aG9yaXplZCxcbiAgICAgICAgICAgIDQxOTogQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXQsXG4gICAgICAgICAgICA0NDA6IEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXNwb25zZUVycm9yOiBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3Qoc3RhdHVzRGljdFtyZXNwb25zZS5zdGF0dXNdLCByZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRxLnJlamVjdChyZXNwb25zZSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9KTtcblxuICAgIGFwcC5jb25maWcoZnVuY3Rpb24gKCRodHRwUHJvdmlkZXIpIHtcbiAgICAgICAgJGh0dHBQcm92aWRlci5pbnRlcmNlcHRvcnMucHVzaChbXG4gICAgICAgICAgICAnJGluamVjdG9yJyxcbiAgICAgICAgICAgIGZ1bmN0aW9uICgkaW5qZWN0b3IpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJGluamVjdG9yLmdldCgnQXV0aEludGVyY2VwdG9yJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIF0pO1xuICAgIH0pO1xuXG4gICAgYXBwLnNlcnZpY2UoJ0F1dGhTZXJ2aWNlJywgZnVuY3Rpb24gKCRodHRwLCBTZXNzaW9uLCAkcm9vdFNjb3BlLCBBVVRIX0VWRU5UUywgJHEpIHtcblxuICAgICAgICBmdW5jdGlvbiBvblN1Y2Nlc3NmdWxMb2dpbihyZXNwb25zZSkge1xuICAgICAgICAgICAgdmFyIGRhdGEgPSByZXNwb25zZS5kYXRhO1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJsb2dnZWQgaW5cIilcbiAgICAgICAgICAgIFNlc3Npb24uY3JlYXRlKGRhdGEuaWQsIGRhdGEudXNlcik7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoQVVUSF9FVkVOVFMubG9naW5TdWNjZXNzKTtcbiAgICAgICAgICAgIHJldHVybiBkYXRhLnVzZXI7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBVc2VzIHRoZSBzZXNzaW9uIGZhY3RvcnkgdG8gc2VlIGlmIGFuXG4gICAgICAgIC8vIGF1dGhlbnRpY2F0ZWQgdXNlciBpcyBjdXJyZW50bHkgcmVnaXN0ZXJlZC5cbiAgICAgICAgdGhpcy5pc0F1dGhlbnRpY2F0ZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gISFTZXNzaW9uLnVzZXI7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5nZXRMb2dnZWRJblVzZXIgPSBmdW5jdGlvbiAoZnJvbVNlcnZlcikge1xuXG4gICAgICAgICAgICAvLyBJZiBhbiBhdXRoZW50aWNhdGVkIHNlc3Npb24gZXhpc3RzLCB3ZVxuICAgICAgICAgICAgLy8gcmV0dXJuIHRoZSB1c2VyIGF0dGFjaGVkIHRvIHRoYXQgc2Vzc2lvblxuICAgICAgICAgICAgLy8gd2l0aCBhIHByb21pc2UuIFRoaXMgZW5zdXJlcyB0aGF0IHdlIGNhblxuICAgICAgICAgICAgLy8gYWx3YXlzIGludGVyZmFjZSB3aXRoIHRoaXMgbWV0aG9kIGFzeW5jaHJvbm91c2x5LlxuXG4gICAgICAgICAgICAvLyBPcHRpb25hbGx5LCBpZiB0cnVlIGlzIGdpdmVuIGFzIHRoZSBmcm9tU2VydmVyIHBhcmFtZXRlcixcbiAgICAgICAgICAgIC8vIHRoZW4gdGhpcyBjYWNoZWQgdmFsdWUgd2lsbCBub3QgYmUgdXNlZC5cblxuICAgICAgICAgICAgaWYgKHRoaXMuaXNBdXRoZW50aWNhdGVkKCkgJiYgZnJvbVNlcnZlciAhPT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAkcS53aGVuKFNlc3Npb24udXNlcik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIE1ha2UgcmVxdWVzdCBHRVQgL3Nlc3Npb24uXG4gICAgICAgICAgICAvLyBJZiBpdCByZXR1cm5zIGEgdXNlciwgY2FsbCBvblN1Y2Nlc3NmdWxMb2dpbiB3aXRoIHRoZSByZXNwb25zZS5cbiAgICAgICAgICAgIC8vIElmIGl0IHJldHVybnMgYSA0MDEgcmVzcG9uc2UsIHdlIGNhdGNoIGl0IGFuZCBpbnN0ZWFkIHJlc29sdmUgdG8gbnVsbC5cbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9zZXNzaW9uJykudGhlbihvblN1Y2Nlc3NmdWxMb2dpbikuY2F0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmxvZ2luID0gZnVuY3Rpb24gKGNyZWRlbnRpYWxzKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAucG9zdCgnL2xvZ2luJywgY3JlZGVudGlhbHMpXG4gICAgICAgICAgICAgICAgLnRoZW4ob25TdWNjZXNzZnVsTG9naW4pXG4gICAgICAgICAgICAgICAgLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICRxLnJlamVjdCh7IG1lc3NhZ2U6ICdJbnZhbGlkIGxvZ2luIGNyZWRlbnRpYWxzLicgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5sb2dvdXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvbG9nb3V0JykudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgU2Vzc2lvbi5kZXN0cm95KCk7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KEFVVEhfRVZFTlRTLmxvZ291dFN1Y2Nlc3MpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICB9KTtcblxuICAgIGFwcC5zZXJ2aWNlKCdTZXNzaW9uJywgZnVuY3Rpb24gKCRyb290U2NvcGUsIEFVVEhfRVZFTlRTKSB7XG5cbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLm5vdEF1dGhlbnRpY2F0ZWQsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHNlbGYuZGVzdHJveSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc2VsZi5kZXN0cm95KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuaWQgPSBudWxsO1xuICAgICAgICB0aGlzLnVzZXIgPSBudWxsO1xuXG4gICAgICAgIHRoaXMuY3JlYXRlID0gZnVuY3Rpb24gKHNlc3Npb25JZCwgdXNlcikge1xuICAgICAgICAgICAgdGhpcy5pZCA9IHNlc3Npb25JZDtcbiAgICAgICAgICAgIHRoaXMudXNlciA9IHVzZXI7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5pZCA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLnVzZXIgPSBudWxsO1xuICAgICAgICB9O1xuXG4gICAgfSk7XG5cbn0pKCk7XG4iLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2xvZ2luJywge1xuICAgICAgICB1cmw6ICcvbG9naW4nLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2xvZ2luL2xvZ2luLmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnTG9naW5DdHJsJ1xuICAgIH0pO1xuXG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ0xvZ2luQ3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsIEF1dGhTZXJ2aWNlLCAkc3RhdGUpIHtcblxuICAgICRzY29wZS5sb2dpbiA9IHt9O1xuICAgICRzY29wZS5lcnJvciA9IG51bGw7XG5cbiAgICAkc2NvcGUuc2VuZExvZ2luID0gZnVuY3Rpb24gKGxvZ2luSW5mbykge1xuICAgICAgICBjb25zb2xlLmxvZyhcImhpdCBjb250cm9sbGVyXCIpXG4gICAgICAgICRzY29wZS5lcnJvciA9IG51bGw7XG5cbiAgICAgICAgQXV0aFNlcnZpY2UubG9naW4obG9naW5JbmZvKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzdGF0ZS5nbygnaG9tZScpO1xuICAgICAgICB9KS5jYXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUuZXJyb3IgPSAnSW52YWxpZCBsb2dpbiBjcmVkZW50aWFscy4nO1xuICAgICAgICB9KTtcblxuICAgIH07XG5cbn0pOyIsIid1c2Ugc3RyaWN0JztcblxuYXBwLmNvbnRyb2xsZXIoJ01hbmFnZXJDb250cm9sbGVyJywgZnVuY3Rpb24oJHNjb3BlLCAkdGltZW91dCl7XG5cblx0Ly8gTmF2YmFyXG5cdCRzY29wZS5uYXZiYXJFeHBhbmQgPSBmYWxzZTtcblx0XG5cdC8vIENvbGxlY3Rpb24gUGFuZWxcblx0JHNjb3BlLmNvbGxlY3Rpb25PcGVuID0gZmFsc2U7XG5cdCRzY29wZS5jb2xsZWN0aW9uVG9nZ2xlID0gZnVuY3Rpb24oKXtcblx0XHRpZiAoISRzY29wZS5jb2xsZWN0aW9uT3BlbikgJHNjb3BlLmNvbGxlY3Rpb25PcGVuID0gdHJ1ZTtcblx0XHRlbHNlIHtcblx0XHRcdCRzY29wZS5jb2xsZWN0aW9uT3BlbiA9IGZhbHNlO1xuXHRcdH1cblx0fVxuXG5cdC8vQ29sbGFwc2UgQWxsXG5cdCRzY29wZS5jb2xsYXBzZVRvcCA9IGZ1bmN0aW9uKCl7XG5cdFx0JHNjb3BlLmNvbGxlY3Rpb25PcGVuID0gZmFsc2U7XG5cdFx0JHRpbWVvdXQoZnVuY3Rpb24oKXtcblx0XHRcdCRzY29wZS5uYXZiYXJFeHBhbmQgPSBmYWxzZTtcblx0XHR9LCAyMDApO1xuXHR9XG5cblx0Ly8gQWN0dWFsIGNvbGxlY3Rpb25cblx0JHNjb3BlLmNvbGxlY3Rpb24gPSBbXVxuXG59KTsiLCIndXNlIHN0cmljdCc7XG5cbmFwcC5mYWN0b3J5KCdNb2RlbCcsIGZ1bmN0aW9uKCRodHRwKXtcblxuXHQvLyBDdXJyZW50bHkgUmVuZGVyZWQgT2JqZWN0XG5cdHZhciByZW5kZXJPYmogPSB7XG5cdFx0bW9kZWxGaWxlVXJsOiAnbW9kZWxzL3VudGl0bGVkLXNjZW5lL3VudGl0bGVkLXNjZW5lLmpzb24nLFxuXHRcdGNyZWF0b3I6ICdNYXJ5IEFubmUnXG5cdH07XG5cblxuXHQvLyBNb2RlbCBDb25zdHJ1Y3RvclxuXHRmdW5jdGlvbiBNb2RlbCAocHJvcHMpIHtcblx0XHRhbmd1bGFyLmV4dGVuZCh0aGlzLCBwcm9wcyk7XG5cdH07XG5cblx0TW9kZWwudXJsID0gJ2FwaS9wcm9kdWN0J1xuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoTW9kZWwucHJvdG90eXBlLCAndXJsJywge1xuXHRcdGdldDogZnVuY3Rpb24gKCkge1xuXHRcdFx0cmV0dXJuIE1vZGVsLnVybCArIHRoaXMuX2lkO1xuXHRcdH1cblx0fSk7XG5cblxuXHQvLyBMaXN0aW5nIEZ1bmN0aW9uYWxpdHlcblx0TW9kZWwucHJvdG90eXBlLmZldGNoID0gZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gJGh0dHAuZ2V0KHRoaXMudXJsKS50aGVuKGZ1bmN0aW9uIChyZXMpIHtcblx0XHRcdHJldHVybiBuZXcgTW9kZWwocmVzLmRhdGEpO1xuXHRcdH0pO1xuXHR9XG5cblx0TW9kZWwuZmV0Y2hBbGwgPSBmdW5jdGlvbigpe1xuXHRcdC8vIHJldHVybiAkaHRwcC5nZXQoTW9kZWwudXJsKS50aGVuKGZ1bmN0aW9uIChkYXRhKSB7XG5cdFx0Ly8gXHRyZXR1cm4gcmVzLmRhdGEubWFwKGZ1bmN0aW9uIChvYmopIHtcblx0XHQvLyBcdFx0cmV0dXJuIG5ldyBNb2RlbChvYmopO1xuXHRcdC8vIFx0fSk7XG5cdFx0Ly8gfSk7XG5cdFx0Y29uc29sZS5sb2coKTtcblx0XHRyZXR1cm4gW1xuXHRcdHtcblx0XHRcdF9pZDogMTI0MjQsXG5cdFx0XHR0aXRsZTogJ0Zsb2F0aW5nIElzbGFuZCcsXG5cdFx0XHRzbmFwc2hvdEZpbGVVcmw6ICcvaW1hZ2VzL3NuYXBzaG90cy9mbG9hdGluZ0lzbGFuZC5wbmcnLFxuXHRcdFx0bW9kZWxGaWxlVXJsOiAnbW9kZWxzL3VudGl0bGVkLXNjZW5lL3VudGl0bGVkLXNjZW5lLmpzb24nLFxuXHRcdFx0Y3JlYXRvcjogJ01hcnkgQW5uZScsXG5cdFx0XHR0YWdzOiBbJ0Vudmlyb25tZW50JywnTG93LVBvbHknXVxuXHRcdH0sIFxuXHRcdHtcblx0XHRcdF9pZDogMTIzNjIsXG5cdFx0XHR0aXRsZTogJ0JheW1heCcsXG5cdFx0XHRzbmFwc2hvdEZpbGVVcmw6ICcvaW1hZ2VzL3NuYXBzaG90cy9iYXltYXgucG5nJyxcblx0XHRcdG1vZGVsRmlsZVVybDogJ21vZGVscy9iYXltYXguanNvbicsXG5cdFx0XHRjcmVhdG9yOiAnTWlsdG9uIEdsYXNlcicsXG5cdFx0XHR0YWdzOiBbJ0NoYXJhY3RlcicsJ0Z1dHVyaXN0aWMnXVxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0X2lkOiAxMjQyNCxcblx0XHRcdHRpdGxlOiAnRmxvYXRpbmcgSXNsYW5kJyxcblx0XHRcdHNuYXBzaG90RmlsZVVybDogJy9pbWFnZXMvc25hcHNob3RzL2Zsb2F0aW5nSXNsYW5kLnBuZycsXG5cdFx0XHRtb2RlbEZpbGVVcmw6ICdtb2RlbHMvdW50aXRsZWQtc2NlbmUvdW50aXRsZWQtc2NlbmUuanNvbicsXG5cdFx0XHRjcmVhdG9yOiAnTWFyeSBBbm5lJyxcblx0XHRcdHRhZ3M6IFsnRW52aXJvbm1lbnQnLCdMb3ctUG9seSddXG5cdFx0fSwgXG5cdFx0e1xuXHRcdFx0X2lkOiAxMjM2Mixcblx0XHRcdHRpdGxlOiAnQmF5bWF4Jyxcblx0XHRcdHNuYXBzaG90RmlsZVVybDogJy9pbWFnZXMvc25hcHNob3RzL2JheW1heC5wbmcnLFxuXHRcdFx0bW9kZWxGaWxlVXJsOiAnbW9kZWxzL2JheW1heC5qc29uJyxcblx0XHRcdGNyZWF0b3I6ICdNaWx0b24gR2xhc2VyJyxcblx0XHRcdHRhZ3M6IFsnQ2hhcmFjdGVyJywnRnV0dXJpc3RpYyddXG5cdFx0fSxcblx0XHR7XG5cdFx0XHRfaWQ6IDEyNDI0LFxuXHRcdFx0dGl0bGU6ICdGbG9hdGluZyBJc2xhbmQnLFxuXHRcdFx0c25hcHNob3RGaWxlVXJsOiAnL2ltYWdlcy9zbmFwc2hvdHMvZmxvYXRpbmdJc2xhbmQucG5nJyxcblx0XHRcdG1vZGVsRmlsZVVybDogJ21vZGVscy91bnRpdGxlZC1zY2VuZS91bnRpdGxlZC1zY2VuZS5qc29uJyxcblx0XHRcdGNyZWF0b3I6ICdNYXJ5IEFubmUnLFxuXHRcdFx0dGFnczogWydFbnZpcm9ubWVudCcsJ0xvdy1Qb2x5J11cblx0XHR9LCBcblx0XHR7XG5cdFx0XHRfaWQ6IDEyMzYyLFxuXHRcdFx0dGl0bGU6ICdCYXltYXgnLFxuXHRcdFx0c25hcHNob3RGaWxlVXJsOiAnL2ltYWdlcy9zbmFwc2hvdHMvYmF5bWF4LnBuZycsXG5cdFx0XHRtb2RlbEZpbGVVcmw6ICdtb2RlbHMvYmF5bWF4Lmpzb24nLFxuXHRcdFx0Y3JlYXRvcjogJ01pbHRvbiBHbGFzZXInLFxuXHRcdFx0dGFnczogWydDaGFyYWN0ZXInLCdGdXR1cmlzdGljJ11cblx0XHR9LCBcblx0XHR7XG5cdFx0XHRfaWQ6IDEyMzYyLFxuXHRcdFx0dGl0bGU6ICdCYXltYXgnLFxuXHRcdFx0c25hcHNob3RGaWxlVXJsOiAnL2ltYWdlcy9zbmFwc2hvdHMvYmF5bWF4LnBuZycsXG5cdFx0XHRtb2RlbEZpbGVVcmw6ICdtb2RlbHMvYmF5bWF4Lmpzb24nLFxuXHRcdFx0Y3JlYXRvcjogJ01pbHRvbiBHbGFzZXInLFxuXHRcdFx0dGFnczogWydDaGFyYWN0ZXInLCdGdXR1cmlzdGljJ11cblx0XHR9LFxuXHRcdHtcblx0XHRcdF9pZDogMTI0MjQsXG5cdFx0XHR0aXRsZTogJ0Zsb2F0aW5nIElzbGFuZCcsXG5cdFx0XHRzbmFwc2hvdEZpbGVVcmw6ICcvaW1hZ2VzL3NuYXBzaG90cy9mbG9hdGluZ0lzbGFuZC5wbmcnLFxuXHRcdFx0bW9kZWxGaWxlVXJsOiAnbW9kZWxzL3VudGl0bGVkLXNjZW5lL3VudGl0bGVkLXNjZW5lLmpzb24nLFxuXHRcdFx0Y3JlYXRvcjogJ01hcnkgQW5uZScsXG5cdFx0XHR0YWdzOiBbJ0Vudmlyb25tZW50JywnTG93LVBvbHknXVxuXHRcdH0sIFxuXHRcdHtcblx0XHRcdF9pZDogMTIzNjIsXG5cdFx0XHR0aXRsZTogJ0JheW1heCcsXG5cdFx0XHRzbmFwc2hvdEZpbGVVcmw6ICcvaW1hZ2VzL3NuYXBzaG90cy9iYXltYXgucG5nJyxcblx0XHRcdG1vZGVsRmlsZVVybDogJ21vZGVscy9iYXltYXguanNvbicsXG5cdFx0XHRjcmVhdG9yOiAnTWlsdG9uIEdsYXNlcicsXG5cdFx0XHR0YWdzOiBbJ0NoYXJhY3RlcicsJ0Z1dHVyaXN0aWMnXVxuXHRcdH0sIFxuXHRcdHtcblx0XHRcdF9pZDogMTIzNjIsXG5cdFx0XHR0aXRsZTogJ0JheW1heCcsXG5cdFx0XHRzbmFwc2hvdEZpbGVVcmw6ICcvaW1hZ2VzL3NuYXBzaG90cy9iYXltYXgucG5nJyxcblx0XHRcdG1vZGVsRmlsZVVybDogJ21vZGVscy9iYXltYXguanNvbicsXG5cdFx0XHRjcmVhdG9yOiAnTWlsdG9uIEdsYXNlcicsXG5cdFx0XHR0YWdzOiBbJ0NoYXJhY3RlcicsJ0Z1dHVyaXN0aWMnXVxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0X2lkOiAxMjM2Mixcblx0XHRcdHRpdGxlOiAnQmF5bWF4Jyxcblx0XHRcdHNuYXBzaG90RmlsZVVybDogJy9pbWFnZXMvc25hcHNob3RzL2JheW1heC5wbmcnLFxuXHRcdFx0bW9kZWxGaWxlVXJsOiAnbW9kZWxzL2JheW1heC5qc29uJyxcblx0XHRcdGNyZWF0b3I6ICdNaWx0b24gR2xhc2VyJyxcblx0XHRcdHRhZ3M6IFsnQ2hhcmFjdGVyJywnRnV0dXJpc3RpYyddXG5cdFx0fSxcblx0XHR7XG5cdFx0XHRfaWQ6IDEyNDI0LFxuXHRcdFx0dGl0bGU6ICdGbG9hdGluZyBJc2xhbmQnLFxuXHRcdFx0c25hcHNob3RGaWxlVXJsOiAnL2ltYWdlcy9zbmFwc2hvdHMvZmxvYXRpbmdJc2xhbmQucG5nJyxcblx0XHRcdG1vZGVsRmlsZVVybDogJ21vZGVscy91bnRpdGxlZC1zY2VuZS91bnRpdGxlZC1zY2VuZS5qc29uJyxcblx0XHRcdGNyZWF0b3I6ICdNYXJ5IEFubmUnLFxuXHRcdFx0dGFnczogWydFbnZpcm9ubWVudCcsJ0xvdy1Qb2x5J11cblx0XHR9LCBcblx0XHR7XG5cdFx0XHRfaWQ6IDEyMzYyLFxuXHRcdFx0dGl0bGU6ICdCYXltYXgnLFxuXHRcdFx0c25hcHNob3RGaWxlVXJsOiAnL2ltYWdlcy9zbmFwc2hvdHMvYmF5bWF4LnBuZycsXG5cdFx0XHRtb2RlbEZpbGVVcmw6ICdtb2RlbHMvYmF5bWF4Lmpzb24nLFxuXHRcdFx0Y3JlYXRvcjogJ01pbHRvbiBHbGFzZXInLFxuXHRcdFx0dGFnczogWydDaGFyYWN0ZXInLCdGdXR1cmlzdGljJ11cblx0XHR9LFxuXHRcdHtcblx0XHRcdF9pZDogMTI0MjQsXG5cdFx0XHR0aXRsZTogJ0Zsb2F0aW5nIElzbGFuZCcsXG5cdFx0XHRzbmFwc2hvdEZpbGVVcmw6ICcvaW1hZ2VzL3NuYXBzaG90cy9mbG9hdGluZ0lzbGFuZC5wbmcnLFxuXHRcdFx0bW9kZWxGaWxlVXJsOiAnbW9kZWxzL3VudGl0bGVkLXNjZW5lL3VudGl0bGVkLXNjZW5lLmpzb24nLFxuXHRcdFx0Y3JlYXRvcjogJ01hcnkgQW5uZScsXG5cdFx0XHR0YWdzOiBbJ0Vudmlyb25tZW50JywnTG93LVBvbHknXVxuXHRcdH0sIFxuXHRcdHtcblx0XHRcdF9pZDogMTIzNjIsXG5cdFx0XHR0aXRsZTogJ0JheW1heCcsXG5cdFx0XHRzbmFwc2hvdEZpbGVVcmw6ICcvaW1hZ2VzL3NuYXBzaG90cy9iYXltYXgucG5nJyxcblx0XHRcdG1vZGVsRmlsZVVybDogJ21vZGVscy9iYXltYXguanNvbicsXG5cdFx0XHRjcmVhdG9yOiAnTWlsdG9uIEdsYXNlcicsXG5cdFx0XHR0YWdzOiBbJ0NoYXJhY3RlcicsJ0Z1dHVyaXN0aWMnXVxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0X2lkOiAxMjQyNCxcblx0XHRcdHRpdGxlOiAnRmxvYXRpbmcgSXNsYW5kJyxcblx0XHRcdHNuYXBzaG90RmlsZVVybDogJy9pbWFnZXMvc25hcHNob3RzL2Zsb2F0aW5nSXNsYW5kLnBuZycsXG5cdFx0XHRtb2RlbEZpbGVVcmw6ICdtb2RlbHMvdW50aXRsZWQtc2NlbmUvdW50aXRsZWQtc2NlbmUuanNvbicsXG5cdFx0XHRjcmVhdG9yOiAnTWFyeSBBbm5lJyxcblx0XHRcdHRhZ3M6IFsnRW52aXJvbm1lbnQnLCdMb3ctUG9seSddXG5cdFx0fSwgXG5cdFx0e1xuXHRcdFx0X2lkOiAxMjM2Mixcblx0XHRcdHRpdGxlOiAnQmF5bWF4Jyxcblx0XHRcdHNuYXBzaG90RmlsZVVybDogJy9pbWFnZXMvc25hcHNob3RzL2JheW1heC5wbmcnLFxuXHRcdFx0bW9kZWxGaWxlVXJsOiAnbW9kZWxzL2JheW1heC5qc29uJyxcblx0XHRcdGNyZWF0b3I6ICdNaWx0b24gR2xhc2VyJyxcblx0XHRcdHRhZ3M6IFsnQ2hhcmFjdGVyJywnRnV0dXJpc3RpYyddXG5cdFx0fSxcblx0XHR7XG5cdFx0XHRfaWQ6IDEyNDI0LFxuXHRcdFx0dGl0bGU6ICdGbG9hdGluZyBJc2xhbmQnLFxuXHRcdFx0c25hcHNob3RGaWxlVXJsOiAnL2ltYWdlcy9zbmFwc2hvdHMvZmxvYXRpbmdJc2xhbmQucG5nJyxcblx0XHRcdG1vZGVsRmlsZVVybDogJ21vZGVscy91bnRpdGxlZC1zY2VuZS91bnRpdGxlZC1zY2VuZS5qc29uJyxcblx0XHRcdGNyZWF0b3I6ICdNYXJ5IEFubmUnLFxuXHRcdFx0dGFnczogWydFbnZpcm9ubWVudCcsJ0xvdy1Qb2x5J11cblx0XHR9LCBcblx0XHR7XG5cdFx0XHRfaWQ6IDEyMzYyLFxuXHRcdFx0dGl0bGU6ICdCYXltYXgnLFxuXHRcdFx0c25hcHNob3RGaWxlVXJsOiAnL2ltYWdlcy9zbmFwc2hvdHMvYmF5bWF4LnBuZycsXG5cdFx0XHRtb2RlbEZpbGVVcmw6ICdtb2RlbHMvYmF5bWF4Lmpzb24nLFxuXHRcdFx0Y3JlYXRvcjogJ01pbHRvbiBHbGFzZXInLFxuXHRcdFx0dGFnczogWydDaGFyYWN0ZXInLCdGdXR1cmlzdGljJ11cblx0XHR9LCBcblx0XHR7XG5cdFx0XHRfaWQ6IDEyMzYyLFxuXHRcdFx0dGl0bGU6ICdCYXltYXgnLFxuXHRcdFx0c25hcHNob3RGaWxlVXJsOiAnL2ltYWdlcy9zbmFwc2hvdHMvYmF5bWF4LnBuZycsXG5cdFx0XHRtb2RlbEZpbGVVcmw6ICdtb2RlbHMvYmF5bWF4Lmpzb24nLFxuXHRcdFx0Y3JlYXRvcjogJ01pbHRvbiBHbGFzZXInLFxuXHRcdFx0dGFnczogWydDaGFyYWN0ZXInLCdGdXR1cmlzdGljJ11cblx0XHR9LFxuXHRcdHtcblx0XHRcdF9pZDogMTI0MjQsXG5cdFx0XHR0aXRsZTogJ0Zsb2F0aW5nIElzbGFuZCcsXG5cdFx0XHRzbmFwc2hvdEZpbGVVcmw6ICcvaW1hZ2VzL3NuYXBzaG90cy9mbG9hdGluZ0lzbGFuZC5wbmcnLFxuXHRcdFx0bW9kZWxGaWxlVXJsOiAnbW9kZWxzL3VudGl0bGVkLXNjZW5lL3VudGl0bGVkLXNjZW5lLmpzb24nLFxuXHRcdFx0Y3JlYXRvcjogJ01hcnkgQW5uZScsXG5cdFx0XHR0YWdzOiBbJ0Vudmlyb25tZW50JywnTG93LVBvbHknXVxuXHRcdH0sIFxuXHRcdHtcblx0XHRcdF9pZDogMTIzNjIsXG5cdFx0XHR0aXRsZTogJ0JheW1heCcsXG5cdFx0XHRzbmFwc2hvdEZpbGVVcmw6ICcvaW1hZ2VzL3NuYXBzaG90cy9iYXltYXgucG5nJyxcblx0XHRcdG1vZGVsRmlsZVVybDogJ21vZGVscy9iYXltYXguanNvbicsXG5cdFx0XHRjcmVhdG9yOiAnTWlsdG9uIEdsYXNlcicsXG5cdFx0XHR0YWdzOiBbJ0NoYXJhY3RlcicsJ0Z1dHVyaXN0aWMnXVxuXHRcdH0sIFxuXHRcdHtcblx0XHRcdF9pZDogMTIzNjIsXG5cdFx0XHR0aXRsZTogJ0JheW1heCcsXG5cdFx0XHRzbmFwc2hvdEZpbGVVcmw6ICcvaW1hZ2VzL3NuYXBzaG90cy9iYXltYXgucG5nJyxcblx0XHRcdG1vZGVsRmlsZVVybDogJ21vZGVscy9iYXltYXguanNvbicsXG5cdFx0XHRjcmVhdG9yOiAnTWlsdG9uIEdsYXNlcicsXG5cdFx0XHR0YWdzOiBbJ0NoYXJhY3RlcicsJ0Z1dHVyaXN0aWMnXVxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0X2lkOiAxMjM2Mixcblx0XHRcdHRpdGxlOiAnQmF5bWF4Jyxcblx0XHRcdHNuYXBzaG90RmlsZVVybDogJy9pbWFnZXMvc25hcHNob3RzL2JheW1heC5wbmcnLFxuXHRcdFx0bW9kZWxGaWxlVXJsOiAnbW9kZWxzL2JheW1heC5qc29uJyxcblx0XHRcdGNyZWF0b3I6ICdNaWx0b24gR2xhc2VyJyxcblx0XHRcdHRhZ3M6IFsnQ2hhcmFjdGVyJywnRnV0dXJpc3RpYyddXG5cdFx0fSxcblx0XHR7XG5cdFx0XHRfaWQ6IDEyNDI0LFxuXHRcdFx0dGl0bGU6ICdGbG9hdGluZyBJc2xhbmQnLFxuXHRcdFx0c25hcHNob3RGaWxlVXJsOiAnL2ltYWdlcy9zbmFwc2hvdHMvZmxvYXRpbmdJc2xhbmQucG5nJyxcblx0XHRcdG1vZGVsRmlsZVVybDogJ21vZGVscy91bnRpdGxlZC1zY2VuZS91bnRpdGxlZC1zY2VuZS5qc29uJyxcblx0XHRcdGNyZWF0b3I6ICdNYXJ5IEFubmUnLFxuXHRcdFx0dGFnczogWydFbnZpcm9ubWVudCcsJ0xvdy1Qb2x5J11cblx0XHR9LCBcblx0XHR7XG5cdFx0XHRfaWQ6IDEyMzYyLFxuXHRcdFx0dGl0bGU6ICdCYXltYXgnLFxuXHRcdFx0c25hcHNob3RGaWxlVXJsOiAnL2ltYWdlcy9zbmFwc2hvdHMvYmF5bWF4LnBuZycsXG5cdFx0XHRtb2RlbEZpbGVVcmw6ICdtb2RlbHMvYmF5bWF4Lmpzb24nLFxuXHRcdFx0Y3JlYXRvcjogJ01pbHRvbiBHbGFzZXInLFxuXHRcdFx0dGFnczogWydDaGFyYWN0ZXInLCdGdXR1cmlzdGljJ11cblx0XHR9XTtcblxuXHR9XG5cblxuXHQvLyBSZW5kZXJlciBGdW5jdGlvbmFsaXR5XG5cdE1vZGVsLmNoYW5nZU1vZGVsVXJsID0gZnVuY3Rpb24gKG5ld1VybCkge1xuXHRcdHJlbmRlck9iai5tb2RlbEZpbGVVcmwgPSBuZXdVcmw7XG5cdFx0cmV0dXJuIHJlbmRlck9iajtcblx0fTtcblx0TW9kZWwuY2hhbmdlTW9kZWwgPSBmdW5jdGlvbiAoKSB7XG5cdFx0Ly8gVGVtcCBhdHRyaWJ1dGVzIGZvciB0ZXN0aW5nXG5cdFx0cmVuZGVyT2JqID0ge1xuXHRcdFx0bW9kZWxGaWxlVXJsOiAnbW9kZWxzL2JheW1heC5qc29uJyxcblx0XHRcdGNyZWF0b3I6ICdNaWx0b24gR2xhc2VyJ1xuXHRcdH1cblx0fTtcblx0TW9kZWwuZ2V0TW9kZWxVcmwgPSBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIHJlbmRlck9iai5tb2RlbEZpbGVVcmw7XG5cdH07XG5cdE1vZGVsLmdldE1vZGVsID0gZnVuY3Rpb24gKCkge1xuXHRcdHJldHVybiByZW5kZXJPYmo7XG5cdH07XG5cblxuXG5cdHJldHVybiBNb2RlbDtcblxufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcblxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdzaWduVXAnLCB7XG4gICAgICAgIHVybDogJy9zaWdudXAnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL3NpZ24tdXAvc2lnbi11cC5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ1NpZ25VcEN0cmwnXG4gICAgfSk7XG5cbn0pO1xuXG5hcHAuY29udHJvbGxlcignU2lnblVwQ3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsIFNpZ25VcCwgJHN0YXRlKSB7XG5cbiAgICAkc2NvcGUubG9naW4gPSB7fTtcbiAgICAkc2NvcGUuZXJyb3IgPSBudWxsO1xuXG4gICAgJHNjb3BlLnNlbmRTaWduVXAgPSBmdW5jdGlvbiAoc2lnblVwSW5mbykge1xuXG4gICAgICAgICRzY29wZS5lcnJvciA9IG51bGw7XG5cbiAgICAgICAgU2lnblVwLnNpZ251cChzaWduVXBJbmZvKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzdGF0ZS5nbygnbGlzdGluZycpO1xuICAgICAgICB9KS5jYXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUuZXJyb3IgPSAnSW52YWxpZCBsb2dpbiBjcmVkZW50aWFscy4nO1xuICAgICAgICB9KTtcblxuICAgIH07XG4gICAgXG4gICAgJHNjb3BlLmdldFVzZXJzID0gZnVuY3Rpb24oKXtcbiAgICAgICAgU2lnblVwLmdldFVzZXJzKCkudGhlbihmdW5jdGlvbih1c2Vycyl7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyh1c2VycylcbiAgICAgICAgfSlcbiAgICB9XG5cbn0pO1xuXG4iLCIndXNlIHN0cmljdCc7XG5cbmFwcC5jb250cm9sbGVyKCdVcGxvYWRDb250cm9sbGVyJywgZnVuY3Rpb24oJHNjb3BlKXtcblxufSk7IiwiJ3VzZSBzdHJpY3QnO1xuXG5hcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcil7XG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCd1cGxvYWQnLCB7XG5cdFx0dXJsOiAnL3VwbG9hZCcsXG5cdFx0dGVtcGxhdGVVcmw6ICdqcy91cGxvYWQvdXBsb2FkLmh0bWwnLFxuXHRcdGNvbnRyb2xsZXI6ICdVcGxvYWRDb250cm9sbGVyJ1xuXHR9KTtcbn0pOyIsIid1c2Ugc3RyaWN0JztcblxuYXBwLmNvbnRyb2xsZXIoJ1VzZXJDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSl7XG5cblxuXG59KTsiLCIndXNlIHN0cmljdCc7XG5cbmFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCd1c2VyJywge1xuXHRcdHVybDogJy91c2VyLzppZCcsXG5cdFx0dGVtcGxhdGVVcmw6ICcvYnJvd3Nlci9qcy91c2VyL3VzZXIuaHRtbCcsXG5cdFx0Y29udHJvbGxlcjogJ1VzZXJDb250cm9sbGVyJyxcblx0XHRyZXNvbHZlOiB7XG5cdFx0XHR1c2VyOiBmdW5jdGlvbiAoVXNlciwgJHN0YXRlUGFyYW1zKSB7XG5cdFx0XHRcdHZhciB1c2VyID0gbmV3IFVzZXIoe19pZDogJHN0YXRlUGFyYW1zLmlkfSk7XG5cdFx0XHRcdHJldHVybiB1c2VyLmZldGNoKCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9KTtcbn0pOyIsIid1c2Ugc3RyaWN0JztcblxuYXBwLmRpcmVjdGl2ZSgnZmllbGRGb2N1cycsIGZ1bmN0aW9uKCRwYXJzZSwgJHRpbWVvdXQpe1xuXHRyZXR1cm4ge1xuXHRcdHJlc3RyaWN0OiAnQScsXG5cdFx0bGluazogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50LCBhdHRycyl7XG5cdFx0XHR2YXIgc3RhdHVzID0gJHBhcnNlKGF0dHJzLmZpZWxkRm9jdXMpO1xuXHRcdFx0c2NvcGUuJHdhdGNoKHN0YXR1cywgZnVuY3Rpb24odmFsKXtcblx0XHRcdFx0Y29uc29sZS5sb2coJ3N0YXR1cyA9ICcsIHZhbCk7XG5cdFx0XHRcdGlmICh2YWwgPT09IHRydWUpe1xuXHRcdFx0XHRcdCR0aW1lb3V0KGZ1bmN0aW9uKCl7XG5cdFx0XHRcdFx0XHRlbGVtZW50WzBdLmZvY3VzKCk7XG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0fVxuXHRcdFx0fSlcblx0XHR9XG5cdH1cbn0pIiwiXG5hcHAuZmFjdG9yeSgnU2lnblVwJywgZnVuY3Rpb24gKCRodHRwLCAkc3RhdGUsICRsb2NhdGlvbikge1xuXHRyZXR1cm57XG5cdFx0c2lnbnVwOiBmdW5jdGlvbiAoY3JlZGVudGlhbHMpIHtcblx0XHRyZXR1cm4gJGh0dHAucG9zdCgnYXBpL3VzZXInLCBjcmVkZW50aWFscykudGhlbihmdW5jdGlvbiAocmVzKSB7XG5cdFx0XHRjb25zb2xlLmxvZyhyZXMuZGF0YSlcblx0XHRcdHJldHVybiByZXMuZGF0YTtcblx0XHR9KTtcblx0XHR9LFxuXG4gICAgICAgIGdldFVzZXJzOiBmdW5jdGlvbigpe1xuICAgICAgICAgICAgcmV0dXJuICRodHRwLmdldCgnYXBpL3VzZXInKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UuZGF0YTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cblx0fVxufSk7XG5cbiIsIid1c2Ugc3RyaWN0JztcblxuYXBwLmRpcmVjdGl2ZSgnY29sbGVjdGlvbicsIGZ1bmN0aW9uKCl7XG5cdHJldHVybiB7XG5cdFx0cmVzdHJpY3Q6ICdFJyxcblx0XHR0ZW1wbGF0ZVVybDogJ2pzL2NvbXBvbmVudHMvY29sbGVjdGlvbi9jb2xsZWN0aW9uLmh0bWwnLFxuXHRcdGNvbnRyb2xsZXI6ICdNYW5hZ2VyQ29udHJvbGxlcidcblx0fVxufSk7IiwiJ3VzZSBzdHJpY3QnO1xuXG5hcHAuZGlyZWN0aXZlKCduYXZiYXInLCBmdW5jdGlvbiAoKSB7XG5cdHJldHVybiB7XG5cdFx0cmVzdHJpY3Q6IFwiRVwiLFxuXHRcdHRlbXBsYXRlVXJsOiBcImpzL2NvbXBvbmVudHMvbmF2YmFyL25hdmJhci5odG1sXCIsXG5cdFx0Y29udHJvbGxlcjogJ01hbmFnZXJDb250cm9sbGVyJ1xuXHR9XG59KTsiLCIndXNlIHN0cmljdCc7XG5cbmFwcC5kaXJlY3RpdmUoJ29hdXRoQnV0dG9uJywgZnVuY3Rpb24gKCkge1xuXHRyZXR1cm4ge1xuXHRcdHNjb3BlOiB7XG5cdFx0XHRwcm92aWRlck5hbWU6ICdAJ1xuXHRcdH0sXG5cdFx0cmVzdHJpY3Q6ICdFJyxcblx0XHR0ZW1wbGF0ZVVybDogJ2pzL2NvbXBvbmVudHMvb2F1dGgtYnV0dG9uL29hdXRoLWJ1dHRvbi5odG1sJ1xuXHR9XG59KTsiLCIndXNlIHN0cmljdCc7XG5cbmFwcC5kaXJlY3RpdmUoJ3NlYXJjaGJhcicsIGZ1bmN0aW9uICgpe1xuXHRyZXR1cm4ge1xuXHRcdHJlc3RyaWN0OiAnRScsXG5cdFx0dGVtcGxhdGVVcmw6ICdqcy9jb21wb25lbnRzL3NlYXJjaGJhci9zZWFyY2hiYXIuaHRtbCdcblx0fVxufSk7IiwiJ3VzZSBzdHJpY3QnO1xuXG5hcHAuY29udHJvbGxlcignTGlzdGluZ0NvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBtb2RlbHMsIE1vZGVsKSB7XG5cbiAgICAkc2NvcGUuY2hhbmdlTW9kZWwgPSBmdW5jdGlvbigpe1xuICAgIFx0Y29uc29sZS5sb2coJHNjb3BlLm1vZGVscyk7XG4gICAgXHRNb2RlbC5jaGFuZ2VNb2RlbCgpO1xuICAgIH1cblxuICAgICRzY29wZS5tb2RlbHMgPSBtb2RlbHM7XG5cbn0pOyIsIid1c2Ugc3RyaWN0JztcblxuYXBwLmNvbmZpZyggZnVuY3Rpb24oJHN0YXRlUHJvdmlkZXIpe1xuXG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdsaXN0aW5nJywge1xuXHRcdHVybDogJy8nLFxuXHRcdHRlbXBsYXRlVXJsOiAnanMvcHJvZHVjdC9saXN0aW5nL2xpc3RpbmcuaHRtbCcsXG5cdFx0Y29udHJvbGxlcjogJ0xpc3RpbmdDb250cm9sbGVyJyxcblx0XHRyZXNvbHZlOiB7XG5cdFx0XHRtb2RlbHM6IGZ1bmN0aW9uIChNb2RlbCkge1xuXHRcdFx0XHRjb25zb2xlLmxvZyhNb2RlbC5mZXRjaEFsbCgpKTtcblx0XHRcdFx0cmV0dXJuIE1vZGVsLmZldGNoQWxsKCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9KTtcblxufSk7IiwiJ3VzZSBzdHJpY3QnO1xuXG5hcHAuY29udHJvbGxlcignUmVuZGVyQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIE1vZGVsKSB7XG5cblx0JHNjb3BlLm1vZGVsID0gTW9kZWwuZ2V0TW9kZWwoKTtcblx0XG5cdCRzY29wZS4kd2F0Y2goZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gTW9kZWwuZ2V0TW9kZWxVcmwoKVxuXHR9LCBmdW5jdGlvbiAobmV3VmFsLCBvbGRWYWwpe1xuXHRcdCRzY29wZS5tb2RlbCA9IE1vZGVsLmdldE1vZGVsKCk7IFxuXHR9KTtcblxufSk7IiwiJ3VzZSBzdHJpY3QnO1xuXG5hcHAuZGlyZWN0aXZlKCduZ1dlYmdsJywgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICByZXN0cmljdDogJ0EnLFxuICAgICAgc2NvcGU6IHtcbiAgICAgICAgbW9kZWw6ICc9bW9kZWxGaWxlVXJsJ1xuICAgICAgfSxcbiAgICAgIGNvbnRyb2xsZXI6IFwiUmVuZGVyQ29udHJvbGxlclwiLFxuICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50LCBhdHRyKSB7XG5cbiAgICAgICAgLy8gU2V0dXAgc2VsZWN0aW9uc1xuICAgICAgICBzY29wZS5yZW5kZXJGcmFtZSA9ICQoJyNyZW5kZXItZnJhbWUnKTtcbiAgICAgICAgdmFyIHJlbmRlckZyYW1lV2lkdGggPSBzY29wZS5yZW5kZXJGcmFtZS53aWR0aCgpO1xuICAgICAgICB2YXIgcmVuZGVyRnJhbWVIZWlnaHQgPSBzY29wZS5yZW5kZXJGcmFtZS5oZWlnaHQoKTtcbiAgICAgICAgdmFyIHJlbmRlck9iamVjdFNjYWxlTW9kaWZpZXIgPSByZW5kZXJGcmFtZVdpZHRoLzEwMjQ7XG5cbiAgICAgICAgLy8gU2V0dXAgVEhSRUUuanMgdmFyaWFibGVzIHdpdGggc2NvcGVcbiAgICAgICAgdmFyIGNhbWVyYTtcbiAgICAgICAgICAgIHNjb3BlLmNhbWVyYSA9IGNhbWVyYTtcbiAgICAgICAgdmFyIHNjZW5lO1xuICAgICAgICAgICAgc2NvcGUuc2NlbmUgPSBzY2VuZTtcbiAgICAgICAgdmFyIHJlbmRlcmVyO1xuICAgICAgICAgICAgc2NvcGUucmVuZGVyZXIgPSByZW5kZXJlcjtcbiAgICAgICAgdmFyIHByZXZpb3VzO1xuICAgICAgICAgICAgc2NvcGUucHJldmlvdXMgPSBwcmV2aW91cztcblxuICAgICAgICAvLyBpbml0aWFsaXplIHNjZW5lXG4gICAgICAgIGluaXQoKTtcblxuICAgICAgICAvLyBsb2FkIGRlZmF1bHQgbW9kZWwgb24gc2NvcGUgLS0gamVlcCBtb2RlbCAtLSB2aWEgQXNzaW1wSlNPTkxvYWRlclxuICAgICAgICB2YXIgbG9hZGVyMiA9IG5ldyBUSFJFRS5PYmplY3RMb2FkZXIoKTtcbiAgICAgICAgdmFyIGxvYWRlcjMgPSBuZXcgVEhSRUUuSlNPTkxvYWRlcigpO1xuXG4gICAgICAgIC8vIFdhdGNoIGZvciBjaGFuZ2VzIHRvIHNjb3BlXG4gICAgICAgIHNjb3BlLiR3YXRjaCgnbW9kZWwubW9kZWxGaWxlVXJsJywgZnVuY3Rpb24gKG5ld1ZhbHVlLCBvbGRWYWx1ZSl7XG4gICAgICAgICAgaWYgKG5ld1ZhbHVlICE9IG9sZFZhbHVlKSB7XG4gICAgICAgICAgICBsb2FkTW9kZWwobmV3VmFsdWUpOyBcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vISEgSGFuZGxlIHJlbW92aW5nIG9iamVjdCBhbmQgYWRkaW5nIG5ldyBvYmplY3RcbiAgICAgICAgZnVuY3Rpb24gbG9hZE1vZGVsKG1vZFVybCkge1xuICAgICAgICAgICAgbG9hZGVyMi5sb2FkKG1vZFVybCwgZnVuY3Rpb24gKG9iamVjdCkge1xuICAgICAgICAgICAgICBvYmplY3Quc2NhbGUueCA9IG9iamVjdC5zY2FsZS55ID0gb2JqZWN0LnNjYWxlLnogPSAoLjAyOCAqIHJlbmRlck9iamVjdFNjYWxlTW9kaWZpZXIpO1xuICAgICAgICAgICAgICBvYmplY3QucG9zaXRpb24ueSA9IC41O1xuICAgICAgICAgICAgICBvYmplY3QudXBkYXRlTWF0cml4KCk7XG4gICAgICAgICAgICAgIGlmIChwcmV2aW91cykgc2NlbmUucmVtb3ZlKHByZXZpb3VzKTtcbiAgICAgICAgICAgICAgc2NlbmUuYWRkKG9iamVjdCk7XG5cbiAgICAgICAgICAgICAgcHJldmlvdXMgPSBvYmplY3Q7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgLy8gcnVuIGxvYWQgbW9kZWwgb24gY3VycmVudCBtb2RlbFVybFxuICAgICAgICBsb2FkTW9kZWwoc2NvcGUubW9kZWwubW9kZWxGaWxlVXJsKTtcbiAgICAgICAgYW5pbWF0ZSgpO1xuXG4gICAgICAgIC8vIFNldHVwIFRIUkVFLmpzIGNhbWVyYXMsIHNjZW5lLCByZW5kZXJlciwgbGlnaHRpbmdcbiAgICAgICAgZnVuY3Rpb24gaW5pdCgpe1xuXG4gICAgICAgICAgLy8gQ2FtZXJhXG4gICAgICAgICAgY2FtZXJhID0gbmV3IFRIUkVFLlBlcnNwZWN0aXZlQ2FtZXJhKDUwLCByZW5kZXJGcmFtZVdpZHRoIC8gcmVuZGVyRnJhbWVIZWlnaHQsIDEsIDIwMDApO1xuICAgICAgICAgIGNhbWVyYS5wb3NpdGlvbi5zZXQoMiw0LDUpO1xuXG4gICAgICAgICAgLy8gU2NlbmVcbiAgICAgICAgICBzY2VuZSA9IG5ldyBUSFJFRS5TY2VuZSgpO1xuICAgICAgICAgIC8vIHNjZW5lLmZvZyA9IG5ldyBUSFJFRS5Gb2dFeHAyKDB4MDAwMDAwLCAwLjAwMDEpO1xuXG4gICAgICAgICAgLy8gTGlnaHRzXG4gICAgICAgICAgc2NlbmUuYWRkKG5ldyBUSFJFRS5BbWJpZW50TGlnaHQoMHhjY2NjY2MpKTtcblxuICAgICAgICAgIHZhciBkaXJlY3Rpb25hbExpZ2h0ID0gbmV3IFRIUkVFLkRpcmVjdGlvbmFsTGlnaHQoMHhjY2NjY2MpO1xuICAgICAgICAgIGRpcmVjdGlvbmFsTGlnaHQucG9zaXRpb24ueCA9IE1hdGgucmFuZG9tKCkgLSAwLjU7XG4gICAgICAgICAgZGlyZWN0aW9uYWxMaWdodC5wb3NpdGlvbi55ID0gTWF0aC5yYW5kb20oKSAtIDAuNTtcbiAgICAgICAgICBkaXJlY3Rpb25hbExpZ2h0LnBvc2l0aW9uLnogPSBNYXRoLnJhbmRvbSgpIC0gMC41O1xuICAgICAgICAgIGRpcmVjdGlvbmFsTGlnaHQucG9zaXRpb24ubm9ybWFsaXplKCk7XG4gICAgICAgICAgc2NlbmUuYWRkKGRpcmVjdGlvbmFsTGlnaHQpO1xuXG4gICAgICAgICAgLy8hISEhIFJlbmRlcmVyXG4gICAgICAgICAgcmVuZGVyZXIgPSBuZXcgVEhSRUUuV2ViR0xSZW5kZXJlcih7IGFudGlhbGlhczogdHJ1ZSB9KTtcbiAgICAgICAgICByZW5kZXJlci5zZXRTaXplKHJlbmRlckZyYW1lV2lkdGgsIHJlbmRlckZyYW1lSGVpZ2h0KTtcbiAgICAgICAgICByZW5kZXJlci5zZXRDbGVhckNvbG9yKCAweGZmZmZmZiApO1xuICAgICAgICAgIGVsZW1lbnRbMF0uYXBwZW5kQ2hpbGQocmVuZGVyZXIuZG9tRWxlbWVudCk7XG5cbiAgICAgICAgICAvLyBDaGVjayBmb3IgUmVzaXplIEV2ZW50XG4gICAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIG9uV2luZG93UmVzaXplLCBmYWxzZSk7XG5cbiAgICAgICAgICAvLyBjb25zb2xlLmxvZyhzY2VuZSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBIYW5kbGUgUmVzaXplXG4gICAgICAgIGZ1bmN0aW9uIG9uV2luZG93UmVzaXplKGV2ZW50KXtcbiAgICAgICAgICByZW5kZXJlci5zZXRTaXplKHNjb3BlLnJlbmRlckZyYW1lLndpZHRoKCksIHJlbmRlckZyYW1lSGVpZ2h0KTtcbiAgICAgICAgICBjYW1lcmEuYXNwZWN0ID0gc2NvcGUucmVuZGVyRnJhbWUud2lkdGgoKSAvIHJlbmRlckZyYW1lSGVpZ2h0O1xuICAgICAgICAgIGNhbWVyYS51cGRhdGVQcm9qZWN0aW9uTWF0cml4KCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBbmltYXRlXG4gICAgICAgIHZhciB0ID0gMDsgLy8gP1xuICAgICAgICBmdW5jdGlvbiBhbmltYXRlKCkgeyAgICAgICAgICBcbiAgICAgICAgICByZW5kZXIoKTtcbiAgICAgICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoYW5pbWF0ZSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBIYW5kbGUgcmUtUmVuZGVyaW5nIG9mIHNjZW5lIGZvciBzcGlubmluZ1xuICAgICAgICBmdW5jdGlvbiByZW5kZXIoKXsgXG4gICAgICAgICAgdmFyIHRpbWVyID0gRGF0ZS5ub3coKSAqIDAuMDAwMTU7XG4gICAgICAgICAgICBjYW1lcmEucG9zaXRpb24ueCA9IE1hdGguY29zKHRpbWVyKSAqIDEwO1xuICAgICAgICAgICAgY2FtZXJhLnBvc2l0aW9uLnkgPSA0O1xuICAgICAgICAgICAgY2FtZXJhLnBvc2l0aW9uLnogPSBNYXRoLnNpbih0aW1lcikgKiA4LjU7XG4gICAgICAgICAgICBjYW1lcmEubG9va0F0KHNjZW5lLnBvc2l0aW9uKTtcbiAgICAgICAgICAgIHJlbmRlcmVyLnJlbmRlcihzY2VuZSwgY2FtZXJhKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbn0pOyJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
=======
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImZzYS1wcmUtYnVpbHQuanMiLCJsb2dpbi9sb2dpbi5qcyIsImNvbXBvbmVudHMvbWFuYWdlci5jb250cm9sbGVyLmpzIiwicHJvZHVjdC9tb2RlbC5mYWN0b3J5LmpzIiwic2lnbi11cC9zaWduLXVwLmpzIiwidXBsb2FkL3VwbG9hZC5jb250cm9sbGVyLmpzIiwidXBsb2FkL3VwbG9hZC5zdGF0ZS5qcyIsInVzZXIvdXNlci5jb250cm9sbGVyLmpzIiwidXNlci91c2VyLnN0YXRlLmpzIiwidXRpbHMvZmllbGRGb2N1cy5kaXJlY3RpdmUuanMiLCJ1dGlscy9zaWduLXVwLWZhY3RvcnkuanMiLCJjb21wb25lbnRzL2NvbGxlY3Rpb24vY29sbGVjdGlvbi5kaXJlY3RpdmUuanMiLCJjb21wb25lbnRzL25hdmJhci9uYXZiYXIuZGlyZWN0aXZlLmpzIiwiY29tcG9uZW50cy9vYXV0aC1idXR0b24vb2F1dGgtYnV0dG9uLmRpcmVjdGl2ZS5qcyIsImNvbXBvbmVudHMvcmVjZW5naW5lL3JlY2VuZ2luZS5jb250cm9sbGVyLmpzIiwiY29tcG9uZW50cy9yZWNlbmdpbmUvcmVjZW5naW5lLmRpcmVjdGl2ZS5qcyIsImNvbXBvbmVudHMvcmVjZW5naW5lL3JlY2VuZ2luZS5mYWN0b3J5LmpzIiwiY29tcG9uZW50cy9zZWFyY2hiYXIvc2VhcmNoYmFyLmRpcmVjdGl2ZS5qcyIsInByb2R1Y3QvbGlzdGluZy9saXN0aW5nLmNvbnRyb2xsZXIuanMiLCJwcm9kdWN0L2xpc3RpbmcvbGlzdGluZy5zdGF0ZS5qcyIsInByb2R1Y3QvcmVuZGVyL3JlbmRlci5jb250cm9sbGVyLmpzIiwicHJvZHVjdC9yZW5kZXIvcmVuZGVyLmRpcmVjdGl2ZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFBLENBQUE7QUFDQSxJQUFBLEdBQUEsR0FBQSxPQUFBLENBQUEsTUFBQSxDQUFBLHVCQUFBLEVBQUEsQ0FBQSxXQUFBLEVBQUEsYUFBQSxDQUFBLENBQUEsQ0FBQTs7QUFFQSxHQUFBLENBQUEsTUFBQSxDQUFBLFVBQUEsa0JBQUEsRUFBQSxpQkFBQSxFQUFBOztBQUVBLGtCQUFBLENBQUEsU0FBQSxDQUFBLElBQUEsQ0FBQSxDQUFBOztBQUVBLG1CQUFBLENBQUEsU0FBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBO0FBQ0EsbUJBQUEsQ0FBQSxJQUFBLENBQUEsaUJBQUEsRUFBQSxZQUFBO0FBQ0EsUUFBQSxDQUFBLFFBQUEsQ0FBQSxNQUFBLEVBQUEsQ0FBQTtFQUNBLENBQUEsQ0FBQTtDQUVBLENBQUEsQ0FBQTs7O0FBR0EsR0FBQSxDQUFBLEdBQUEsQ0FBQSxVQUFBLFVBQUEsRUFBQSxXQUFBLEVBQUEsTUFBQSxFQUFBOzs7QUFHQSxLQUFBLDRCQUFBLEdBQUEsU0FBQSw0QkFBQSxDQUFBLEtBQUEsRUFBQTtBQUNBLFNBQUEsS0FBQSxDQUFBLElBQUEsSUFBQSxLQUFBLENBQUEsSUFBQSxDQUFBLFlBQUEsQ0FBQTtFQUNBLENBQUE7Ozs7QUFJQSxXQUFBLENBQUEsR0FBQSxDQUFBLG1CQUFBLEVBQUEsVUFBQSxLQUFBLEVBQUEsT0FBQSxFQUFBOztBQUVBLE1BQUEsQ0FBQSw0QkFBQSxDQUFBLE9BQUEsQ0FBQSxFQUFBOzs7QUFHQSxVQUFBO0dBQ0E7O0FBRUEsTUFBQSxXQUFBLENBQUEsZUFBQSxFQUFBLEVBQUE7OztBQUdBLFVBQUE7R0FDQTs7O0FBR0EsT0FBQSxDQUFBLGNBQUEsRUFBQSxDQUFBOztBQUVBLGFBQUEsQ0FBQSxlQUFBLEVBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxJQUFBLEVBQUE7Ozs7QUFJQSxPQUFBLFdBQUEsR0FBQSxJQUFBLEdBQUEsT0FBQSxDQUFBLElBQUEsR0FBQSxPQUFBLENBQUE7QUFDQSxTQUFBLENBQUEsRUFBQSxDQUFBLFdBQUEsQ0FBQSxDQUFBO0dBQ0EsQ0FBQSxDQUFBO0VBRUEsQ0FBQSxDQUFBO0NBRUEsQ0FBQSxDQUFBO0FDbkRBLENBQUEsWUFBQTs7QUFFQSxhQUFBLENBQUE7OztBQUdBLEtBQUEsQ0FBQSxNQUFBLENBQUEsT0FBQSxFQUFBLE1BQUEsSUFBQSxLQUFBLENBQUEsd0JBQUEsQ0FBQSxDQUFBOztBQUVBLEtBQUEsR0FBQSxHQUFBLE9BQUEsQ0FBQSxNQUFBLENBQUEsYUFBQSxFQUFBLEVBQUEsQ0FBQSxDQUFBOztBQUVBLElBQUEsQ0FBQSxPQUFBLENBQUEsUUFBQSxFQUFBLFlBQUE7QUFDQSxNQUFBLENBQUEsTUFBQSxDQUFBLEVBQUEsRUFBQSxNQUFBLElBQUEsS0FBQSxDQUFBLHNCQUFBLENBQUEsQ0FBQTtBQUNBLFNBQUEsTUFBQSxDQUFBLEVBQUEsQ0FBQSxNQUFBLENBQUEsUUFBQSxDQUFBLE1BQUEsQ0FBQSxDQUFBO0VBQ0EsQ0FBQSxDQUFBOzs7OztBQUtBLElBQUEsQ0FBQSxRQUFBLENBQUEsYUFBQSxFQUFBO0FBQ0EsY0FBQSxFQUFBLG9CQUFBO0FBQ0EsYUFBQSxFQUFBLG1CQUFBO0FBQ0EsZUFBQSxFQUFBLHFCQUFBO0FBQ0EsZ0JBQUEsRUFBQSxzQkFBQTtBQUNBLGtCQUFBLEVBQUEsd0JBQUE7QUFDQSxlQUFBLEVBQUEscUJBQUE7RUFDQSxDQUFBLENBQUE7O0FBRUEsSUFBQSxDQUFBLE9BQUEsQ0FBQSxpQkFBQSxFQUFBLFVBQUEsVUFBQSxFQUFBLEVBQUEsRUFBQSxXQUFBLEVBQUE7QUFDQSxNQUFBLFVBQUEsR0FBQTtBQUNBLE1BQUEsRUFBQSxXQUFBLENBQUEsZ0JBQUE7QUFDQSxNQUFBLEVBQUEsV0FBQSxDQUFBLGFBQUE7QUFDQSxNQUFBLEVBQUEsV0FBQSxDQUFBLGNBQUE7QUFDQSxNQUFBLEVBQUEsV0FBQSxDQUFBLGNBQUE7R0FDQSxDQUFBO0FBQ0EsU0FBQTtBQUNBLGdCQUFBLEVBQUEsdUJBQUEsUUFBQSxFQUFBO0FBQ0EsY0FBQSxDQUFBLFVBQUEsQ0FBQSxVQUFBLENBQUEsUUFBQSxDQUFBLE1BQUEsQ0FBQSxFQUFBLFFBQUEsQ0FBQSxDQUFBO0FBQ0EsV0FBQSxFQUFBLENBQUEsTUFBQSxDQUFBLFFBQUEsQ0FBQSxDQUFBO0lBQ0E7R0FDQSxDQUFBO0VBQ0EsQ0FBQSxDQUFBOztBQUVBLElBQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxhQUFBLEVBQUE7QUFDQSxlQUFBLENBQUEsWUFBQSxDQUFBLElBQUEsQ0FBQSxDQUNBLFdBQUEsRUFDQSxVQUFBLFNBQUEsRUFBQTtBQUNBLFVBQUEsU0FBQSxDQUFBLEdBQUEsQ0FBQSxpQkFBQSxDQUFBLENBQUE7R0FDQSxDQUNBLENBQUEsQ0FBQTtFQUNBLENBQUEsQ0FBQTs7QUFFQSxJQUFBLENBQUEsT0FBQSxDQUFBLGFBQUEsRUFBQSxVQUFBLEtBQUEsRUFBQSxPQUFBLEVBQUEsVUFBQSxFQUFBLFdBQUEsRUFBQSxFQUFBLEVBQUE7O0FBRUEsV0FBQSxpQkFBQSxDQUFBLFFBQUEsRUFBQTtBQUNBLE9BQUEsSUFBQSxHQUFBLFFBQUEsQ0FBQSxJQUFBLENBQUE7QUFDQSxVQUFBLENBQUEsR0FBQSxDQUFBLFdBQUEsQ0FBQSxDQUFBO0FBQ0EsVUFBQSxDQUFBLE1BQUEsQ0FBQSxJQUFBLENBQUEsRUFBQSxFQUFBLElBQUEsQ0FBQSxJQUFBLENBQUEsQ0FBQTtBQUNBLGFBQUEsQ0FBQSxVQUFBLENBQUEsV0FBQSxDQUFBLFlBQUEsQ0FBQSxDQUFBO0FBQ0EsVUFBQSxJQUFBLENBQUEsSUFBQSxDQUFBO0dBQ0E7Ozs7QUFJQSxNQUFBLENBQUEsZUFBQSxHQUFBLFlBQUE7QUFDQSxVQUFBLENBQUEsQ0FBQSxPQUFBLENBQUEsSUFBQSxDQUFBO0dBQ0EsQ0FBQTs7QUFFQSxNQUFBLENBQUEsZUFBQSxHQUFBLFVBQUEsVUFBQSxFQUFBOzs7Ozs7Ozs7O0FBVUEsT0FBQSxJQUFBLENBQUEsZUFBQSxFQUFBLElBQUEsVUFBQSxLQUFBLElBQUEsRUFBQTtBQUNBLFdBQUEsRUFBQSxDQUFBLElBQUEsQ0FBQSxPQUFBLENBQUEsSUFBQSxDQUFBLENBQUE7SUFDQTs7Ozs7QUFLQSxVQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUEsVUFBQSxDQUFBLENBQUEsSUFBQSxDQUFBLGlCQUFBLENBQUEsU0FBQSxDQUFBLFlBQUE7QUFDQSxXQUFBLElBQUEsQ0FBQTtJQUNBLENBQUEsQ0FBQTtHQUVBLENBQUE7O0FBRUEsTUFBQSxDQUFBLEtBQUEsR0FBQSxVQUFBLFdBQUEsRUFBQTtBQUNBLFVBQUEsS0FBQSxDQUFBLElBQUEsQ0FBQSxRQUFBLEVBQUEsV0FBQSxDQUFBLENBQ0EsSUFBQSxDQUFBLGlCQUFBLENBQUEsU0FDQSxDQUFBLFlBQUE7QUFDQSxXQUFBLEVBQUEsQ0FBQSxNQUFBLENBQUEsRUFBQSxPQUFBLEVBQUEsNEJBQUEsRUFBQSxDQUFBLENBQUE7SUFDQSxDQUFBLENBQUE7R0FDQSxDQUFBOztBQUVBLE1BQUEsQ0FBQSxNQUFBLEdBQUEsWUFBQTtBQUNBLFVBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQSxTQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsWUFBQTtBQUNBLFdBQUEsQ0FBQSxPQUFBLEVBQUEsQ0FBQTtBQUNBLGNBQUEsQ0FBQSxVQUFBLENBQUEsV0FBQSxDQUFBLGFBQUEsQ0FBQSxDQUFBO0lBQ0EsQ0FBQSxDQUFBO0dBQ0EsQ0FBQTtFQUVBLENBQUEsQ0FBQTs7QUFFQSxJQUFBLENBQUEsT0FBQSxDQUFBLFNBQUEsRUFBQSxVQUFBLFVBQUEsRUFBQSxXQUFBLEVBQUE7O0FBRUEsTUFBQSxJQUFBLEdBQUEsSUFBQSxDQUFBOztBQUVBLFlBQUEsQ0FBQSxHQUFBLENBQUEsV0FBQSxDQUFBLGdCQUFBLEVBQUEsWUFBQTtBQUNBLE9BQUEsQ0FBQSxPQUFBLEVBQUEsQ0FBQTtHQUNBLENBQUEsQ0FBQTs7QUFFQSxZQUFBLENBQUEsR0FBQSxDQUFBLFdBQUEsQ0FBQSxjQUFBLEVBQUEsWUFBQTtBQUNBLE9BQUEsQ0FBQSxPQUFBLEVBQUEsQ0FBQTtHQUNBLENBQUEsQ0FBQTs7QUFFQSxNQUFBLENBQUEsRUFBQSxHQUFBLElBQUEsQ0FBQTtBQUNBLE1BQUEsQ0FBQSxJQUFBLEdBQUEsSUFBQSxDQUFBOztBQUVBLE1BQUEsQ0FBQSxNQUFBLEdBQUEsVUFBQSxTQUFBLEVBQUEsSUFBQSxFQUFBO0FBQ0EsT0FBQSxDQUFBLEVBQUEsR0FBQSxTQUFBLENBQUE7QUFDQSxPQUFBLENBQUEsSUFBQSxHQUFBLElBQUEsQ0FBQTtHQUNBLENBQUE7O0FBRUEsTUFBQSxDQUFBLE9BQUEsR0FBQSxZQUFBO0FBQ0EsT0FBQSxDQUFBLEVBQUEsR0FBQSxJQUFBLENBQUE7QUFDQSxPQUFBLENBQUEsSUFBQSxHQUFBLElBQUEsQ0FBQTtHQUNBLENBQUE7RUFFQSxDQUFBLENBQUE7Q0FFQSxDQUFBLEVBQUEsQ0FBQTs7QUNySUEsR0FBQSxDQUFBLE1BQUEsQ0FBQSxVQUFBLGNBQUEsRUFBQTs7QUFFQSxlQUFBLENBQUEsS0FBQSxDQUFBLE9BQUEsRUFBQTtBQUNBLEtBQUEsRUFBQSxRQUFBO0FBQ0EsYUFBQSxFQUFBLHFCQUFBO0FBQ0EsWUFBQSxFQUFBLFdBQUE7RUFDQSxDQUFBLENBQUE7Q0FFQSxDQUFBLENBQUE7O0FBRUEsR0FBQSxDQUFBLFVBQUEsQ0FBQSxXQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsV0FBQSxFQUFBLE1BQUEsRUFBQTs7QUFFQSxPQUFBLENBQUEsS0FBQSxHQUFBLEVBQUEsQ0FBQTtBQUNBLE9BQUEsQ0FBQSxLQUFBLEdBQUEsSUFBQSxDQUFBOztBQUVBLE9BQUEsQ0FBQSxTQUFBLEdBQUEsVUFBQSxTQUFBLEVBQUE7QUFDQSxTQUFBLENBQUEsR0FBQSxDQUFBLGdCQUFBLENBQUEsQ0FBQTtBQUNBLFFBQUEsQ0FBQSxLQUFBLEdBQUEsSUFBQSxDQUFBOztBQUVBLGFBQUEsQ0FBQSxLQUFBLENBQUEsU0FBQSxDQUFBLENBQUEsSUFBQSxDQUFBLFlBQUE7QUFDQSxTQUFBLENBQUEsRUFBQSxDQUFBLE1BQUEsQ0FBQSxDQUFBO0dBQ0EsQ0FBQSxTQUFBLENBQUEsWUFBQTtBQUNBLFNBQUEsQ0FBQSxLQUFBLEdBQUEsNEJBQUEsQ0FBQTtHQUNBLENBQUEsQ0FBQTtFQUVBLENBQUE7Q0FFQSxDQUFBLENBQUE7QUMzQkEsWUFBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxVQUFBLENBQUEsbUJBQUEsRUFBQSxVQUFBLE1BQUEsRUFBQSxRQUFBLEVBQUE7OztBQUdBLE9BQUEsQ0FBQSxZQUFBLEdBQUEsS0FBQSxDQUFBOzs7QUFHQSxPQUFBLENBQUEsY0FBQSxHQUFBLEtBQUEsQ0FBQTtBQUNBLE9BQUEsQ0FBQSxnQkFBQSxHQUFBLFlBQUE7QUFDQSxNQUFBLENBQUEsTUFBQSxDQUFBLGNBQUEsRUFBQSxNQUFBLENBQUEsY0FBQSxHQUFBLElBQUEsQ0FBQSxLQUNBO0FBQ0EsU0FBQSxDQUFBLGNBQUEsR0FBQSxLQUFBLENBQUE7R0FDQTtFQUNBLENBQUE7OztBQUdBLE9BQUEsQ0FBQSxXQUFBLEdBQUEsWUFBQTtBQUNBLFFBQUEsQ0FBQSxjQUFBLEdBQUEsS0FBQSxDQUFBO0FBQ0EsVUFBQSxDQUFBLFlBQUE7QUFDQSxTQUFBLENBQUEsWUFBQSxHQUFBLEtBQUEsQ0FBQTtHQUNBLEVBQUEsR0FBQSxDQUFBLENBQUE7RUFDQSxDQUFBOzs7QUFHQSxPQUFBLENBQUEsVUFBQSxHQUFBLEVBQUEsQ0FBQTtDQUVBLENBQUEsQ0FBQTtBQzNCQSxZQUFBLENBQUE7O0FBRUEsR0FBQSxDQUFBLE9BQUEsQ0FBQSxPQUFBLEVBQUEsVUFBQSxLQUFBLEVBQUE7OztBQUdBLEtBQUEsU0FBQSxHQUFBO0FBQ0EsY0FBQSxFQUFBLDJDQUFBO0FBQ0EsU0FBQSxFQUFBLFdBQUE7RUFDQSxDQUFBOzs7QUFJQSxVQUFBLEtBQUEsQ0FBQSxLQUFBLEVBQUE7QUFDQSxTQUFBLENBQUEsTUFBQSxDQUFBLElBQUEsRUFBQSxLQUFBLENBQUEsQ0FBQTtFQUNBLENBQUE7O0FBRUEsTUFBQSxDQUFBLEdBQUEsR0FBQSxhQUFBLENBQUE7QUFDQSxPQUFBLENBQUEsY0FBQSxDQUFBLEtBQUEsQ0FBQSxTQUFBLEVBQUEsS0FBQSxFQUFBO0FBQ0EsS0FBQSxFQUFBLGVBQUE7QUFDQSxVQUFBLEtBQUEsQ0FBQSxHQUFBLEdBQUEsSUFBQSxDQUFBLEdBQUEsQ0FBQTtHQUNBO0VBQ0EsQ0FBQSxDQUFBOzs7QUFJQSxNQUFBLENBQUEsU0FBQSxDQUFBLEtBQUEsR0FBQSxZQUFBO0FBQ0EsU0FBQSxLQUFBLENBQUEsR0FBQSxDQUFBLElBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxHQUFBLEVBQUE7QUFDQSxVQUFBLElBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQSxJQUFBLENBQUEsQ0FBQTtHQUNBLENBQUEsQ0FBQTtFQUNBLENBQUE7O0FBRUEsTUFBQSxDQUFBLFFBQUEsR0FBQSxZQUFBOzs7Ozs7QUFNQSxTQUFBLENBQUEsR0FBQSxFQUFBLENBQUE7QUFDQSxTQUFBLENBQ0E7QUFDQSxNQUFBLEVBQUEsS0FBQTtBQUNBLFFBQUEsRUFBQSxpQkFBQTtBQUNBLGtCQUFBLEVBQUEsc0NBQUE7QUFDQSxlQUFBLEVBQUEsMkNBQUE7QUFDQSxVQUFBLEVBQUEsV0FBQTtBQUNBLE9BQUEsRUFBQSxDQUFBLGFBQUEsRUFBQSxVQUFBLENBQUE7R0FDQSxFQUNBO0FBQ0EsTUFBQSxFQUFBLEtBQUE7QUFDQSxRQUFBLEVBQUEsUUFBQTtBQUNBLGtCQUFBLEVBQUEsOEJBQUE7QUFDQSxlQUFBLEVBQUEsb0JBQUE7QUFDQSxVQUFBLEVBQUEsZUFBQTtBQUNBLE9BQUEsRUFBQSxDQUFBLFdBQUEsRUFBQSxZQUFBLENBQUE7R0FDQSxFQUNBO0FBQ0EsTUFBQSxFQUFBLEtBQUE7QUFDQSxRQUFBLEVBQUEsaUJBQUE7QUFDQSxrQkFBQSxFQUFBLHNDQUFBO0FBQ0EsZUFBQSxFQUFBLDJDQUFBO0FBQ0EsVUFBQSxFQUFBLFdBQUE7QUFDQSxPQUFBLEVBQUEsQ0FBQSxhQUFBLEVBQUEsVUFBQSxDQUFBO0dBQ0EsRUFDQTtBQUNBLE1BQUEsRUFBQSxLQUFBO0FBQ0EsUUFBQSxFQUFBLFFBQUE7QUFDQSxrQkFBQSxFQUFBLDhCQUFBO0FBQ0EsZUFBQSxFQUFBLG9CQUFBO0FBQ0EsVUFBQSxFQUFBLGVBQUE7QUFDQSxPQUFBLEVBQUEsQ0FBQSxXQUFBLEVBQUEsWUFBQSxDQUFBO0dBQ0EsRUFDQTtBQUNBLE1BQUEsRUFBQSxLQUFBO0FBQ0EsUUFBQSxFQUFBLGlCQUFBO0FBQ0Esa0JBQUEsRUFBQSxzQ0FBQTtBQUNBLGVBQUEsRUFBQSwyQ0FBQTtBQUNBLFVBQUEsRUFBQSxXQUFBO0FBQ0EsT0FBQSxFQUFBLENBQUEsYUFBQSxFQUFBLFVBQUEsQ0FBQTtHQUNBLEVBQ0E7QUFDQSxNQUFBLEVBQUEsS0FBQTtBQUNBLFFBQUEsRUFBQSxRQUFBO0FBQ0Esa0JBQUEsRUFBQSw4QkFBQTtBQUNBLGVBQUEsRUFBQSxvQkFBQTtBQUNBLFVBQUEsRUFBQSxlQUFBO0FBQ0EsT0FBQSxFQUFBLENBQUEsV0FBQSxFQUFBLFlBQUEsQ0FBQTtHQUNBLEVBQ0E7QUFDQSxNQUFBLEVBQUEsS0FBQTtBQUNBLFFBQUEsRUFBQSxRQUFBO0FBQ0Esa0JBQUEsRUFBQSw4QkFBQTtBQUNBLGVBQUEsRUFBQSxvQkFBQTtBQUNBLFVBQUEsRUFBQSxlQUFBO0FBQ0EsT0FBQSxFQUFBLENBQUEsV0FBQSxFQUFBLFlBQUEsQ0FBQTtHQUNBLEVBQ0E7QUFDQSxNQUFBLEVBQUEsS0FBQTtBQUNBLFFBQUEsRUFBQSxpQkFBQTtBQUNBLGtCQUFBLEVBQUEsc0NBQUE7QUFDQSxlQUFBLEVBQUEsMkNBQUE7QUFDQSxVQUFBLEVBQUEsV0FBQTtBQUNBLE9BQUEsRUFBQSxDQUFBLGFBQUEsRUFBQSxVQUFBLENBQUE7R0FDQSxFQUNBO0FBQ0EsTUFBQSxFQUFBLEtBQUE7QUFDQSxRQUFBLEVBQUEsUUFBQTtBQUNBLGtCQUFBLEVBQUEsOEJBQUE7QUFDQSxlQUFBLEVBQUEsb0JBQUE7QUFDQSxVQUFBLEVBQUEsZUFBQTtBQUNBLE9BQUEsRUFBQSxDQUFBLFdBQUEsRUFBQSxZQUFBLENBQUE7R0FDQSxFQUNBO0FBQ0EsTUFBQSxFQUFBLEtBQUE7QUFDQSxRQUFBLEVBQUEsUUFBQTtBQUNBLGtCQUFBLEVBQUEsOEJBQUE7QUFDQSxlQUFBLEVBQUEsb0JBQUE7QUFDQSxVQUFBLEVBQUEsZUFBQTtBQUNBLE9BQUEsRUFBQSxDQUFBLFdBQUEsRUFBQSxZQUFBLENBQUE7R0FDQSxFQUNBO0FBQ0EsTUFBQSxFQUFBLEtBQUE7QUFDQSxRQUFBLEVBQUEs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QUEsQ0FBQTtFQUNBLENBQUE7QUFDQSxNQUFBLENBQUEsUUFBQSxHQUFBLFlBQUE7QUFDQSxTQUFBLFNBQUEsQ0FBQTtFQUNBLENBQUE7O0FBSUEsUUFBQSxLQUFBLENBQUE7Q0FFQSxDQUFBLENBQUE7QUNsUkEsR0FBQSxDQUFBLE1BQUEsQ0FBQSxVQUFBLGNBQUEsRUFBQTs7QUFFQSxlQUFBLENBQUEsS0FBQSxDQUFBLFFBQUEsRUFBQTtBQUNBLEtBQUEsRUFBQSxTQUFBO0FBQ0EsYUFBQSxFQUFBLHlCQUFBO0FBQ0EsWUFBQSxFQUFBLFlBQUE7RUFDQSxDQUFBLENBQUE7Q0FFQSxDQUFBLENBQUE7O0FBRUEsR0FBQSxDQUFBLFVBQUEsQ0FBQSxZQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsTUFBQSxFQUFBLE1BQUEsRUFBQTs7QUFFQSxPQUFBLENBQUEsS0FBQSxHQUFBLEVBQUEsQ0FBQTtBQUNBLE9BQUEsQ0FBQSxLQUFBLEdBQUEsSUFBQSxDQUFBOztBQUVBLE9BQUEsQ0FBQSxVQUFBLEdBQUEsVUFBQSxVQUFBLEVBQUE7O0FBRUEsUUFBQSxDQUFBLEtBQUEsR0FBQSxJQUFBLENBQUE7O0FBRUEsUUFBQSxDQUFBLE1BQUEsQ0FBQSxVQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsWUFBQTtBQUNBLFNBQUEsQ0FBQSxFQUFBLENBQUEsU0FBQSxDQUFBLENBQUE7R0FDQSxDQUFBLFNBQUEsQ0FBQSxZQUFBO0FBQ0EsU0FBQSxDQUFBLEtBQUEsR0FBQSw0QkFBQSxDQUFBO0dBQ0EsQ0FBQSxDQUFBO0VBRUEsQ0FBQTs7QUFFQSxPQUFBLENBQUEsUUFBQSxHQUFBLFlBQUE7QUFDQSxRQUFBLENBQUEsUUFBQSxFQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsS0FBQSxFQUFBO0FBQ0EsVUFBQSxDQUFBLEdBQUEsQ0FBQSxLQUFBLENBQUEsQ0FBQTtHQUNBLENBQUEsQ0FBQTtFQUNBLENBQUE7Q0FFQSxDQUFBLENBQUE7O0FDakNBLFlBQUEsQ0FBQTs7QUFFQSxHQUFBLENBQUEsVUFBQSxDQUFBLGtCQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsRUFFQSxDQUFBLENBQUE7QUNKQSxZQUFBLENBQUE7O0FBRUEsR0FBQSxDQUFBLE1BQUEsQ0FBQSxVQUFBLGNBQUEsRUFBQTtBQUNBLGVBQUEsQ0FBQSxLQUFBLENBQUEsUUFBQSxFQUFBO0FBQ0EsS0FBQSxFQUFBLFNBQUE7QUFDQSxhQUFBLEVBQUEsdUJBQUE7QUFDQSxZQUFBLEVBQUEsa0JBQUE7RUFDQSxDQUFBLENBQUE7Q0FDQSxDQUFBLENBQUE7QUNSQSxZQUFBLENBQUE7O0FBRUEsR0FBQSxDQUFBLFVBQUEsQ0FBQSxnQkFBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLEVBSUEsQ0FBQSxDQUFBO0FDTkEsWUFBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxjQUFBLEVBQUE7QUFDQSxlQUFBLENBQUEsS0FBQSxDQUFBLE1BQUEsRUFBQTtBQUNBLEtBQUEsRUFBQSxXQUFBO0FBQ0EsYUFBQSxFQUFBLDRCQUFBO0FBQ0EsWUFBQSxFQUFBLGdCQUFBO0FBQ0EsU0FBQSxFQUFBO0FBQ0EsT0FBQSxFQUFBLGNBQUEsSUFBQSxFQUFBLFlBQUEsRUFBQTtBQUNBLFFBQUEsSUFBQSxHQUFBLElBQUEsSUFBQSxDQUFBLEVBQUEsR0FBQSxFQUFBLFlBQUEsQ0FBQSxFQUFBLEVBQUEsQ0FBQSxDQUFBO0FBQ0EsV0FBQSxJQUFBLENBQUEsS0FBQSxFQUFBLENBQUE7SUFDQTtHQUNBO0VBQ0EsQ0FBQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBOztBQ2RBLFlBQUEsQ0FBQTs7QUFFQSxHQUFBLENBQUEsU0FBQSxDQUFBLFlBQUEsRUFBQSxVQUFBLE1BQUEsRUFBQSxRQUFBLEVBQUE7QUFDQSxRQUFBO0FBQ0EsVUFBQSxFQUFBLEdBQUE7QUFDQSxNQUFBLEVBQUEsY0FBQSxLQUFBLEVBQUEsT0FBQSxFQUFBLEtBQUEsRUFBQTtBQUNBLE9BQUEsTUFBQSxHQUFBLE1BQUEsQ0FBQSxLQUFBLENBQUEsVUFBQSxDQUFBLENBQUE7QUFDQSxRQUFBLENBQUEsTUFBQSxDQUFBLE1BQUEsRUFBQSxVQUFBLEdBQUEsRUFBQTtBQUNBLFdBQUEsQ0FBQSxHQUFBLENBQUEsV0FBQSxFQUFBLEdBQUEsQ0FBQSxDQUFBO0FBQ0EsUUFBQSxHQUFBLEtBQUEsSUFBQSxFQUFBO0FBQ0EsYUFBQSxDQUFBLFlBQUE7QUFDQSxhQUFBLENBQUEsQ0FBQSxDQUFBLENBQUEsS0FBQSxFQUFBLENBQUE7TUFDQSxDQUFBLENBQUE7S0FDQTtJQUNBLENBQUEsQ0FBQTtHQUNBO0VBQ0EsQ0FBQTtDQUNBLENBQUEsQ0FBQTs7QUNoQkEsR0FBQSxDQUFBLE9BQUEsQ0FBQSxRQUFBLEVBQUEsVUFBQSxLQUFBLEVBQUEsTUFBQSxFQUFBLFNBQUEsRUFBQTtBQUNBLFFBQUE7QUFDQSxRQUFBLEVBQUEsZ0JBQUEsV0FBQSxFQUFBO0FBQ0EsVUFBQSxLQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsRUFBQSxXQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxHQUFBLEVBQUE7QUFDQSxXQUFBLENBQUEsR0FBQSxDQUFBLEdBQUEsQ0FBQSxJQUFBLENBQUEsQ0FBQTtBQUNBLFdBQUEsR0FBQSxDQUFBLElBQUEsQ0FBQTtJQUNBLENBQUEsQ0FBQTtHQUNBOztBQUVBLFVBQUEsRUFBQSxvQkFBQTtBQUNBLFVBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQSxVQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxRQUFBLEVBQUE7QUFDQSxXQUFBLFFBQUEsQ0FBQSxJQUFBLENBQUE7SUFDQSxDQUFBLENBQUE7R0FDQTtFQUNBLENBQUE7Q0FDQSxDQUFBLENBQUE7O0FDaEJBLFlBQUEsQ0FBQTs7QUFFQSxHQUFBLENBQUEsU0FBQSxDQUFBLFlBQUEsRUFBQSxZQUFBO0FBQ0EsUUFBQTtBQUNBLFVBQUEsRUFBQSxHQUFBO0FBQ0EsYUFBQSxFQUFBLDBDQUFBO0FBQ0EsWUFBQSxFQUFBLG1CQUFBO0VBQ0EsQ0FBQTtDQUNBLENBQUEsQ0FBQTtBQ1JBLFlBQUEsQ0FBQTs7QUFFQSxHQUFBLENBQUEsU0FBQSxDQUFBLFFBQUEsRUFBQSxZQUFBO0FBQ0EsUUFBQTtBQUNBLFVBQUEsRUFBQSxHQUFBO0FBQ0EsYUFBQSxFQUFBLGtDQUFBO0FBQ0EsWUFBQSxFQUFBLG1CQUFBO0VBQ0EsQ0FBQTtDQUNBLENBQUEsQ0FBQTtBQ1JBLFlBQUEsQ0FBQTs7QUFFQSxHQUFBLENBQUEsU0FBQSxDQUFBLGFBQUEsRUFBQSxZQUFBO0FBQ0EsUUFBQTtBQUNBLE9BQUEsRUFBQTtBQUNBLGVBQUEsRUFBQSxHQUFBO0dBQ0E7QUFDQSxVQUFBLEVBQUEsR0FBQTtBQUNBLGFBQUEsRUFBQSw4Q0FBQTtFQUNBLENBQUE7Q0FDQSxDQUFBLENBQUE7QUNWQSxZQUFBLENBQUE7O0FBRUEsR0FBQSxDQUFBLFVBQUEsQ0FBQSxxQkFBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLGFBQUEsRUFBQTs7QUFFQSxPQUFBLENBQUEsUUFBQSxHQUFBLGFBQUEsQ0FBQSxXQUFBLEVBQUEsQ0FBQTtDQUdBLENBQUEsQ0FBQTtBQ1BBLFlBQUEsQ0FBQTs7QUFFQSxHQUFBLENBQUEsU0FBQSxDQUFBLFdBQUEsRUFBQSxZQUFBO0FBQ0EsUUFBQTtBQUNBLFVBQUEsRUFBQSxHQUFBO0FBQ0EsU0FBQSxFQUFBLElBQUE7QUFDQSxhQUFBLEVBQUEsd0NBQUE7QUFDQSxNQUFBLEVBQUEsY0FBQSxLQUFBLEVBQUEsT0FBQSxFQUFBLElBQUEsRUFBQSxFQUlBO0VBQ0EsQ0FBQTtDQU9BLENBQUEsQ0FBQTtBQ25CQSxZQUFBLENBQUE7O0FBSUEsR0FBQSxDQUFBLE9BQUEsQ0FBQSxXQUFBLEVBQUEsWUFBQTs7QUFFQSxLQUFBLElBQUEsR0FBQSxTQUFBLElBQUEsR0FBQSxFQUFBLENBQUE7Q0FJQSxDQUFBLENBQUE7QUNWQSxZQUFBLENBQUE7O0FBRUEsR0FBQSxDQUFBLFNBQUEsQ0FBQSxXQUFBLEVBQUEsWUFBQTtBQUNBLFFBQUE7QUFDQSxVQUFBLEVBQUEsR0FBQTtBQUNBLGFBQUEsRUFBQSx3Q0FBQTtFQUNBLENBQUE7Q0FDQSxDQUFBLENBQUE7O0FDUEEsWUFBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxVQUFBLENBQUEsbUJBQUEsRUFBQSxVQUFBLE1BQUEsRUFBQSxNQUFBLEVBQUEsS0FBQSxFQUFBOztBQUVBLE9BQUEsQ0FBQSxXQUFBLEdBQUEsWUFBQTtBQUNBLFNBQUEsQ0FBQSxHQUFBLENBQUEsTUFBQSxDQUFBLE1BQUEsQ0FBQSxDQUFBO0FBQ0EsT0FBQSxDQUFBLFdBQUEsRUFBQSxDQUFBO0VBQ0EsQ0FBQTs7QUFFQSxPQUFBLENBQUEsTUFBQSxHQUFBLE1BQUEsQ0FBQTtDQUVBLENBQUEsQ0FBQTtBQ1hBLFlBQUEsQ0FBQTs7QUFFQSxHQUFBLENBQUEsTUFBQSxDQUFBLFVBQUEsY0FBQSxFQUFBOztBQUVBLGVBQUEsQ0FBQSxLQUFBLENBQUEsU0FBQSxFQUFBO0FBQ0EsS0FBQSxFQUFBLEdBQUE7QUFDQSxhQUFBLEVBQUEsaUNBQUE7QUFDQSxZQUFBLEVBQUEsbUJBQUE7QUFDQSxTQUFBLEVBQUE7QUFDQSxTQUFBLEVBQUEsZ0JBQUEsS0FBQSxFQUFBO0FBQ0EsV0FBQSxDQUFBLEdBQUEsQ0FBQSxLQUFBLENBQUEsUUFBQSxFQUFBLENBQUEsQ0FBQTtBQUNBLFdBQUEsS0FBQSxDQUFBLFFBQUEsRUFBQSxDQUFBO0lBQ0E7R0FDQTtFQUNBLENBQUEsQ0FBQTtDQUVBLENBQUEsQ0FBQTtBQ2hCQSxZQUFBLENBQUE7O0FBRUEsR0FBQSxDQUFBLFVBQUEsQ0FBQSxrQkFBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLEtBQUEsRUFBQTs7QUFFQSxPQUFBLENBQUEsS0FBQSxHQUFBLEtBQUEsQ0FBQSxRQUFBLEVBQUEsQ0FBQTs7QUFFQSxPQUFBLENBQUEsTUFBQSxDQUFBLFlBQUE7QUFDQSxTQUFBLEtBQUEsQ0FBQSxXQUFBLEVBQUEsQ0FBQTtFQUNBLEVBQUEsVUFBQSxNQUFBLEVBQUEsTUFBQSxFQUFBO0FBQ0EsUUFBQSxDQUFBLEtBQUEsR0FBQSxLQUFBLENBQUEsUUFBQSxFQUFBLENBQUE7RUFDQSxDQUFBLENBQUE7Q0FFQSxDQUFBLENBQUE7QUNaQSxZQUFBLENBQUE7O0FBRUEsR0FBQSxDQUFBLFNBQUEsQ0FBQSxTQUFBLEVBQUEsWUFBQTtBQUNBLFFBQUE7QUFDQSxVQUFBLEVBQUEsR0FBQTtBQUNBLE9BQUEsRUFBQTtBQUNBLFFBQUEsRUFBQSxlQUFBO0dBQ0E7QUFDQSxZQUFBLEVBQUEsa0JBQUE7QUFDQSxNQUFBLEVBQUEsY0FBQSxLQUFBLEVBQUEsT0FBQSxFQUFBLElBQUEsRUFBQTs7O0FBR0EsUUFBQSxDQUFBLFdBQUEsR0FBQSxDQUFBLENBQUEsZUFBQSxDQUFBLENBQUE7QUFDQSxPQUFBLGdCQUFBLEdBQUEsS0FBQSxDQUFBLFdBQUEsQ0FBQSxLQUFBLEVBQUEsQ0FBQTtBQUNBLE9BQUEsaUJBQUEsR0FBQSxLQUFBLENBQUEsV0FBQSxDQUFBLE1BQUEsRUFBQSxDQUFBO0FBQ0EsT0FBQSx5QkFBQSxHQUFBLGdCQUFBLEdBQUEsSUFBQSxDQUFBOzs7QUFHQSxPQUFBLE1BQUEsQ0FBQTtBQUNBLFFBQUEsQ0FBQSxNQUFBLEdBQUEsTUFBQSxDQUFBO0FBQ0EsT0FBQSxLQUFBLENBQUE7QUFDQSxRQUFBLENBQUEsS0FBQSxHQUFBLEtBQUEsQ0FBQTtBQUNBLE9BQUEsUUFBQSxDQUFBO0FBQ0EsUUFBQSxDQUFBLFFBQUEsR0FBQSxRQUFBLENBQUE7QUFDQSxPQUFBLFFBQUEsQ0FBQTtBQUNBLFFBQUEsQ0FBQSxRQUFBLEdBQUEsUUFBQSxDQUFBOzs7QUFHQSxPQUFBLEVBQUEsQ0FBQTs7O0FBR0EsT0FBQSxPQUFBLEdBQUEsSUFBQSxLQUFBLENBQUEsWUFBQSxFQUFBLENBQUE7QUFDQSxPQUFBLE9BQUEsR0FBQSxJQUFBLEtBQUEsQ0FBQSxVQUFBLEVBQUEsQ0FBQTs7O0FBR0EsUUFBQSxDQUFBLE1BQUEsQ0FBQSxvQkFBQSxFQUFBLFVBQUEsUUFBQSxFQUFBLFFBQUEsRUFBQTtBQUNBLFFBQUEsUUFBQSxJQUFBLFFBQUEsRUFBQTtBQUNBLGNBQUEsQ0FBQSxRQUFBLENBQUEsQ0FBQTtLQUNBO0lBQ0EsQ0FBQSxDQUFBOzs7QUFHQSxZQUFBLFNBQUEsQ0FBQSxNQUFBLEVBQUE7QUFDQSxXQUFBLENBQUEsSUFBQSxDQUFBLE1BQUEsRUFBQSxVQUFBLE1BQUEsRUFBQTtBQUNBLFdBQUEsQ0FBQSxLQUFBLENBQUEsQ0FBQSxHQUFBLE1BQUEsQ0FBQSxLQUFBLENBQUEsQ0FBQSxHQUFBLE1BQUEsQ0FBQSxLQUFBLENBQUEsQ0FBQSxHQUFBLElBQUEsR0FBQSx5QkFBQSxDQUFBO0FBQ0EsV0FBQSxDQUFBLFFBQUEsQ0FBQSxDQUFBLEdBQUEsRUFBQSxDQUFBO0FBQ0EsV0FBQSxDQUFBLFlBQUEsRUFBQSxDQUFBO0FBQ0EsU0FBQSxRQUFBLEVBQUEsS0FBQSxDQUFBLE1BQUEsQ0FBQSxRQUFBLENBQUEsQ0FBQTtBQUNBLFVBQUEsQ0FBQSxHQUFBLENBQUEsTUFBQSxDQUFBLENBQUE7O0FBRUEsYUFBQSxHQUFBLE1BQUEsQ0FBQTtLQUNBLENBQUEsQ0FBQTtJQUNBOzs7QUFHQSxZQUFBLENBQUEsS0FBQSxDQUFBLEtBQUEsQ0FBQSxZQUFBLENBQUEsQ0FBQTtBQUNBLFVBQUEsRUFBQSxDQUFBOzs7QUFHQSxZQUFBLElBQUEsR0FBQTs7O0FBR0EsVUFBQSxHQUFBLElBQUEsS0FBQSxDQUFBLGlCQUFBLENBQUEsRUFBQSxFQUFBLGdCQUFBLEdBQUEsaUJBQUEsRUFBQSxDQUFBLEVBQUEsSUFBQSxDQUFBLENBQUE7QUFDQSxVQUFBLENBQUEsUUFBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBLEVBQUEsQ0FBQSxFQUFBLENBQUEsQ0FBQSxDQUFBOzs7QUFHQSxTQUFBLEdBQUEsSUFBQSxLQUFBLENBQUEsS0FBQSxFQUFBLENBQUE7Ozs7QUFJQSxTQUFBLENBQUEsR0FBQSxDQUFBLElBQUEsS0FBQSxDQUFBLFlBQUEsQ0FBQSxRQUFBLENBQUEsQ0FBQSxDQUFBOztBQUVBLFFBQUEsZ0JBQUEsR0FBQSxJQUFBLEtBQUEsQ0FBQSxnQkFBQSxDQUFBLFFBQUEsQ0FBQSxDQUFBO0FBQ0Esb0JBQUEsQ0FBQSxRQUFBLENBQUEsQ0FBQSxHQUFBLElBQUEsQ0FBQSxNQUFBLEVBQUEsR0FBQSxHQUFBLENBQUE7QUFDQSxvQkFBQSxDQUFBLFFBQUEsQ0FBQSxDQUFBLEdBQUEsSUFBQSxDQUFBLE1BQUEsRUFBQSxHQUFBLEdBQUEsQ0FBQTtBQUNBLG9CQUFBLENBQUEsUUFBQSxDQUFBLENBQUEsR0FBQSxJQUFBLENBQUEsTUFBQSxFQUFBLEdBQUEsR0FBQSxDQUFBO0FBQ0Esb0JBQUEsQ0FBQSxRQUFBLENBQUEsU0FBQSxFQUFBLENBQUE7QUFDQSxTQUFBLENBQUEsR0FBQSxDQUFBLGdCQUFBLENBQUEsQ0FBQTs7O0FBR0EsWUFBQSxHQUFBLElBQUEsS0FBQSxDQUFBLGFBQUEsQ0FBQSxFQUFBLFNBQUEsRUFBQSxJQUFBLEVBQUEsQ0FBQSxDQUFBO0FBQ0EsWUFBQSxDQUFBLE9BQUEsQ0FBQSxnQkFBQSxFQUFBLGlCQUFBLENBQUEsQ0FBQTtBQUNBLFlBQUEsQ0FBQSxhQUFBLENBQUEsUUFBQSxDQUFBLENBQUE7QUFDQSxXQUFBLENBQUEsQ0FBQSxDQUFBLENBQUEsV0FBQSxDQUFBLFFBQUEsQ0FBQSxVQUFBLENBQUEsQ0FBQTs7O0FBR0EsVUFBQSxDQUFBLGdCQUFBLENBQUEsUUFBQSxFQUFBLGNBQUEsRUFBQSxLQUFBLENBQUEsQ0FBQTs7O0lBR0E7OztBQUdBLFlBQUEsY0FBQSxDQUFBLEtBQUEsRUFBQTtBQUNBLFlBQUEsQ0FBQSxPQUFBLENBQUEsS0FBQSxDQUFBLFdBQUEsQ0FBQSxLQUFBLEVBQUEsRUFBQSxpQkFBQSxDQUFBLENBQUE7QUFDQSxVQUFBLENBQUEsTUFBQSxHQUFBLEtBQUEsQ0FBQSxXQUFBLENBQUEsS0FBQSxFQUFBLEdBQUEsaUJBQUEsQ0FBQTtBQUNBLFVBQUEsQ0FBQSxzQkFBQSxFQUFBLENBQUE7SUFDQTs7O0FBR0EsT0FBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBO0FBQ0EsWUFBQSxPQUFBLEdBQUE7QUFDQSxVQUFBLEVBQUEsQ0FBQTtBQUNBLHlCQUFBLENBQUEsT0FBQSxDQUFBLENBQUE7SUFDQTs7O0FBR0EsWUFBQSxNQUFBLEdBQUE7QUFDQSxRQUFBLEtBQUEsR0FBQSxJQUFBLENBQUEsR0FBQSxFQUFBLEdBQUEsT0FBQSxDQUFBO0FBQ0EsVUFBQSxDQUFBLFFBQUEsQ0FBQSxDQUFBLEdBQUEsSUFBQSxDQUFBLEdBQUEsQ0FBQSxLQUFBLENBQUEsR0FBQSxFQUFBLENBQUE7QUFDQSxVQUFBLENBQUEsUUFBQSxDQUFBLENBQUEsR0FBQSxDQUFBLENBQUE7QUFDQSxVQUFBLENBQUEsUUFBQSxDQUFBLENBQUEsR0FBQSxJQUFBLENBQUEsR0FBQSxDQUFBLEtBQUEsQ0FBQSxHQUFBLEdBQUEsQ0FBQTtBQUNBLFVBQUEsQ0FBQSxNQUFBLENBQUEsS0FBQSxDQUFBLFFBQUEsQ0FBQSxDQUFBO0FBQ0EsWUFBQSxDQUFBLE1BQUEsQ0FBQSxLQUFBLEVBQUEsTUFBQSxDQUFBLENBQUE7SUFDQTtHQUNBO0VBQ0EsQ0FBQTtDQUNBLENBQUEsQ0FBQSIsImZpbGUiOiJtYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xudmFyIGFwcCA9IGFuZ3VsYXIubW9kdWxlKCdGdWxsc3RhY2tHZW5lcmF0ZWRBcHAnLCBbJ3VpLnJvdXRlcicsICdmc2FQcmVCdWlsdCddKTtcblxuYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHVybFJvdXRlclByb3ZpZGVyLCAkbG9jYXRpb25Qcm92aWRlcikge1xuICAgIC8vIFRoaXMgdHVybnMgb2ZmIGhhc2hiYW5nIHVybHMgKC8jYWJvdXQpIGFuZCBjaGFuZ2VzIGl0IHRvIHNvbWV0aGluZyBub3JtYWwgKC9hYm91dClcbiAgICAkbG9jYXRpb25Qcm92aWRlci5odG1sNU1vZGUodHJ1ZSk7XG4gICAgLy8gSWYgd2UgZ28gdG8gYSBVUkwgdGhhdCB1aS1yb3V0ZXIgZG9lc24ndCBoYXZlIHJlZ2lzdGVyZWQsIGdvIHRvIHRoZSBcIi9cIiB1cmwuXG4gICAgJHVybFJvdXRlclByb3ZpZGVyLm90aGVyd2lzZSgnLycpO1xuICAgICR1cmxSb3V0ZXJQcm92aWRlci53aGVuKCcvYXV0aC86cHJvdmlkZXInLCBmdW5jdGlvbiAoKSB7XG4gICAgXHR3aW5kb3cubG9jYXRpb24ucmVsb2FkKCk7XG5cdH0pO1xuXG59KTtcblxuLy8gVGhpcyBhcHAucnVuIGlzIGZvciBjb250cm9sbGluZyBhY2Nlc3MgdG8gc3BlY2lmaWMgc3RhdGVzLlxuYXBwLnJ1bihmdW5jdGlvbiAoJHJvb3RTY29wZSwgQXV0aFNlcnZpY2UsICRzdGF0ZSkge1xuXG4gICAgLy8gVGhlIGdpdmVuIHN0YXRlIHJlcXVpcmVzIGFuIGF1dGhlbnRpY2F0ZWQgdXNlci5cbiAgICB2YXIgZGVzdGluYXRpb25TdGF0ZVJlcXVpcmVzQXV0aCA9IGZ1bmN0aW9uIChzdGF0ZSkge1xuICAgICAgICByZXR1cm4gc3RhdGUuZGF0YSAmJiBzdGF0ZS5kYXRhLmF1dGhlbnRpY2F0ZTtcbiAgICB9O1xuXG4gICAgLy8gJHN0YXRlQ2hhbmdlU3RhcnQgaXMgYW4gZXZlbnQgZmlyZWRcbiAgICAvLyB3aGVuZXZlciB0aGUgcHJvY2VzcyBvZiBjaGFuZ2luZyBhIHN0YXRlIGJlZ2lucy5cbiAgICAkcm9vdFNjb3BlLiRvbignJHN0YXRlQ2hhbmdlU3RhcnQnLCBmdW5jdGlvbiAoZXZlbnQsIHRvU3RhdGUpIHtcblxuICAgICAgICBpZiAoIWRlc3RpbmF0aW9uU3RhdGVSZXF1aXJlc0F1dGgodG9TdGF0ZSkpIHtcbiAgICAgICAgICAgIC8vIFRoZSBkZXN0aW5hdGlvbiBzdGF0ZSBkb2VzIG5vdCByZXF1aXJlIGF1dGhlbnRpY2F0aW9uXG4gICAgICAgICAgICAvLyBTaG9ydCBjaXJjdWl0IHdpdGggcmV0dXJuLlxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKEF1dGhTZXJ2aWNlLmlzQXV0aGVudGljYXRlZCgpKSB7XG4gICAgICAgICAgICAvLyBUaGUgdXNlciBpcyBhdXRoZW50aWNhdGVkLlxuICAgICAgICAgICAgLy8gU2hvcnQgY2lyY3VpdCB3aXRoIHJldHVybi5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENhbmNlbCBuYXZpZ2F0aW5nIHRvIG5ldyBzdGF0ZS5cbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKS50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICAgICAgICAvLyBJZiBhIHVzZXIgaXMgcmV0cmlldmVkLCB0aGVuIHJlbmF2aWdhdGUgdG8gdGhlIGRlc3RpbmF0aW9uXG4gICAgICAgICAgICAvLyAodGhlIHNlY29uZCB0aW1lLCBBdXRoU2VydmljZS5pc0F1dGhlbnRpY2F0ZWQoKSB3aWxsIHdvcmspXG4gICAgICAgICAgICAvLyBvdGhlcndpc2UsIGlmIG5vIHVzZXIgaXMgbG9nZ2VkIGluLCBnbyB0byBcImxvZ2luXCIgc3RhdGUuXG4gICAgICAgICAgICB2YXIgZGVzdGluYXRpb24gPSB1c2VyID8gdG9TdGF0ZS5uYW1lIDogJ2xvZ2luJztcbiAgICAgICAgICAgICRzdGF0ZS5nbyhkZXN0aW5hdGlvbik7XG4gICAgICAgIH0pO1xuXG4gICAgfSk7XG5cbn0pOyIsIihmdW5jdGlvbiAoKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICAvLyBIb3BlIHlvdSBkaWRuJ3QgZm9yZ2V0IEFuZ3VsYXIhIER1aC1kb3kuXG4gICAgaWYgKCF3aW5kb3cuYW5ndWxhcikgdGhyb3cgbmV3IEVycm9yKCdJIGNhblxcJ3QgZmluZCBBbmd1bGFyIScpO1xuXG4gICAgdmFyIGFwcCA9IGFuZ3VsYXIubW9kdWxlKCdmc2FQcmVCdWlsdCcsIFtdKTtcblxuICAgIGFwcC5mYWN0b3J5KCdTb2NrZXQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICghd2luZG93LmlvKSB0aHJvdyBuZXcgRXJyb3IoJ3NvY2tldC5pbyBub3QgZm91bmQhJyk7XG4gICAgICAgIHJldHVybiB3aW5kb3cuaW8od2luZG93LmxvY2F0aW9uLm9yaWdpbik7XG4gICAgfSk7XG5cbiAgICAvLyBBVVRIX0VWRU5UUyBpcyB1c2VkIHRocm91Z2hvdXQgb3VyIGFwcCB0b1xuICAgIC8vIGJyb2FkY2FzdCBhbmQgbGlzdGVuIGZyb20gYW5kIHRvIHRoZSAkcm9vdFNjb3BlXG4gICAgLy8gZm9yIGltcG9ydGFudCBldmVudHMgYWJvdXQgYXV0aGVudGljYXRpb24gZmxvdy5cbiAgICBhcHAuY29uc3RhbnQoJ0FVVEhfRVZFTlRTJywge1xuICAgICAgICBsb2dpblN1Y2Nlc3M6ICdhdXRoLWxvZ2luLXN1Y2Nlc3MnLFxuICAgICAgICBsb2dpbkZhaWxlZDogJ2F1dGgtbG9naW4tZmFpbGVkJyxcbiAgICAgICAgbG9nb3V0U3VjY2VzczogJ2F1dGgtbG9nb3V0LXN1Y2Nlc3MnLFxuICAgICAgICBzZXNzaW9uVGltZW91dDogJ2F1dGgtc2Vzc2lvbi10aW1lb3V0JyxcbiAgICAgICAgbm90QXV0aGVudGljYXRlZDogJ2F1dGgtbm90LWF1dGhlbnRpY2F0ZWQnLFxuICAgICAgICBub3RBdXRob3JpemVkOiAnYXV0aC1ub3QtYXV0aG9yaXplZCdcbiAgICB9KTtcblxuICAgIGFwcC5mYWN0b3J5KCdBdXRoSW50ZXJjZXB0b3InLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgJHEsIEFVVEhfRVZFTlRTKSB7XG4gICAgICAgIHZhciBzdGF0dXNEaWN0ID0ge1xuICAgICAgICAgICAgNDAxOiBBVVRIX0VWRU5UUy5ub3RBdXRoZW50aWNhdGVkLFxuICAgICAgICAgICAgNDAzOiBBVVRIX0VWRU5UUy5ub3RBdXRob3JpemVkLFxuICAgICAgICAgICAgNDE5OiBBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCxcbiAgICAgICAgICAgIDQ0MDogQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXRcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3BvbnNlRXJyb3I6IGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChzdGF0dXNEaWN0W3Jlc3BvbnNlLnN0YXR1c10sIHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gJHEucmVqZWN0KHJlc3BvbnNlKVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH0pO1xuXG4gICAgYXBwLmNvbmZpZyhmdW5jdGlvbiAoJGh0dHBQcm92aWRlcikge1xuICAgICAgICAkaHR0cFByb3ZpZGVyLmludGVyY2VwdG9ycy5wdXNoKFtcbiAgICAgICAgICAgICckaW5qZWN0b3InLFxuICAgICAgICAgICAgZnVuY3Rpb24gKCRpbmplY3Rvcikge1xuICAgICAgICAgICAgICAgIHJldHVybiAkaW5qZWN0b3IuZ2V0KCdBdXRoSW50ZXJjZXB0b3InKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgXSk7XG4gICAgfSk7XG5cbiAgICBhcHAuc2VydmljZSgnQXV0aFNlcnZpY2UnLCBmdW5jdGlvbiAoJGh0dHAsIFNlc3Npb24sICRyb290U2NvcGUsIEFVVEhfRVZFTlRTLCAkcSkge1xuXG4gICAgICAgIGZ1bmN0aW9uIG9uU3VjY2Vzc2Z1bExvZ2luKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICB2YXIgZGF0YSA9IHJlc3BvbnNlLmRhdGE7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcImxvZ2dlZCBpblwiKVxuICAgICAgICAgICAgU2Vzc2lvbi5jcmVhdGUoZGF0YS5pZCwgZGF0YS51c2VyKTtcbiAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChBVVRIX0VWRU5UUy5sb2dpblN1Y2Nlc3MpO1xuICAgICAgICAgICAgcmV0dXJuIGRhdGEudXNlcjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFVzZXMgdGhlIHNlc3Npb24gZmFjdG9yeSB0byBzZWUgaWYgYW5cbiAgICAgICAgLy8gYXV0aGVudGljYXRlZCB1c2VyIGlzIGN1cnJlbnRseSByZWdpc3RlcmVkLlxuICAgICAgICB0aGlzLmlzQXV0aGVudGljYXRlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAhIVNlc3Npb24udXNlcjtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmdldExvZ2dlZEluVXNlciA9IGZ1bmN0aW9uIChmcm9tU2VydmVyKSB7XG5cbiAgICAgICAgICAgIC8vIElmIGFuIGF1dGhlbnRpY2F0ZWQgc2Vzc2lvbiBleGlzdHMsIHdlXG4gICAgICAgICAgICAvLyByZXR1cm4gdGhlIHVzZXIgYXR0YWNoZWQgdG8gdGhhdCBzZXNzaW9uXG4gICAgICAgICAgICAvLyB3aXRoIGEgcHJvbWlzZS4gVGhpcyBlbnN1cmVzIHRoYXQgd2UgY2FuXG4gICAgICAgICAgICAvLyBhbHdheXMgaW50ZXJmYWNlIHdpdGggdGhpcyBtZXRob2QgYXN5bmNocm9ub3VzbHkuXG5cbiAgICAgICAgICAgIC8vIE9wdGlvbmFsbHksIGlmIHRydWUgaXMgZ2l2ZW4gYXMgdGhlIGZyb21TZXJ2ZXIgcGFyYW1ldGVyLFxuICAgICAgICAgICAgLy8gdGhlbiB0aGlzIGNhY2hlZCB2YWx1ZSB3aWxsIG5vdCBiZSB1c2VkLlxuXG4gICAgICAgICAgICBpZiAodGhpcy5pc0F1dGhlbnRpY2F0ZWQoKSAmJiBmcm9tU2VydmVyICE9PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRxLndoZW4oU2Vzc2lvbi51c2VyKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gTWFrZSByZXF1ZXN0IEdFVCAvc2Vzc2lvbi5cbiAgICAgICAgICAgIC8vIElmIGl0IHJldHVybnMgYSB1c2VyLCBjYWxsIG9uU3VjY2Vzc2Z1bExvZ2luIHdpdGggdGhlIHJlc3BvbnNlLlxuICAgICAgICAgICAgLy8gSWYgaXQgcmV0dXJucyBhIDQwMSByZXNwb25zZSwgd2UgY2F0Y2ggaXQgYW5kIGluc3RlYWQgcmVzb2x2ZSB0byBudWxsLlxuICAgICAgICAgICAgcmV0dXJuICRodHRwLmdldCgnL3Nlc3Npb24nKS50aGVuKG9uU3VjY2Vzc2Z1bExvZ2luKS5jYXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMubG9naW4gPSBmdW5jdGlvbiAoY3JlZGVudGlhbHMpIHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5wb3N0KCcvbG9naW4nLCBjcmVkZW50aWFscylcbiAgICAgICAgICAgICAgICAudGhlbihvblN1Y2Nlc3NmdWxMb2dpbilcbiAgICAgICAgICAgICAgICAuY2F0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJHEucmVqZWN0KHsgbWVzc2FnZTogJ0ludmFsaWQgbG9naW4gY3JlZGVudGlhbHMuJyB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmxvZ291dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9sb2dvdXQnKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBTZXNzaW9uLmRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoQVVUSF9FVkVOVFMubG9nb3V0U3VjY2Vzcyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgIH0pO1xuXG4gICAgYXBwLnNlcnZpY2UoJ1Nlc3Npb24nLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgQVVUSF9FVkVOVFMpIHtcblxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMubm90QXV0aGVudGljYXRlZCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc2VsZi5kZXN0cm95KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzZWxmLmRlc3Ryb3koKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5pZCA9IG51bGw7XG4gICAgICAgIHRoaXMudXNlciA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5jcmVhdGUgPSBmdW5jdGlvbiAoc2Vzc2lvbklkLCB1c2VyKSB7XG4gICAgICAgICAgICB0aGlzLmlkID0gc2Vzc2lvbklkO1xuICAgICAgICAgICAgdGhpcy51c2VyID0gdXNlcjtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLmlkID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMudXNlciA9IG51bGw7XG4gICAgICAgIH07XG5cbiAgICB9KTtcblxufSkoKTtcbiIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnbG9naW4nLCB7XG4gICAgICAgIHVybDogJy9sb2dpbicsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvbG9naW4vbG9naW4uaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdMb2dpbkN0cmwnXG4gICAgfSk7XG5cbn0pO1xuXG5hcHAuY29udHJvbGxlcignTG9naW5DdHJsJywgZnVuY3Rpb24gKCRzY29wZSwgQXV0aFNlcnZpY2UsICRzdGF0ZSkge1xuXG4gICAgJHNjb3BlLmxvZ2luID0ge307XG4gICAgJHNjb3BlLmVycm9yID0gbnVsbDtcblxuICAgICRzY29wZS5zZW5kTG9naW4gPSBmdW5jdGlvbiAobG9naW5JbmZvKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiaGl0IGNvbnRyb2xsZXJcIilcbiAgICAgICAgJHNjb3BlLmVycm9yID0gbnVsbDtcblxuICAgICAgICBBdXRoU2VydmljZS5sb2dpbihsb2dpbkluZm8pLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHN0YXRlLmdvKCdob21lJyk7XG4gICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5lcnJvciA9ICdJbnZhbGlkIGxvZ2luIGNyZWRlbnRpYWxzLic7XG4gICAgICAgIH0pO1xuXG4gICAgfTtcblxufSk7IiwiJ3VzZSBzdHJpY3QnO1xuXG5hcHAuY29udHJvbGxlcignTWFuYWdlckNvbnRyb2xsZXInLCBmdW5jdGlvbigkc2NvcGUsICR0aW1lb3V0KXtcblxuXHQvLyBOYXZiYXJcblx0JHNjb3BlLm5hdmJhckV4cGFuZCA9IGZhbHNlO1xuXHRcblx0Ly8gQ29sbGVjdGlvbiBQYW5lbFxuXHQkc2NvcGUuY29sbGVjdGlvbk9wZW4gPSBmYWxzZTtcblx0JHNjb3BlLmNvbGxlY3Rpb25Ub2dnbGUgPSBmdW5jdGlvbigpe1xuXHRcdGlmICghJHNjb3BlLmNvbGxlY3Rpb25PcGVuKSAkc2NvcGUuY29sbGVjdGlvbk9wZW4gPSB0cnVlO1xuXHRcdGVsc2Uge1xuXHRcdFx0JHNjb3BlLmNvbGxlY3Rpb25PcGVuID0gZmFsc2U7XG5cdFx0fVxuXHR9XG5cblx0Ly9Db2xsYXBzZSBBbGxcblx0JHNjb3BlLmNvbGxhcHNlVG9wID0gZnVuY3Rpb24oKXtcblx0XHQkc2NvcGUuY29sbGVjdGlvbk9wZW4gPSBmYWxzZTtcblx0XHQkdGltZW91dChmdW5jdGlvbigpe1xuXHRcdFx0JHNjb3BlLm5hdmJhckV4cGFuZCA9IGZhbHNlO1xuXHRcdH0sIDIwMCk7XG5cdH1cblxuXHQvLyBBY3R1YWwgY29sbGVjdGlvblxuXHQkc2NvcGUuY29sbGVjdGlvbiA9IFtdXG5cbn0pOyIsIid1c2Ugc3RyaWN0JztcblxuYXBwLmZhY3RvcnkoJ01vZGVsJywgZnVuY3Rpb24oJGh0dHApe1xuXG5cdC8vIEN1cnJlbnRseSBSZW5kZXJlZCBPYmplY3Rcblx0dmFyIHJlbmRlck9iaiA9IHtcblx0XHRtb2RlbEZpbGVVcmw6ICdtb2RlbHMvdW50aXRsZWQtc2NlbmUvdW50aXRsZWQtc2NlbmUuanNvbicsXG5cdFx0Y3JlYXRvcjogJ01hcnkgQW5uZSdcblx0fTtcblxuXG5cdC8vIE1vZGVsIENvbnN0cnVjdG9yXG5cdGZ1bmN0aW9uIE1vZGVsIChwcm9wcykge1xuXHRcdGFuZ3VsYXIuZXh0ZW5kKHRoaXMsIHByb3BzKTtcblx0fTtcblxuXHRNb2RlbC51cmwgPSAnYXBpL3Byb2R1Y3QnXG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShNb2RlbC5wcm90b3R5cGUsICd1cmwnLCB7XG5cdFx0Z2V0OiBmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gTW9kZWwudXJsICsgdGhpcy5faWQ7XG5cdFx0fVxuXHR9KTtcblxuXG5cdC8vIExpc3RpbmcgRnVuY3Rpb25hbGl0eVxuXHRNb2RlbC5wcm90b3R5cGUuZmV0Y2ggPSBmdW5jdGlvbigpe1xuXHRcdHJldHVybiAkaHR0cC5nZXQodGhpcy51cmwpLnRoZW4oZnVuY3Rpb24gKHJlcykge1xuXHRcdFx0cmV0dXJuIG5ldyBNb2RlbChyZXMuZGF0YSk7XG5cdFx0fSk7XG5cdH1cblxuXHRNb2RlbC5mZXRjaEFsbCA9IGZ1bmN0aW9uKCl7XG5cdFx0Ly8gcmV0dXJuICRodHBwLmdldChNb2RlbC51cmwpLnRoZW4oZnVuY3Rpb24gKGRhdGEpIHtcblx0XHQvLyBcdHJldHVybiByZXMuZGF0YS5tYXAoZnVuY3Rpb24gKG9iaikge1xuXHRcdC8vIFx0XHRyZXR1cm4gbmV3IE1vZGVsKG9iaik7XG5cdFx0Ly8gXHR9KTtcblx0XHQvLyB9KTtcblx0XHRjb25zb2xlLmxvZygpO1xuXHRcdHJldHVybiBbXG5cdFx0e1xuXHRcdFx0X2lkOiAxMjQyNCxcblx0XHRcdHRpdGxlOiAnRmxvYXRpbmcgSXNsYW5kJyxcblx0XHRcdHNuYXBzaG90RmlsZVVybDogJy9pbWFnZXMvc25hcHNob3RzL2Zsb2F0aW5nSXNsYW5kLnBuZycsXG5cdFx0XHRtb2RlbEZpbGVVcmw6ICdtb2RlbHMvdW50aXRsZWQtc2NlbmUvdW50aXRsZWQtc2NlbmUuanNvbicsXG5cdFx0XHRjcmVhdG9yOiAnTWFyeSBBbm5lJyxcblx0XHRcdHRhZ3M6IFsnRW52aXJvbm1lbnQnLCdMb3ctUG9seSddXG5cdFx0fSwgXG5cdFx0e1xuXHRcdFx0X2lkOiAxMjM2Mixcblx0XHRcdHRpdGxlOiAnQmF5bWF4Jyxcblx0XHRcdHNuYXBzaG90RmlsZVVybDogJy9pbWFnZXMvc25hcHNob3RzL2JheW1heC5wbmcnLFxuXHRcdFx0bW9kZWxGaWxlVXJsOiAnbW9kZWxzL2JheW1heC5qc29uJyxcblx0XHRcdGNyZWF0b3I6ICdNaWx0b24gR2xhc2VyJyxcblx0XHRcdHRhZ3M6IFsnQ2hhcmFjdGVyJywnRnV0dXJpc3RpYyddXG5cdFx0fSxcblx0XHR7XG5cdFx0XHRfaWQ6IDEyNDI0LFxuXHRcdFx0dGl0bGU6ICdGbG9hdGluZyBJc2xhbmQnLFxuXHRcdFx0c25hcHNob3RGaWxlVXJsOiAnL2ltYWdlcy9zbmFwc2hvdHMvZmxvYXRpbmdJc2xhbmQucG5nJyxcblx0XHRcdG1vZGVsRmlsZVVybDogJ21vZGVscy91bnRpdGxlZC1zY2VuZS91bnRpdGxlZC1zY2VuZS5qc29uJyxcblx0XHRcdGNyZWF0b3I6ICdNYXJ5IEFubmUnLFxuXHRcdFx0dGFnczogWydFbnZpcm9ubWVudCcsJ0xvdy1Qb2x5J11cblx0XHR9LCBcblx0XHR7XG5cdFx0XHRfaWQ6IDEyMzYyLFxuXHRcdFx0dGl0bGU6ICdCYXltYXgnLFxuXHRcdFx0c25hcHNob3RGaWxlVXJsOiAnL2ltYWdlcy9zbmFwc2hvdHMvYmF5bWF4LnBuZycsXG5cdFx0XHRtb2RlbEZpbGVVcmw6ICdtb2RlbHMvYmF5bWF4Lmpzb24nLFxuXHRcdFx0Y3JlYXRvcjogJ01pbHRvbiBHbGFzZXInLFxuXHRcdFx0dGFnczogWydDaGFyYWN0ZXInLCdGdXR1cmlzdGljJ11cblx0XHR9LFxuXHRcdHtcblx0XHRcdF9pZDogMTI0MjQsXG5cdFx0XHR0aXRsZTogJ0Zsb2F0aW5nIElzbGFuZCcsXG5cdFx0XHRzbmFwc2hvdEZpbGVVcmw6ICcvaW1hZ2VzL3NuYXBzaG90cy9mbG9hdGluZ0lzbGFuZC5wbmcnLFxuXHRcdFx0bW9kZWxGaWxlVXJsOiAnbW9kZWxzL3VudGl0bGVkLXNjZW5lL3VudGl0bGVkLXNjZW5lLmpzb24nLFxuXHRcdFx0Y3JlYXRvcjogJ01hcnkgQW5uZScsXG5cdFx0XHR0YWdzOiBbJ0Vudmlyb25tZW50JywnTG93LVBvbHknXVxuXHRcdH0sIFxuXHRcdHtcblx0XHRcdF9pZDogMTIzNjIsXG5cdFx0XHR0aXRsZTogJ0JheW1heCcsXG5cdFx0XHRzbmFwc2hvdEZpbGVVcmw6ICcvaW1hZ2VzL3NuYXBzaG90cy9iYXltYXgucG5nJyxcblx0XHRcdG1vZGVsRmlsZVVybDogJ21vZGVscy9iYXltYXguanNvbicsXG5cdFx0XHRjcmVhdG9yOiAnTWlsdG9uIEdsYXNlcicsXG5cdFx0XHR0YWdzOiBbJ0NoYXJhY3RlcicsJ0Z1dHVyaXN0aWMnXVxuXHRcdH0sIFxuXHRcdHtcblx0XHRcdF9pZDogMTIzNjIsXG5cdFx0XHR0aXRsZTogJ0JheW1heCcsXG5cdFx0XHRzbmFwc2hvdEZpbGVVcmw6ICcvaW1hZ2VzL3NuYXBzaG90cy9iYXltYXgucG5nJyxcblx0XHRcdG1vZGVsRmlsZVVybDogJ21vZGVscy9iYXltYXguanNvbicsXG5cdFx0XHRjcmVhdG9yOiAnTWlsdG9uIEdsYXNlcicsXG5cdFx0XHR0YWdzOiBbJ0NoYXJhY3RlcicsJ0Z1dHVyaXN0aWMnXVxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0X2lkOiAxMjQyNCxcblx0XHRcdHRpdGxlOiAnRmxvYXRpbmcgSXNsYW5kJyxcblx0XHRcdHNuYXBzaG90RmlsZVVybDogJy9pbWFnZXMvc25hcHNob3RzL2Zsb2F0aW5nSXNsYW5kLnBuZycsXG5cdFx0XHRtb2RlbEZpbGVVcmw6ICdtb2RlbHMvdW50aXRsZWQtc2NlbmUvdW50aXRsZWQtc2NlbmUuanNvbicsXG5cdFx0XHRjcmVhdG9yOiAnTWFyeSBBbm5lJyxcblx0XHRcdHRhZ3M6IFsnRW52aXJvbm1lbnQnLCdMb3ctUG9seSddXG5cdFx0fSwgXG5cdFx0e1xuXHRcdFx0X2lkOiAxMjM2Mixcblx0XHRcdHRpdGxlOiAnQmF5bWF4Jyxcblx0XHRcdHNuYXBzaG90RmlsZVVybDogJy9pbWFnZXMvc25hcHNob3RzL2JheW1heC5wbmcnLFxuXHRcdFx0bW9kZWxGaWxlVXJsOiAnbW9kZWxzL2JheW1heC5qc29uJyxcblx0XHRcdGNyZWF0b3I6ICdNaWx0b24gR2xhc2VyJyxcblx0XHRcdHRhZ3M6IFsnQ2hhcmFjdGVyJywnRnV0dXJpc3RpYyddXG5cdFx0fSwgXG5cdFx0e1xuXHRcdFx0X2lkOiAxMjM2Mixcblx0XHRcdHRpdGxlOiAnQmF5bWF4Jyxcblx0XHRcdHNuYXBzaG90RmlsZVVybDogJy9pbWFnZXMvc25hcHNob3RzL2JheW1heC5wbmcnLFxuXHRcdFx0bW9kZWxGaWxlVXJsOiAnbW9kZWxzL2JheW1heC5qc29uJyxcblx0XHRcdGNyZWF0b3I6ICdNaWx0b24gR2xhc2VyJyxcblx0XHRcdHRhZ3M6IFsnQ2hhcmFjdGVyJywnRnV0dXJpc3RpYyddXG5cdFx0fSxcblx0XHR7XG5cdFx0XHRfaWQ6IDEyMzYyLFxuXHRcdFx0dGl0bGU6ICdCYXltYXgnLFxuXHRcdFx0c25hcHNob3RGaWxlVXJsOiAnL2ltYWdlcy9zbmFwc2hvdHMvYmF5bWF4LnBuZycsXG5cdFx0XHRtb2RlbEZpbGVVcmw6ICdtb2RlbHMvYmF5bWF4Lmpzb24nLFxuXHRcdFx0Y3JlYXRvcjogJ01pbHRvbiBHbGFzZXInLFxuXHRcdFx0dGFnczogWydDaGFyYWN0ZXInLCdGdXR1cmlzdGljJ11cblx0XHR9LFxuXHRcdHtcblx0XHRcdF9pZDogMTI0MjQsXG5cdFx0XHR0aXRsZTogJ0Zsb2F0aW5nIElzbGFuZCcsXG5cdFx0XHRzbmFwc2hvdEZpbGVVcmw6ICcvaW1hZ2VzL3NuYXBzaG90cy9mbG9hdGluZ0lzbGFuZC5wbmcnLFxuXHRcdFx0bW9kZWxGaWxlVXJsOiAnbW9kZWxzL3VudGl0bGVkLXNjZW5lL3VudGl0bGVkLXNjZW5lLmpzb24nLFxuXHRcdFx0Y3JlYXRvcjogJ01hcnkgQW5uZScsXG5cdFx0XHR0YWdzOiBbJ0Vudmlyb25tZW50JywnTG93LVBvbHknXVxuXHRcdH0sIFxuXHRcdHtcblx0XHRcdF9pZDogMTIzNjIsXG5cdFx0XHR0aXRsZTogJ0JheW1heCcsXG5cdFx0XHRzbmFwc2hvdEZpbGVVcmw6ICcvaW1hZ2VzL3NuYXBzaG90cy9iYXltYXgucG5nJyxcblx0XHRcdG1vZGVsRmlsZVVybDogJ21vZGVscy9iYXltYXguanNvbicsXG5cdFx0XHRjcmVhdG9yOiAnTWlsdG9uIEdsYXNlcicsXG5cdFx0XHR0YWdzOiBbJ0NoYXJhY3RlcicsJ0Z1dHVyaXN0aWMnXVxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0X2lkOiAxMjQyNCxcblx0XHRcdHRpdGxlOiAnRmxvYXRpbmcgSXNsYW5kJyxcblx0XHRcdHNuYXBzaG90RmlsZVVybDogJy9pbWFnZXMvc25hcHNob3RzL2Zsb2F0aW5nSXNsYW5kLnBuZycsXG5cdFx0XHRtb2RlbEZpbGVVcmw6ICdtb2RlbHMvdW50aXRsZWQtc2NlbmUvdW50aXRsZWQtc2NlbmUuanNvbicsXG5cdFx0XHRjcmVhdG9yOiAnTWFyeSBBbm5lJyxcblx0XHRcdHRhZ3M6IFsnRW52aXJvbm1lbnQnLCdMb3ctUG9seSddXG5cdFx0fSwgXG5cdFx0e1xuXHRcdFx0X2lkOiAxMjM2Mixcblx0XHRcdHRpdGxlOiAnQmF5bWF4Jyxcblx0XHRcdHNuYXBzaG90RmlsZVVybDogJy9pbWFnZXMvc25hcHNob3RzL2JheW1heC5wbmcnLFxuXHRcdFx0bW9kZWxGaWxlVXJsOiAnbW9kZWxzL2JheW1heC5qc29uJyxcblx0XHRcdGNyZWF0b3I6ICdNaWx0b24gR2xhc2VyJyxcblx0XHRcdHRhZ3M6IFsnQ2hhcmFjdGVyJywnRnV0dXJpc3RpYyddXG5cdFx0fSxcblx0XHR7XG5cdFx0XHRfaWQ6IDEyNDI0LFxuXHRcdFx0dGl0bGU6ICdGbG9hdGluZyBJc2xhbmQnLFxuXHRcdFx0c25hcHNob3RGaWxlVXJsOiAnL2ltYWdlcy9zbmFwc2hvdHMvZmxvYXRpbmdJc2xhbmQucG5nJyxcblx0XHRcdG1vZGVsRmlsZVVybDogJ21vZGVscy91bnRpdGxlZC1zY2VuZS91bnRpdGxlZC1zY2VuZS5qc29uJyxcblx0XHRcdGNyZWF0b3I6ICdNYXJ5IEFubmUnLFxuXHRcdFx0dGFnczogWydFbnZpcm9ubWVudCcsJ0xvdy1Qb2x5J11cblx0XHR9LCBcblx0XHR7XG5cdFx0XHRfaWQ6IDEyMzYyLFxuXHRcdFx0dGl0bGU6ICdCYXltYXgnLFxuXHRcdFx0c25hcHNob3RGaWxlVXJsOiAnL2ltYWdlcy9zbmFwc2hvdHMvYmF5bWF4LnBuZycsXG5cdFx0XHRtb2RlbEZpbGVVcmw6ICdtb2RlbHMvYmF5bWF4Lmpzb24nLFxuXHRcdFx0Y3JlYXRvcjogJ01pbHRvbiBHbGFzZXInLFxuXHRcdFx0dGFnczogWydDaGFyYWN0ZXInLCdGdXR1cmlzdGljJ11cblx0XHR9LFxuXHRcdHtcblx0XHRcdF9pZDogMTI0MjQsXG5cdFx0XHR0aXRsZTogJ0Zsb2F0aW5nIElzbGFuZCcsXG5cdFx0XHRzbmFwc2hvdEZpbGVVcmw6ICcvaW1hZ2VzL3NuYXBzaG90cy9mbG9hdGluZ0lzbGFuZC5wbmcnLFxuXHRcdFx0bW9kZWxGaWxlVXJsOiAnbW9kZWxzL3VudGl0bGVkLXNjZW5lL3VudGl0bGVkLXNjZW5lLmpzb24nLFxuXHRcdFx0Y3JlYXRvcjogJ01hcnkgQW5uZScsXG5cdFx0XHR0YWdzOiBbJ0Vudmlyb25tZW50JywnTG93LVBvbHknXVxuXHRcdH0sIFxuXHRcdHtcblx0XHRcdF9pZDogMTIzNjIsXG5cdFx0XHR0aXRsZTogJ0JheW1heCcsXG5cdFx0XHRzbmFwc2hvdEZpbGVVcmw6ICcvaW1hZ2VzL3NuYXBzaG90cy9iYXltYXgucG5nJyxcblx0XHRcdG1vZGVsRmlsZVVybDogJ21vZGVscy9iYXltYXguanNvbicsXG5cdFx0XHRjcmVhdG9yOiAnTWlsdG9uIEdsYXNlcicsXG5cdFx0XHR0YWdzOiBbJ0NoYXJhY3RlcicsJ0Z1dHVyaXN0aWMnXVxuXHRcdH0sIFxuXHRcdHtcblx0XHRcdF9pZDogMTIzNjIsXG5cdFx0XHR0aXRsZTogJ0JheW1heCcsXG5cdFx0XHRzbmFwc2hvdEZpbGVVcmw6ICcvaW1hZ2VzL3NuYXBzaG90cy9iYXltYXgucG5nJyxcblx0XHRcdG1vZGVsRmlsZVVybDogJ21vZGVscy9iYXltYXguanNvbicsXG5cdFx0XHRjcmVhdG9yOiAnTWlsdG9uIEdsYXNlcicsXG5cdFx0XHR0YWdzOiBbJ0NoYXJhY3RlcicsJ0Z1dHVyaXN0aWMnXVxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0X2lkOiAxMjQyNCxcblx0XHRcdHRpdGxlOiAnRmxvYXRpbmcgSXNsYW5kJyxcblx0XHRcdHNuYXBzaG90RmlsZVVybDogJy9pbWFnZXMvc25hcHNob3RzL2Zsb2F0aW5nSXNsYW5kLnBuZycsXG5cdFx0XHRtb2RlbEZpbGVVcmw6ICdtb2RlbHMvdW50aXRsZWQtc2NlbmUvdW50aXRsZWQtc2NlbmUuanNvbicsXG5cdFx0XHRjcmVhdG9yOiAnTWFyeSBBbm5lJyxcblx0XHRcdHRhZ3M6IFsnRW52aXJvbm1lbnQnLCdMb3ctUG9seSddXG5cdFx0fSwgXG5cdFx0e1xuXHRcdFx0X2lkOiAxMjM2Mixcblx0XHRcdHRpdGxlOiAnQmF5bWF4Jyxcblx0XHRcdHNuYXBzaG90RmlsZVVybDogJy9pbWFnZXMvc25hcHNob3RzL2JheW1heC5wbmcnLFxuXHRcdFx0bW9kZWxGaWxlVXJsOiAnbW9kZWxzL2JheW1heC5qc29uJyxcblx0XHRcdGNyZWF0b3I6ICdNaWx0b24gR2xhc2VyJyxcblx0XHRcdHRhZ3M6IFsnQ2hhcmFjdGVyJywnRnV0dXJpc3RpYyddXG5cdFx0fSwgXG5cdFx0e1xuXHRcdFx0X2lkOiAxMjM2Mixcblx0XHRcdHRpdGxlOiAnQmF5bWF4Jyxcblx0XHRcdHNuYXBzaG90RmlsZVVybDogJy9pbWFnZXMvc25hcHNob3RzL2JheW1heC5wbmcnLFxuXHRcdFx0bW9kZWxGaWxlVXJsOiAnbW9kZWxzL2JheW1heC5qc29uJyxcblx0XHRcdGNyZWF0b3I6ICdNaWx0b24gR2xhc2VyJyxcblx0XHRcdHRhZ3M6IFsnQ2hhcmFjdGVyJywnRnV0dXJpc3RpYyddXG5cdFx0fSxcblx0XHR7XG5cdFx0XHRfaWQ6IDEyMzYyLFxuXHRcdFx0dGl0bGU6ICdCYXltYXgnLFxuXHRcdFx0c25hcHNob3RGaWxlVXJsOiAnL2ltYWdlcy9zbmFwc2hvdHMvYmF5bWF4LnBuZycsXG5cdFx0XHRtb2RlbEZpbGVVcmw6ICdtb2RlbHMvYmF5bWF4Lmpzb24nLFxuXHRcdFx0Y3JlYXRvcjogJ01pbHRvbiBHbGFzZXInLFxuXHRcdFx0dGFnczogWydDaGFyYWN0ZXInLCdGdXR1cmlzdGljJ11cblx0XHR9LFxuXHRcdHtcblx0XHRcdF9pZDogMTI0MjQsXG5cdFx0XHR0aXRsZTogJ0Zsb2F0aW5nIElzbGFuZCcsXG5cdFx0XHRzbmFwc2hvdEZpbGVVcmw6ICcvaW1hZ2VzL3NuYXBzaG90cy9mbG9hdGluZ0lzbGFuZC5wbmcnLFxuXHRcdFx0bW9kZWxGaWxlVXJsOiAnbW9kZWxzL3VudGl0bGVkLXNjZW5lL3VudGl0bGVkLXNjZW5lLmpzb24nLFxuXHRcdFx0Y3JlYXRvcjogJ01hcnkgQW5uZScsXG5cdFx0XHR0YWdzOiBbJ0Vudmlyb25tZW50JywnTG93LVBvbHknXVxuXHRcdH0sIFxuXHRcdHtcblx0XHRcdF9pZDogMTIzNjIsXG5cdFx0XHR0aXRsZTogJ0JheW1heCcsXG5cdFx0XHRzbmFwc2hvdEZpbGVVcmw6ICcvaW1hZ2VzL3NuYXBzaG90cy9iYXltYXgucG5nJyxcblx0XHRcdG1vZGVsRmlsZVVybDogJ21vZGVscy9iYXltYXguanNvbicsXG5cdFx0XHRjcmVhdG9yOiAnTWlsdG9uIEdsYXNlcicsXG5cdFx0XHR0YWdzOiBbJ0NoYXJhY3RlcicsJ0Z1dHVyaXN0aWMnXVxuXHRcdH1dO1xuXG5cdH1cblxuXG5cdC8vIFJlbmRlcmVyIEZ1bmN0aW9uYWxpdHlcblx0TW9kZWwuY2hhbmdlTW9kZWxVcmwgPSBmdW5jdGlvbiAobmV3VXJsKSB7XG5cdFx0cmVuZGVyT2JqLm1vZGVsRmlsZVVybCA9IG5ld1VybDtcblx0XHRyZXR1cm4gcmVuZGVyT2JqO1xuXHR9O1xuXHRNb2RlbC5jaGFuZ2VNb2RlbCA9IGZ1bmN0aW9uICgpIHtcblx0XHQvLyBUZW1wIGF0dHJpYnV0ZXMgZm9yIHRlc3Rpbmdcblx0XHRyZW5kZXJPYmogPSB7XG5cdFx0XHRtb2RlbEZpbGVVcmw6ICdtb2RlbHMvYmF5bWF4Lmpzb24nLFxuXHRcdFx0Y3JlYXRvcjogJ01pbHRvbiBHbGFzZXInXG5cdFx0fVxuXHR9O1xuXHRNb2RlbC5nZXRNb2RlbFVybCA9IGZ1bmN0aW9uICgpIHtcblx0XHRyZXR1cm4gcmVuZGVyT2JqLm1vZGVsRmlsZVVybDtcblx0fTtcblx0TW9kZWwuZ2V0TW9kZWwgPSBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIHJlbmRlck9iajtcblx0fTtcblxuXG5cblx0cmV0dXJuIE1vZGVsO1xuXG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3NpZ25VcCcsIHtcbiAgICAgICAgdXJsOiAnL3NpZ251cCcsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvc2lnbi11cC9zaWduLXVwLmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnU2lnblVwQ3RybCdcbiAgICB9KTtcblxufSk7XG5cbmFwcC5jb250cm9sbGVyKCdTaWduVXBDdHJsJywgZnVuY3Rpb24gKCRzY29wZSwgU2lnblVwLCAkc3RhdGUpIHtcblxuICAgICRzY29wZS5sb2dpbiA9IHt9O1xuICAgICRzY29wZS5lcnJvciA9IG51bGw7XG5cbiAgICAkc2NvcGUuc2VuZFNpZ25VcCA9IGZ1bmN0aW9uIChzaWduVXBJbmZvKSB7XG5cbiAgICAgICAgJHNjb3BlLmVycm9yID0gbnVsbDtcblxuICAgICAgICBTaWduVXAuc2lnbnVwKHNpZ25VcEluZm8pLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHN0YXRlLmdvKCdsaXN0aW5nJyk7XG4gICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5lcnJvciA9ICdJbnZhbGlkIGxvZ2luIGNyZWRlbnRpYWxzLic7XG4gICAgICAgIH0pO1xuXG4gICAgfTtcbiAgICBcbiAgICAkc2NvcGUuZ2V0VXNlcnMgPSBmdW5jdGlvbigpe1xuICAgICAgICBTaWduVXAuZ2V0VXNlcnMoKS50aGVuKGZ1bmN0aW9uKHVzZXJzKXtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHVzZXJzKVxuICAgICAgICB9KVxuICAgIH1cblxufSk7XG5cbiIsIid1c2Ugc3RyaWN0JztcblxuYXBwLmNvbnRyb2xsZXIoJ1VwbG9hZENvbnRyb2xsZXInLCBmdW5jdGlvbigkc2NvcGUpe1xuXG59KTsiLCIndXNlIHN0cmljdCc7XG5cbmFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKXtcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3VwbG9hZCcsIHtcblx0XHR1cmw6ICcvdXBsb2FkJyxcblx0XHR0ZW1wbGF0ZVVybDogJ2pzL3VwbG9hZC91cGxvYWQuaHRtbCcsXG5cdFx0Y29udHJvbGxlcjogJ1VwbG9hZENvbnRyb2xsZXInXG5cdH0pO1xufSk7IiwiJ3VzZSBzdHJpY3QnO1xuXG5hcHAuY29udHJvbGxlcignVXNlckNvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlKXtcblxuXG5cbn0pOyIsIid1c2Ugc3RyaWN0JztcblxuYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3VzZXInLCB7XG5cdFx0dXJsOiAnL3VzZXIvOmlkJyxcblx0XHR0ZW1wbGF0ZVVybDogJy9icm93c2VyL2pzL3VzZXIvdXNlci5odG1sJyxcblx0XHRjb250cm9sbGVyOiAnVXNlckNvbnRyb2xsZXInLFxuXHRcdHJlc29sdmU6IHtcblx0XHRcdHVzZXI6IGZ1bmN0aW9uIChVc2VyLCAkc3RhdGVQYXJhbXMpIHtcblx0XHRcdFx0dmFyIHVzZXIgPSBuZXcgVXNlcih7X2lkOiAkc3RhdGVQYXJhbXMuaWR9KTtcblx0XHRcdFx0cmV0dXJuIHVzZXIuZmV0Y2goKTtcblx0XHRcdH1cblx0XHR9XG5cdH0pO1xufSk7IiwiJ3VzZSBzdHJpY3QnO1xuXG5hcHAuZGlyZWN0aXZlKCdmaWVsZEZvY3VzJywgZnVuY3Rpb24oJHBhcnNlLCAkdGltZW91dCl7XG5cdHJldHVybiB7XG5cdFx0cmVzdHJpY3Q6ICdBJyxcblx0XHRsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHJzKXtcblx0XHRcdHZhciBzdGF0dXMgPSAkcGFyc2UoYXR0cnMuZmllbGRGb2N1cyk7XG5cdFx0XHRzY29wZS4kd2F0Y2goc3RhdHVzLCBmdW5jdGlvbih2YWwpe1xuXHRcdFx0XHRjb25zb2xlLmxvZygnc3RhdHVzID0gJywgdmFsKTtcblx0XHRcdFx0aWYgKHZhbCA9PT0gdHJ1ZSl7XG5cdFx0XHRcdFx0JHRpbWVvdXQoZnVuY3Rpb24oKXtcblx0XHRcdFx0XHRcdGVsZW1lbnRbMF0uZm9jdXMoKTtcblx0XHRcdFx0XHR9KVxuXHRcdFx0XHR9XG5cdFx0XHR9KVxuXHRcdH1cblx0fVxufSkiLCJcbmFwcC5mYWN0b3J5KCdTaWduVXAnLCBmdW5jdGlvbiAoJGh0dHAsICRzdGF0ZSwgJGxvY2F0aW9uKSB7XG5cdHJldHVybntcblx0XHRzaWdudXA6IGZ1bmN0aW9uIChjcmVkZW50aWFscykge1xuXHRcdHJldHVybiAkaHR0cC5wb3N0KCdhcGkvdXNlcicsIGNyZWRlbnRpYWxzKS50aGVuKGZ1bmN0aW9uIChyZXMpIHtcblx0XHRcdGNvbnNvbGUubG9nKHJlcy5kYXRhKVxuXHRcdFx0cmV0dXJuIHJlcy5kYXRhO1xuXHRcdH0pO1xuXHRcdH0sXG5cbiAgICAgICAgZ2V0VXNlcnM6IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCdhcGkvdXNlcicpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNwb25zZS5kYXRhO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuXHR9XG59KTtcblxuIiwiJ3VzZSBzdHJpY3QnO1xuXG5hcHAuZGlyZWN0aXZlKCdjb2xsZWN0aW9uJywgZnVuY3Rpb24oKXtcblx0cmV0dXJuIHtcblx0XHRyZXN0cmljdDogJ0UnLFxuXHRcdHRlbXBsYXRlVXJsOiAnanMvY29tcG9uZW50cy9jb2xsZWN0aW9uL2NvbGxlY3Rpb24uaHRtbCcsXG5cdFx0Y29udHJvbGxlcjogJ01hbmFnZXJDb250cm9sbGVyJ1xuXHR9XG59KTsiLCIndXNlIHN0cmljdCc7XG5cbmFwcC5kaXJlY3RpdmUoJ25hdmJhcicsIGZ1bmN0aW9uICgpIHtcblx0cmV0dXJuIHtcblx0XHRyZXN0cmljdDogXCJFXCIsXG5cdFx0dGVtcGxhdGVVcmw6IFwianMvY29tcG9uZW50cy9uYXZiYXIvbmF2YmFyLmh0bWxcIixcblx0XHRjb250cm9sbGVyOiAnTWFuYWdlckNvbnRyb2xsZXInXG5cdH1cbn0pOyIsIid1c2Ugc3RyaWN0JztcblxuYXBwLmRpcmVjdGl2ZSgnb2F1dGhCdXR0b24nLCBmdW5jdGlvbiAoKSB7XG5cdHJldHVybiB7XG5cdFx0c2NvcGU6IHtcblx0XHRcdHByb3ZpZGVyTmFtZTogJ0AnXG5cdFx0fSxcblx0XHRyZXN0cmljdDogJ0UnLFxuXHRcdHRlbXBsYXRlVXJsOiAnanMvY29tcG9uZW50cy9vYXV0aC1idXR0b24vb2F1dGgtYnV0dG9uLmh0bWwnXG5cdH1cbn0pOyIsIid1c2Ugc3RyaWN0JztcblxuYXBwLmNvbnRyb2xsZXIoJ1JlY0VuZ2luZUNvbnRyb2xsZXInLCBmdW5jdGlvbigkc2NvcGUsIFJlbmRlclNlcnZpY2Upe1xuXG5cdCRzY29wZS5tb2RlbFVybCA9IFJlbmRlclNlcnZpY2UuZ2V0TW9kZWxVcmwoKTtcblxuXG59KSIsIid1c2Ugc3RyaWN0JztcblxuYXBwLmRpcmVjdGl2ZSgncmVjZW5naW5lJywgZnVuY3Rpb24oKXtcbnJldHVybiB7XG5cdHJlc3RyaWN0OiAnRScsXG5cdHJlcGxhY2U6IHRydWUsXG5cdHRlbXBsYXRlVXJsOiAnanMvY29tcG9uZW50cy9yZWNlbmdpbmUvcmVjZW5naW5lLmh0bWwnLFxuXHRsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHIpe1xuXG5cdFxuXHRcbn1cbn1cblxuXG5cblxuXG5cbn0pIiwiJ3VzZSBzdHJpY3QnO1xuXG5cblxuYXBwLmZhY3RvcnkoJ1JlY0VuZ2luZScsIGZ1bmN0aW9uKCl7XG5cblx0dmFyIHJlY3MgPSBmdW5jdGlvbigpe307XG5cblxuXG59KSIsIid1c2Ugc3RyaWN0JztcblxuYXBwLmRpcmVjdGl2ZSgnc2VhcmNoYmFyJywgZnVuY3Rpb24gKCl7XG5cdHJldHVybiB7XG5cdFx0cmVzdHJpY3Q6ICdFJyxcblx0XHR0ZW1wbGF0ZVVybDogJ2pzL2NvbXBvbmVudHMvc2VhcmNoYmFyL3NlYXJjaGJhci5odG1sJ1xuXHR9XG59KTsiLCIndXNlIHN0cmljdCc7XG5cbmFwcC5jb250cm9sbGVyKCdMaXN0aW5nQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIG1vZGVscywgTW9kZWwpIHtcblxuICAgICRzY29wZS5jaGFuZ2VNb2RlbCA9IGZ1bmN0aW9uKCl7XG4gICAgXHRjb25zb2xlLmxvZygkc2NvcGUubW9kZWxzKTtcbiAgICBcdE1vZGVsLmNoYW5nZU1vZGVsKCk7XG4gICAgfVxuXG4gICAgJHNjb3BlLm1vZGVscyA9IG1vZGVscztcblxufSk7IiwiJ3VzZSBzdHJpY3QnO1xuXG5hcHAuY29uZmlnKCBmdW5jdGlvbigkc3RhdGVQcm92aWRlcil7XG5cblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2xpc3RpbmcnLCB7XG5cdFx0dXJsOiAnLycsXG5cdFx0dGVtcGxhdGVVcmw6ICdqcy9wcm9kdWN0L2xpc3RpbmcvbGlzdGluZy5odG1sJyxcblx0XHRjb250cm9sbGVyOiAnTGlzdGluZ0NvbnRyb2xsZXInLFxuXHRcdHJlc29sdmU6IHtcblx0XHRcdG1vZGVsczogZnVuY3Rpb24gKE1vZGVsKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKE1vZGVsLmZldGNoQWxsKCkpO1xuXHRcdFx0XHRyZXR1cm4gTW9kZWwuZmV0Y2hBbGwoKTtcblx0XHRcdH1cblx0XHR9XG5cdH0pO1xuXG59KTsiLCIndXNlIHN0cmljdCc7XG5cbmFwcC5jb250cm9sbGVyKCdSZW5kZXJDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgTW9kZWwpIHtcblxuXHQkc2NvcGUubW9kZWwgPSBNb2RlbC5nZXRNb2RlbCgpO1xuXHRcblx0JHNjb3BlLiR3YXRjaChmdW5jdGlvbigpe1xuXHRcdHJldHVybiBNb2RlbC5nZXRNb2RlbFVybCgpXG5cdH0sIGZ1bmN0aW9uIChuZXdWYWwsIG9sZFZhbCl7XG5cdFx0JHNjb3BlLm1vZGVsID0gTW9kZWwuZ2V0TW9kZWwoKTsgXG5cdH0pO1xuXG59KTsiLCIndXNlIHN0cmljdCc7XG5cbmFwcC5kaXJlY3RpdmUoJ25nV2ViZ2wnLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHJlc3RyaWN0OiAnQScsXG4gICAgICBzY29wZToge1xuICAgICAgICBtb2RlbDogJz1tb2RlbEZpbGVVcmwnXG4gICAgICB9LFxuICAgICAgY29udHJvbGxlcjogXCJSZW5kZXJDb250cm9sbGVyXCIsXG4gICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHIpIHtcblxuICAgICAgICAvLyBTZXR1cCBzZWxlY3Rpb25zXG4gICAgICAgIHNjb3BlLnJlbmRlckZyYW1lID0gJCgnI3JlbmRlci1mcmFtZScpO1xuICAgICAgICB2YXIgcmVuZGVyRnJhbWVXaWR0aCA9IHNjb3BlLnJlbmRlckZyYW1lLndpZHRoKCk7XG4gICAgICAgIHZhciByZW5kZXJGcmFtZUhlaWdodCA9IHNjb3BlLnJlbmRlckZyYW1lLmhlaWdodCgpO1xuICAgICAgICB2YXIgcmVuZGVyT2JqZWN0U2NhbGVNb2RpZmllciA9IHJlbmRlckZyYW1lV2lkdGgvMTAyNDtcblxuICAgICAgICAvLyBTZXR1cCBUSFJFRS5qcyB2YXJpYWJsZXMgd2l0aCBzY29wZVxuICAgICAgICB2YXIgY2FtZXJhO1xuICAgICAgICAgICAgc2NvcGUuY2FtZXJhID0gY2FtZXJhO1xuICAgICAgICB2YXIgc2NlbmU7XG4gICAgICAgICAgICBzY29wZS5zY2VuZSA9IHNjZW5lO1xuICAgICAgICB2YXIgcmVuZGVyZXI7XG4gICAgICAgICAgICBzY29wZS5yZW5kZXJlciA9IHJlbmRlcmVyO1xuICAgICAgICB2YXIgcHJldmlvdXM7XG4gICAgICAgICAgICBzY29wZS5wcmV2aW91cyA9IHByZXZpb3VzO1xuXG4gICAgICAgIC8vIGluaXRpYWxpemUgc2NlbmVcbiAgICAgICAgaW5pdCgpO1xuXG4gICAgICAgIC8vIGxvYWQgZGVmYXVsdCBtb2RlbCBvbiBzY29wZSAtLSBqZWVwIG1vZGVsIC0tIHZpYSBBc3NpbXBKU09OTG9hZGVyXG4gICAgICAgIHZhciBsb2FkZXIyID0gbmV3IFRIUkVFLk9iamVjdExvYWRlcigpO1xuICAgICAgICB2YXIgbG9hZGVyMyA9IG5ldyBUSFJFRS5KU09OTG9hZGVyKCk7XG5cbiAgICAgICAgLy8gV2F0Y2ggZm9yIGNoYW5nZXMgdG8gc2NvcGVcbiAgICAgICAgc2NvcGUuJHdhdGNoKCdtb2RlbC5tb2RlbEZpbGVVcmwnLCBmdW5jdGlvbiAobmV3VmFsdWUsIG9sZFZhbHVlKXtcbiAgICAgICAgICBpZiAobmV3VmFsdWUgIT0gb2xkVmFsdWUpIHtcbiAgICAgICAgICAgIGxvYWRNb2RlbChuZXdWYWx1ZSk7IFxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8hISBIYW5kbGUgcmVtb3Zpbmcgb2JqZWN0IGFuZCBhZGRpbmcgbmV3IG9iamVjdFxuICAgICAgICBmdW5jdGlvbiBsb2FkTW9kZWwobW9kVXJsKSB7XG4gICAgICAgICAgICBsb2FkZXIyLmxvYWQobW9kVXJsLCBmdW5jdGlvbiAob2JqZWN0KSB7XG4gICAgICAgICAgICAgIG9iamVjdC5zY2FsZS54ID0gb2JqZWN0LnNjYWxlLnkgPSBvYmplY3Quc2NhbGUueiA9ICguMDI4ICogcmVuZGVyT2JqZWN0U2NhbGVNb2RpZmllcik7XG4gICAgICAgICAgICAgIG9iamVjdC5wb3NpdGlvbi55ID0gLjU7XG4gICAgICAgICAgICAgIG9iamVjdC51cGRhdGVNYXRyaXgoKTtcbiAgICAgICAgICAgICAgaWYgKHByZXZpb3VzKSBzY2VuZS5yZW1vdmUocHJldmlvdXMpO1xuICAgICAgICAgICAgICBzY2VuZS5hZGQob2JqZWN0KTtcblxuICAgICAgICAgICAgICBwcmV2aW91cyA9IG9iamVjdDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cblxuICAgICAgICAvLyBydW4gbG9hZCBtb2RlbCBvbiBjdXJyZW50IG1vZGVsVXJsXG4gICAgICAgIGxvYWRNb2RlbChzY29wZS5tb2RlbC5tb2RlbEZpbGVVcmwpO1xuICAgICAgICBhbmltYXRlKCk7XG5cbiAgICAgICAgLy8gU2V0dXAgVEhSRUUuanMgY2FtZXJhcywgc2NlbmUsIHJlbmRlcmVyLCBsaWdodGluZ1xuICAgICAgICBmdW5jdGlvbiBpbml0KCl7XG5cbiAgICAgICAgICAvLyBDYW1lcmFcbiAgICAgICAgICBjYW1lcmEgPSBuZXcgVEhSRUUuUGVyc3BlY3RpdmVDYW1lcmEoNTAsIHJlbmRlckZyYW1lV2lkdGggLyByZW5kZXJGcmFtZUhlaWdodCwgMSwgMjAwMCk7XG4gICAgICAgICAgY2FtZXJhLnBvc2l0aW9uLnNldCgyLDQsNSk7XG5cbiAgICAgICAgICAvLyBTY2VuZVxuICAgICAgICAgIHNjZW5lID0gbmV3IFRIUkVFLlNjZW5lKCk7XG4gICAgICAgICAgLy8gc2NlbmUuZm9nID0gbmV3IFRIUkVFLkZvZ0V4cDIoMHgwMDAwMDAsIDAuMDAwMSk7XG5cbiAgICAgICAgICAvLyBMaWdodHNcbiAgICAgICAgICBzY2VuZS5hZGQobmV3IFRIUkVFLkFtYmllbnRMaWdodCgweGNjY2NjYykpO1xuXG4gICAgICAgICAgdmFyIGRpcmVjdGlvbmFsTGlnaHQgPSBuZXcgVEhSRUUuRGlyZWN0aW9uYWxMaWdodCgweGNjY2NjYyk7XG4gICAgICAgICAgZGlyZWN0aW9uYWxMaWdodC5wb3NpdGlvbi54ID0gTWF0aC5yYW5kb20oKSAtIDAuNTtcbiAgICAgICAgICBkaXJlY3Rpb25hbExpZ2h0LnBvc2l0aW9uLnkgPSBNYXRoLnJhbmRvbSgpIC0gMC41O1xuICAgICAgICAgIGRpcmVjdGlvbmFsTGlnaHQucG9zaXRpb24ueiA9IE1hdGgucmFuZG9tKCkgLSAwLjU7XG4gICAgICAgICAgZGlyZWN0aW9uYWxMaWdodC5wb3NpdGlvbi5ub3JtYWxpemUoKTtcbiAgICAgICAgICBzY2VuZS5hZGQoZGlyZWN0aW9uYWxMaWdodCk7XG5cbiAgICAgICAgICAvLyEhISEgUmVuZGVyZXJcbiAgICAgICAgICByZW5kZXJlciA9IG5ldyBUSFJFRS5XZWJHTFJlbmRlcmVyKHsgYW50aWFsaWFzOiB0cnVlIH0pO1xuICAgICAgICAgIHJlbmRlcmVyLnNldFNpemUocmVuZGVyRnJhbWVXaWR0aCwgcmVuZGVyRnJhbWVIZWlnaHQpO1xuICAgICAgICAgIHJlbmRlcmVyLnNldENsZWFyQ29sb3IoIDB4ZmZmZmZmICk7XG4gICAgICAgICAgZWxlbWVudFswXS5hcHBlbmRDaGlsZChyZW5kZXJlci5kb21FbGVtZW50KTtcblxuICAgICAgICAgIC8vIENoZWNrIGZvciBSZXNpemUgRXZlbnRcbiAgICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgb25XaW5kb3dSZXNpemUsIGZhbHNlKTtcblxuICAgICAgICAgIC8vIGNvbnNvbGUubG9nKHNjZW5lKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEhhbmRsZSBSZXNpemVcbiAgICAgICAgZnVuY3Rpb24gb25XaW5kb3dSZXNpemUoZXZlbnQpe1xuICAgICAgICAgIHJlbmRlcmVyLnNldFNpemUoc2NvcGUucmVuZGVyRnJhbWUud2lkdGgoKSwgcmVuZGVyRnJhbWVIZWlnaHQpO1xuICAgICAgICAgIGNhbWVyYS5hc3BlY3QgPSBzY29wZS5yZW5kZXJGcmFtZS53aWR0aCgpIC8gcmVuZGVyRnJhbWVIZWlnaHQ7XG4gICAgICAgICAgY2FtZXJhLnVwZGF0ZVByb2plY3Rpb25NYXRyaXgoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEFuaW1hdGVcbiAgICAgICAgdmFyIHQgPSAwOyAvLyA/XG4gICAgICAgIGZ1bmN0aW9uIGFuaW1hdGUoKSB7ICAgICAgICAgIFxuICAgICAgICAgIHJlbmRlcigpO1xuICAgICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZShhbmltYXRlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEhhbmRsZSByZS1SZW5kZXJpbmcgb2Ygc2NlbmUgZm9yIHNwaW5uaW5nXG4gICAgICAgIGZ1bmN0aW9uIHJlbmRlcigpeyBcbiAgICAgICAgICB2YXIgdGltZXIgPSBEYXRlLm5vdygpICogMC4wMDAxNTtcbiAgICAgICAgICAgIGNhbWVyYS5wb3NpdGlvbi54ID0gTWF0aC5jb3ModGltZXIpICogMTA7XG4gICAgICAgICAgICBjYW1lcmEucG9zaXRpb24ueSA9IDQ7XG4gICAgICAgICAgICBjYW1lcmEucG9zaXRpb24ueiA9IE1hdGguc2luKHRpbWVyKSAqIDguNTtcbiAgICAgICAgICAgIGNhbWVyYS5sb29rQXQoc2NlbmUucG9zaXRpb24pO1xuICAgICAgICAgICAgcmVuZGVyZXIucmVuZGVyKHNjZW5lLCBjYW1lcmEpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxufSk7Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
>>>>>>> 8a491b6cc7745de004d40f68d6046ad82dc4a444
