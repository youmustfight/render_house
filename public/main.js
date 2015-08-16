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

app.factory('Model', function ($http) {
	// Model Constructor
	function Model(props) {
		angular.extend(this, props);
	}
	Model.url = 'api/product';
	Object.defineProperty(Model.prototype, 'url', {
		get: function get() {
			return Model.url + this._id;
		}
	});

	// Currently Rendered Object
	var renderObj = {
		modelFileUrl: 'models/untitled-scene/untitled-scene.json',
		creator: 'Mary Anne'
	};

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
		return [{
			_id: 12424,
			title: 'Floating Island',
			snapshotFileUrl: 'images/snapshots/untitled-scene.png',
			modelFileUrl: 'models/untitled-scene/untitled-scene.json',
			creator: 'Mary Anne',
			tags: ['Environment', 'Low-Poly']
		}, {
			_id: 12362,
			title: 'Baymax',
			snapshotFileUrl: 'images/snapshots/baymax.png',
			modelFileUrl: 'models/baymax.json',
			creator: 'Milton Glaser',
			tags: ['Character', 'Futuristic']
		}, {
			_id: 12424,
			title: 'Floating Island',
			snapshotFileUrl: 'images/snapshots/untitled-scene.png',
			modelFileUrl: 'models/untitled-scene/untitled-scene.json',
			creator: 'Mary Anne',
			tags: ['Environment', 'Low-Poly']
		}, {
			_id: 12362,
			title: 'Baymax',
			snapshotFileUrl: 'images/snapshots/baymax.png',
			modelFileUrl: 'models/baymax.json',
			creator: 'Milton Glaser',
			tags: ['Character', 'Futuristic']
		}, {
			_id: 12424,
			title: 'Floating Island',
			snapshotFileUrl: 'images/snapshots/untitled-scene.png',
			modelFileUrl: 'models/untitled-scene/untitled-scene.json',
			creator: 'Mary Anne',
			tags: ['Environment', 'Low-Poly']
		}, {
			_id: 12362,
			title: 'Baymax',
			snapshotFileUrl: 'images/snapshots/baymax.png',
			modelFileUrl: 'models/baymax.json',
			creator: 'Milton Glaser',
			tags: ['Character', 'Futuristic']
		}, {
			_id: 12362,
			title: 'Baymax',
			snapshotFileUrl: 'images/snapshots/baymax.png',
			modelFileUrl: 'models/baymax.json',
			creator: 'Milton Glaser',
			tags: ['Character', 'Futuristic']
		}, {
			_id: 12424,
			title: 'Floating Island',
			snapshotFileUrl: 'images/snapshots/untitled-scene.png',
			modelFileUrl: 'models/untitled-scene/untitled-scene.json',
			creator: 'Mary Anne',
			tags: ['Environment', 'Low-Poly']
		}, {
			_id: 12362,
			title: 'Baymax',
			snapshotFileUrl: 'images/snapshots/baymax.png',
			modelFileUrl: 'models/baymax.json',
			creator: 'Milton Glaser',
			tags: ['Character', 'Futuristic']
		}, {
			_id: 12362,
			title: 'Baymax',
			snapshotFileUrl: 'images/snapshots/baymax.png',
			modelFileUrl: 'models/baymax.json',
			creator: 'Milton Glaser',
			tags: ['Character', 'Futuristic']
		}, {
			_id: 12362,
			title: 'Baymax',
			snapshotFileUrl: 'images/snapshots/baymax.png',
			modelFileUrl: 'models/baymax.json',
			creator: 'Milton Glaser',
			tags: ['Character', 'Futuristic']
		}, {
			_id: 12424,
			title: 'Floating Island',
			snapshotFileUrl: 'images/snapshots/untitled-scene.png',
			modelFileUrl: 'models/untitled-scene/untitled-scene.json',
			creator: 'Mary Anne',
			tags: ['Environment', 'Low-Poly']
		}, {
			_id: 12362,
			title: 'Baymax',
			snapshotFileUrl: 'images/snapshots/baymax.png',
			modelFileUrl: 'models/baymax.json',
			creator: 'Milton Glaser',
			tags: ['Character', 'Futuristic']
		}, {
			_id: 12424,
			title: 'Floating Island',
			snapshotFileUrl: 'images/snapshots/untitled-scene.png',
			modelFileUrl: 'models/untitled-scene/untitled-scene.json',
			creator: 'Mary Anne',
			tags: ['Environment', 'Low-Poly']
		}, {
			_id: 12362,
			title: 'Baymax',
			snapshotFileUrl: 'images/snapshots/baymax.png',
			modelFileUrl: 'models/baymax.json',
			creator: 'Milton Glaser',
			tags: ['Character', 'Futuristic']
		}, {
			_id: 12424,
			title: 'Floating Island',
			snapshotFileUrl: 'images/snapshots/untitled-scene.png',
			modelFileUrl: 'models/untitled-scene/untitled-scene.json',
			creator: 'Mary Anne',
			tags: ['Environment', 'Low-Poly']
		}, {
			_id: 12362,
			title: 'Baymax',
			snapshotFileUrl: 'images/snapshots/baymax.png',
			modelFileUrl: 'models/baymax.json',
			creator: 'Milton Glaser',
			tags: ['Character', 'Futuristic']
		}, {
			_id: 12424,
			title: 'Floating Island',
			snapshotFileUrl: 'images/snapshots/untitled-scene.png',
			modelFileUrl: 'models/untitled-scene/untitled-scene.json',
			creator: 'Mary Anne',
			tags: ['Environment', 'Low-Poly']
		}, {
			_id: 12362,
			title: 'Baymax',
			snapshotFileUrl: 'images/snapshots/baymax.png',
			modelFileUrl: 'models/baymax.json',
			creator: 'Milton Glaser',
			tags: ['Character', 'Futuristic']
		}, {
			_id: 12362,
			title: 'Baymax',
			snapshotFileUrl: 'images/snapshots/baymax.png',
			modelFileUrl: 'models/baymax.json',
			creator: 'Milton Glaser',
			tags: ['Character', 'Futuristic']
		}, {
			_id: 12424,
			title: 'Floating Island',
			snapshotFileUrl: 'images/snapshots/untitled-scene.png',
			modelFileUrl: 'models/untitled-scene/untitled-scene.json',
			creator: 'Mary Anne',
			tags: ['Environment', 'Low-Poly']
		}, {
			_id: 12362,
			title: 'Baymax',
			snapshotFileUrl: 'images/snapshots/baymax.png',
			modelFileUrl: 'models/baymax.json',
			creator: 'Milton Glaser',
			tags: ['Character', 'Futuristic']
		}, {
			_id: 12362,
			title: 'Baymax',
			snapshotFileUrl: 'images/snapshots/baymax.png',
			modelFileUrl: 'models/baymax.json',
			creator: 'Milton Glaser',
			tags: ['Character', 'Futuristic']
		}, {
			_id: 12362,
			title: 'Baymax',
			snapshotFileUrl: 'images/snapshots/baymax.png',
			modelFileUrl: 'models/baymax.json',
			creator: 'Milton Glaser',
			tags: ['Character', 'Futuristic']
		}, {
			_id: 12424,
			title: 'Floating Island',
			snapshotFileUrl: 'images/snapshots/untitled-scene.png',
			modelFileUrl: 'models/untitled-scene/untitled-scene.json',
			creator: 'Mary Anne',
			tags: ['Environment', 'Low-Poly']
		}, {
			_id: 12362,
			title: 'Baymax',
			snapshotFileUrl: 'images/snapshots/baymax.png',
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
	Model.changeModel = function (newObj) {
		// Temp attributes for testing
		renderObj = newObj || {
			_id: 12424,
			title: 'Floating Island',
			snapshotFileUrl: 'images/snapshots/untitled-scene.png',
			modelFileUrl: 'models/untitled-scene/untitled-scene.json',
			creator: 'Mary Anne',
			tags: ['Environment', 'Low-Poly']
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

app.controller('UserController', function ($scope, user) {
	$scope.user = user;
});
'use strict';

app.factory('User', function ($http) {
	// User Contructor
	function User(props) {
		angular.extend(this, props);
	}
	User.url = 'api/user';

	//

	return User;
});
'use strict';

app.config(function ($stateProvider) {
	$stateProvider.state('user', {
		url: '/user/:displayName',
		templateUrl: 'js/user/user.html',
		controller: 'UserController',
		resolve: {
			user: function user(User, $stateParams) {
				//Get User
				// var user = new User({displayName: $stateParams.displayName}).fetch();
				var user = {
					fullName: 'Milton Glaser',
					displayName: 'Milt'
				};

				// Attach returned user to scope
				return user;
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

app.directive('navbar', function () {
	return {
		restrict: "E",
		templateUrl: "js/components/navbar/navbar.html",
		controller: 'ManagerController'
	};
});
'use strict';

app.directive('searchbar', function () {
	return {
		restrict: 'E',
		templateUrl: 'js/components/searchbar/searchbar.html'
	};
});
'use strict';

app.controller('ModelDetailController', function ($scope, Model, model, models) {
	$scope.model = model;
	$scope.models = models;
});
'use strict';

app.config(function ($stateProvider) {
	$stateProvider.state('model', {
		url: '/model/:id',
		templateUrl: 'js/product/detail/product.detail.html',
		controller: 'ModelDetailController',
		resolve: {
			model: function model(Model, $stateParams) {
				// Get Model
				// var model = new Model({_id: $statemParams.id}).fetch();
				var model = {
					_id: 12362,
					title: 'Baymax',
					snapshotFileUrl: '/images/snapshots/baymax.png',
					modelFileUrl: 'models/baymax.json',
					creator: 'Milton Glaser',
					tags: ['Character', 'Futuristic']
				};

				// Set new renderObj
				Model.changeModel(model);

				// Attach returned model to scope
				return model;
			},
			models: function models(Model) {
				return Model.fetchAll();
			}
		}
	});
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
				// Set Island object as home render
				Model.changeModel({
					_id: 12424,
					title: 'Floating Island',
					snapshotFileUrl: '/images/snapshots/untitled-scene.png',
					modelFileUrl: 'models/untitled-scene/untitled-scene.json',
					creator: 'Mary Anne',
					tags: ['Environment', 'Low-Poly']
				});

				// console.log(Model.fetchAll());
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
'use strict';

app.directive('productTile', function () {
	return {
		restrict: 'E',
		scope: {
			model: '='
		},
		templateUrl: 'js/product/tile/product.tile.html'
	};
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImZzYS1wcmUtYnVpbHQuanMiLCJjb21wb25lbnRzL21hbmFnZXIuY29udHJvbGxlci5qcyIsImxvZ2luL2xvZ2luLmpzIiwicHJvZHVjdC9tb2RlbC5mYWN0b3J5LmpzIiwic2lnbi11cC9zaWduLXVwLmpzIiwidXBsb2FkL3VwbG9hZC5jb250cm9sbGVyLmpzIiwidXBsb2FkL3VwbG9hZC5zdGF0ZS5qcyIsInVzZXIvdXNlci5jb250cm9sbGVyLmpzIiwidXNlci91c2VyLmZhY3RvcnkuanMiLCJ1c2VyL3VzZXIuc3RhdGUuanMiLCJ1dGlscy9maWVsZEZvY3VzLmRpcmVjdGl2ZS5qcyIsInV0aWxzL3NpZ24tdXAtZmFjdG9yeS5qcyIsImNvbXBvbmVudHMvY29sbGVjdGlvbi9jb2xsZWN0aW9uLmRpcmVjdGl2ZS5qcyIsImNvbXBvbmVudHMvb2F1dGgtYnV0dG9uL29hdXRoLWJ1dHRvbi5kaXJlY3RpdmUuanMiLCJjb21wb25lbnRzL25hdmJhci9uYXZiYXIuZGlyZWN0aXZlLmpzIiwiY29tcG9uZW50cy9zZWFyY2hiYXIvc2VhcmNoYmFyLmRpcmVjdGl2ZS5qcyIsInByb2R1Y3QvZGV0YWlsL3Byb2R1Y3QuZGV0YWlsLmNvbnRyb2xsZXIuanMiLCJwcm9kdWN0L2RldGFpbC9wcm9kdWN0LmRldGFpbC5zdGF0ZS5qcyIsInByb2R1Y3QvbGlzdGluZy9saXN0aW5nLmNvbnRyb2xsZXIuanMiLCJwcm9kdWN0L2xpc3RpbmcvbGlzdGluZy5zdGF0ZS5qcyIsInByb2R1Y3QvcmVuZGVyL3JlbmRlci5jb250cm9sbGVyLmpzIiwicHJvZHVjdC9yZW5kZXIvcmVuZGVyLmRpcmVjdGl2ZS5qcyIsInByb2R1Y3QvdGlsZS9wcm9kdWN0LnRpbGUuZGlyZWN0aXZlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQUEsQ0FBQTtBQUNBLElBQUEsR0FBQSxHQUFBLE9BQUEsQ0FBQSxNQUFBLENBQUEsdUJBQUEsRUFBQSxDQUFBLFdBQUEsRUFBQSxhQUFBLENBQUEsQ0FBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxrQkFBQSxFQUFBLGlCQUFBLEVBQUE7O0FBRUEsa0JBQUEsQ0FBQSxTQUFBLENBQUEsSUFBQSxDQUFBLENBQUE7O0FBRUEsbUJBQUEsQ0FBQSxTQUFBLENBQUEsR0FBQSxDQUFBLENBQUE7QUFDQSxtQkFBQSxDQUFBLElBQUEsQ0FBQSxpQkFBQSxFQUFBLFlBQUE7QUFDQSxRQUFBLENBQUEsUUFBQSxDQUFBLE1BQUEsRUFBQSxDQUFBO0VBQ0EsQ0FBQSxDQUFBO0NBRUEsQ0FBQSxDQUFBOzs7QUFHQSxHQUFBLENBQUEsR0FBQSxDQUFBLFVBQUEsVUFBQSxFQUFBLFdBQUEsRUFBQSxNQUFBLEVBQUE7OztBQUdBLEtBQUEsNEJBQUEsR0FBQSxTQUFBLDRCQUFBLENBQUEsS0FBQSxFQUFBO0FBQ0EsU0FBQSxLQUFBLENBQUEsSUFBQSxJQUFBLEtBQUEsQ0FBQSxJQUFBLENBQUEsWUFBQSxDQUFBO0VBQ0EsQ0FBQTs7OztBQUlBLFdBQUEsQ0FBQSxHQUFBLENBQUEsbUJBQUEsRUFBQSxVQUFBLEtBQUEsRUFBQSxPQUFBLEVBQUE7O0FBRUEsTUFBQSxDQUFBLDRCQUFBLENBQUEsT0FBQSxDQUFBLEVBQUE7OztBQUdBLFVBQUE7R0FDQTs7QUFFQSxNQUFBLFdBQUEsQ0FBQSxlQUFBLEVBQUEsRUFBQTs7O0FBR0EsVUFBQTtHQUNBOzs7QUFHQSxPQUFBLENBQUEsY0FBQSxFQUFBLENBQUE7O0FBRUEsYUFBQSxDQUFBLGVBQUEsRUFBQSxDQUFBLElBQUEsQ0FBQSxVQUFBLElBQUEsRUFBQTs7OztBQUlBLE9BQUEsV0FBQSxHQUFBLElBQUEsR0FBQSxPQUFBLENBQUEsSUFBQSxHQUFBLE9BQUEsQ0FBQTtBQUNBLFNBQUEsQ0FBQSxFQUFBLENBQUEsV0FBQSxDQUFBLENBQUE7R0FDQSxDQUFBLENBQUE7RUFFQSxDQUFBLENBQUE7Q0FFQSxDQUFBLENBQUE7QUNuREEsQ0FBQSxZQUFBOztBQUVBLGFBQUEsQ0FBQTs7O0FBR0EsS0FBQSxDQUFBLE1BQUEsQ0FBQSxPQUFBLEVBQUEsTUFBQSxJQUFBLEtBQUEsQ0FBQSx3QkFBQSxDQUFBLENBQUE7O0FBRUEsS0FBQSxHQUFBLEdBQUEsT0FBQSxDQUFBLE1BQUEsQ0FBQSxhQUFBLEVBQUEsRUFBQSxDQUFBLENBQUE7O0FBRUEsSUFBQSxDQUFBLE9BQUEsQ0FBQSxRQUFBLEVBQUEsWUFBQTtBQUNBLE1BQUEsQ0FBQSxNQUFBLENBQUEsRUFBQSxFQUFBLE1BQUEsSUFBQSxLQUFBLENBQUEsc0JBQUEsQ0FBQSxDQUFBO0FBQ0EsU0FBQSxNQUFBLENBQUEsRUFBQSxDQUFBLE1BQUEsQ0FBQSxRQUFBLENBQUEsTUFBQSxDQUFBLENBQUE7RUFDQSxDQUFBLENBQUE7Ozs7O0FBS0EsSUFBQSxDQUFBLFFBQUEsQ0FBQSxhQUFBLEVBQUE7QUFDQSxjQUFBLEVBQUEsb0JBQUE7QUFDQSxhQUFBLEVBQUEsbUJBQUE7QUFDQSxlQUFBLEVBQUEscUJBQUE7QUFDQSxnQkFBQSxFQUFBLHNCQUFBO0FBQ0Esa0JBQUEsRUFBQSx3QkFBQTtBQUNBLGVBQUEsRUFBQSxxQkFBQTtFQUNBLENBQUEsQ0FBQTs7QUFFQSxJQUFBLENBQUEsT0FBQSxDQUFBLGlCQUFBLEVBQUEsVUFBQSxVQUFBLEVBQUEsRUFBQSxFQUFBLFdBQUEsRUFBQTtBQUNBLE1BQUEsVUFBQSxHQUFBO0FBQ0EsTUFBQSxFQUFBLFdBQUEsQ0FBQSxnQkFBQTtBQUNBLE1BQUEsRUFBQSxXQUFBLENBQUEsYUFBQTtBQUNBLE1BQUEsRUFBQSxXQUFBLENBQUEsY0FBQTtBQUNBLE1BQUEsRUFBQSxXQUFBLENBQUEsY0FBQTtHQUNBLENBQUE7QUFDQSxTQUFBO0FBQ0EsZ0JBQUEsRUFBQSx1QkFBQSxRQUFBLEVBQUE7QUFDQSxjQUFBLENBQUEsVUFBQSxDQUFBLFVBQUEsQ0FBQSxRQUFBLENBQUEsTUFBQSxDQUFBLEVBQUEsUUFBQSxDQUFBLENBQUE7QUFDQSxXQUFBLEVBQUEsQ0FBQSxNQUFBLENBQUEsUUFBQSxDQUFBLENBQUE7SUFDQTtHQUNBLENBQUE7RUFDQSxDQUFBLENBQUE7O0FBRUEsSUFBQSxDQUFBLE1BQUEsQ0FBQSxVQUFBLGFBQUEsRUFBQTtBQUNBLGVBQUEsQ0FBQSxZQUFBLENBQUEsSUFBQSxDQUFBLENBQ0EsV0FBQSxFQUNBLFVBQUEsU0FBQSxFQUFBO0FBQ0EsVUFBQSxTQUFBLENBQUEsR0FBQSxDQUFBLGlCQUFBLENBQUEsQ0FBQTtHQUNBLENBQ0EsQ0FBQSxDQUFBO0VBQ0EsQ0FBQSxDQUFBOztBQUVBLElBQUEsQ0FBQSxPQUFBLENBQUEsYUFBQSxFQUFBLFVBQUEsS0FBQSxFQUFBLE9BQUEsRUFBQSxVQUFBLEVBQUEsV0FBQSxFQUFBLEVBQUEsRUFBQTs7QUFFQSxXQUFBLGlCQUFBLENBQUEsUUFBQSxFQUFBO0FBQ0EsT0FBQSxJQUFBLEdBQUEsUUFBQSxDQUFBLElBQUEsQ0FBQTtBQUNBLFVBQUEsQ0FBQSxHQUFBLENBQUEsV0FBQSxDQUFBLENBQUE7QUFDQSxVQUFBLENBQUEsTUFBQSxDQUFBLElBQUEsQ0FBQSxFQUFBLEVBQUEsSUFBQSxDQUFBLElBQUEsQ0FBQSxDQUFBO0FBQ0EsYUFBQSxDQUFBLFVBQUEsQ0FBQSxXQUFBLENBQUEsWUFBQSxDQUFBLENBQUE7QUFDQSxVQUFBLElBQUEsQ0FBQSxJQUFBLENBQUE7R0FDQTs7OztBQUlBLE1BQUEsQ0FBQSxlQUFBLEdBQUEsWUFBQTtBQUNBLFVBQUEsQ0FBQSxDQUFBLE9BQUEsQ0FBQSxJQUFBLENBQUE7R0FDQSxDQUFBOztBQUVBLE1BQUEsQ0FBQSxlQUFBLEdBQUEsVUFBQSxVQUFBLEVBQUE7Ozs7Ozs7Ozs7QUFVQSxPQUFBLElBQUEsQ0FBQSxlQUFBLEVBQUEsSUFBQSxVQUFBLEtBQUEsSUFBQSxFQUFBO0FBQ0EsV0FBQSxFQUFBLENBQUEsSUFBQSxDQUFBLE9BQUEsQ0FBQSxJQUFBLENBQUEsQ0FBQTtJQUNBOzs7OztBQUtBLFVBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQSxVQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsaUJBQUEsQ0FBQSxTQUFBLENBQUEsWUFBQTtBQUNBLFdBQUEsSUFBQSxDQUFBO0lBQ0EsQ0FBQSxDQUFBO0dBRUEsQ0FBQTs7QUFFQSxNQUFBLENBQUEsS0FBQSxHQUFBLFVBQUEsV0FBQSxFQUFBO0FBQ0EsVUFBQSxLQUFBLENBQUEsSUFBQSxDQUFBLFFBQUEsRUFBQSxXQUFBLENBQUEsQ0FDQSxJQUFBLENBQUEsaUJBQUEsQ0FBQSxTQUNBLENBQUEsWUFBQTtBQUNBLFdBQUEsRUFBQSxDQUFBLE1BQUEsQ0FBQSxFQUFBLE9BQUEsRUFBQSw0QkFBQSxFQUFBLENBQUEsQ0FBQTtJQUNBLENBQUEsQ0FBQTtHQUNBLENBQUE7O0FBRUEsTUFBQSxDQUFBLE1BQUEsR0FBQSxZQUFBO0FBQ0EsVUFBQSxLQUFBLENBQUEsR0FBQSxDQUFBLFNBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBQSxZQUFBO0FBQ0EsV0FBQSxDQUFBLE9BQUEsRUFBQSxDQUFBO0FBQ0EsY0FBQSxDQUFBLFVBQUEsQ0FBQSxXQUFBLENBQUEsYUFBQSxDQUFBLENBQUE7SUFDQSxDQUFBLENBQUE7R0FDQSxDQUFBO0VBRUEsQ0FBQSxDQUFBOztBQUVBLElBQUEsQ0FBQSxPQUFBLENBQUEsU0FBQSxFQUFBLFVBQUEsVUFBQSxFQUFBLFdBQUEsRUFBQTs7QUFFQSxNQUFBLElBQUEsR0FBQSxJQUFBLENBQUE7O0FBRUEsWUFBQSxDQUFBLEdBQUEsQ0FBQSxXQUFBLENBQUEsZ0JBQUEsRUFBQSxZQUFBO0FBQ0EsT0FBQSxDQUFBLE9BQUEsRUFBQSxDQUFBO0dBQ0EsQ0FBQSxDQUFBOztBQUVBLFlBQUEsQ0FBQSxHQUFBLENBQUEsV0FBQSxDQUFBLGNBQUEsRUFBQSxZQUFBO0FBQ0EsT0FBQSxDQUFBLE9BQUEsRUFBQSxDQUFBO0dBQ0EsQ0FBQSxDQUFBOztBQUVBLE1BQUEsQ0FBQSxFQUFBLEdBQUEsSUFBQSxDQUFBO0FBQ0EsTUFBQSxDQUFBLElBQUEsR0FBQSxJQUFBLENBQUE7O0FBRUEsTUFBQSxDQUFBLE1BQUEsR0FBQSxVQUFBLFNBQUEsRUFBQSxJQUFBLEVBQUE7QUFDQSxPQUFBLENBQUEsRUFBQSxHQUFBLFNBQUEsQ0FBQTtBQUNBLE9BQUEsQ0FBQSxJQUFBLEdBQUEsSUFBQSxDQUFBO0dBQ0EsQ0FBQTs7QUFFQSxNQUFBLENBQUEsT0FBQSxHQUFBLFlBQUE7QUFDQSxPQUFBLENBQUEsRUFBQSxHQUFBLElBQUEsQ0FBQTtBQUNBLE9BQUEsQ0FBQSxJQUFBLEdBQUEsSUFBQSxDQUFBO0dBQ0EsQ0FBQTtFQUVBLENBQUEsQ0FBQTtDQUVBLENBQUEsRUFBQSxDQUFBOztBQ3JJQSxZQUFBLENBQUE7O0FBRUEsR0FBQSxDQUFBLFVBQUEsQ0FBQSxtQkFBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLFFBQUEsRUFBQTs7O0FBR0EsT0FBQSxDQUFBLFlBQUEsR0FBQSxLQUFBLENBQUE7OztBQUdBLE9BQUEsQ0FBQSxjQUFBLEdBQUEsS0FBQSxDQUFBO0FBQ0EsT0FBQSxDQUFBLGdCQUFBLEdBQUEsWUFBQTtBQUNBLE1BQUEsQ0FBQSxNQUFBLENBQUEsY0FBQSxFQUFBLE1BQUEsQ0FBQSxjQUFBLEdBQUEsSUFBQSxDQUFBLEtBQ0E7QUFDQSxTQUFBLENBQUEsY0FBQSxHQUFBLEtBQUEsQ0FBQTtHQUNBO0VBQ0EsQ0FBQTs7O0FBR0EsT0FBQSxDQUFBLFdBQUEsR0FBQSxZQUFBO0FBQ0EsUUFBQSxDQUFBLGNBQUEsR0FBQSxLQUFBLENBQUE7QUFDQSxVQUFBLENBQUEsWUFBQTtBQUNBLFNBQUEsQ0FBQSxZQUFBLEdBQUEsS0FBQSxDQUFBO0dBQ0EsRUFBQSxHQUFBLENBQUEsQ0FBQTtFQUNBLENBQUE7OztBQUdBLE9BQUEsQ0FBQSxVQUFBLEdBQUEsRUFBQSxDQUFBO0NBRUEsQ0FBQSxDQUFBO0FDM0JBLEdBQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxjQUFBLEVBQUE7O0FBRUEsZUFBQSxDQUFBLEtBQUEsQ0FBQSxPQUFBLEVBQUE7QUFDQSxLQUFBLEVBQUEsUUFBQTtBQUNBLGFBQUEsRUFBQSxxQkFBQTtBQUNBLFlBQUEsRUFBQSxXQUFBO0VBQ0EsQ0FBQSxDQUFBO0NBRUEsQ0FBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxVQUFBLENBQUEsV0FBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLFdBQUEsRUFBQSxNQUFBLEVBQUE7O0FBRUEsT0FBQSxDQUFBLEtBQUEsR0FBQSxFQUFBLENBQUE7QUFDQSxPQUFBLENBQUEsS0FBQSxHQUFBLElBQUEsQ0FBQTs7QUFFQSxPQUFBLENBQUEsU0FBQSxHQUFBLFVBQUEsU0FBQSxFQUFBO0FBQ0EsU0FBQSxDQUFBLEdBQUEsQ0FBQSxnQkFBQSxDQUFBLENBQUE7QUFDQSxRQUFBLENBQUEsS0FBQSxHQUFBLElBQUEsQ0FBQTs7QUFFQSxhQUFBLENBQUEsS0FBQSxDQUFBLFNBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBQSxZQUFBO0FBQ0EsU0FBQSxDQUFBLEVBQUEsQ0FBQSxNQUFBLENBQUEsQ0FBQTtHQUNBLENBQUEsU0FBQSxDQUFBLFlBQUE7QUFDQSxTQUFBLENBQUEsS0FBQSxHQUFBLDRCQUFBLENBQUE7R0FDQSxDQUFBLENBQUE7RUFFQSxDQUFBO0NBRUEsQ0FBQSxDQUFBO0FDM0JBLFlBQUEsQ0FBQTs7QUFFQSxHQUFBLENBQUEsT0FBQSxDQUFBLE9BQUEsRUFBQSxVQUFBLEtBQUEsRUFBQTs7QUFFQSxVQUFBLEtBQUEsQ0FBQSxLQUFBLEVBQUE7QUFDQSxTQUFBLENBQUEsTUFBQSxDQUFBLElBQUEsRUFBQSxLQUFBLENBQUEsQ0FBQTtFQUNBO0FBQ0EsTUFBQSxDQUFBLEdBQUEsR0FBQSxhQUFBLENBQUE7QUFDQSxPQUFBLENBQUEsY0FBQSxDQUFBLEtBQUEsQ0FBQSxTQUFBLEVBQUEsS0FBQSxFQUFBO0FBQ0EsS0FBQSxFQUFBLGVBQUE7QUFDQSxVQUFBLEtBQUEsQ0FBQSxHQUFBLEdBQUEsSUFBQSxDQUFBLEdBQUEsQ0FBQTtHQUNBO0VBQ0EsQ0FBQSxDQUFBOzs7QUFHQSxLQUFBLFNBQUEsR0FBQTtBQUNBLGNBQUEsRUFBQSwyQ0FBQTtBQUNBLFNBQUEsRUFBQSxXQUFBO0VBQ0EsQ0FBQTs7O0FBR0EsTUFBQSxDQUFBLFNBQUEsQ0FBQSxLQUFBLEdBQUEsWUFBQTtBQUNBLFNBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQSxJQUFBLENBQUEsR0FBQSxDQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0EsVUFBQSxJQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUEsSUFBQSxDQUFBLENBQUE7R0FDQSxDQUFBLENBQUE7RUFDQSxDQUFBOztBQUVBLE1BQUEsQ0FBQSxRQUFBLEdBQUEsWUFBQTs7Ozs7O0FBTUEsU0FBQSxDQUNBO0FBQ0EsTUFBQSxFQUFBLEtBQUE7QUFDQSxRQUFBLEVBQUEsaUJBQUE7QUFDQSxrQkFBQSxFQUFBLHFDQUFBO0FBQ0EsZUFBQSxFQUFBLDJDQUFBO0FBQ0EsVUFBQSxFQUFBLFdBQUE7QUFDQSxPQUFBLEVBQUEsQ0FBQSxhQUFBLEVBQUEsVUFBQSxDQUFBO0dBQ0EsRUFDQTtBQUNBLE1BQUEsRUFBQSxLQUFBO0FBQ0EsUUFBQSxFQUFBLFFBQUE7QUFDQSxrQkFBQSxFQUFBLDZCQUFBO0FBQ0EsZUFBQSxFQUFBLG9CQUFBO0FBQ0EsVUFBQSxFQUFBLGVBQUE7QUFDQSxPQUFBLEVBQUEsQ0FBQSxXQUFBLEVBQUEsWUFBQSxDQUFBO0dBQ0EsRUFDQTtBQUNBLE1BQUEsRUFBQSxLQUFBO0FBQ0EsUUFBQSxFQUFBLGlCQUFBO0FBQ0Esa0JBQUEsRUFBQSxxQ0FBQTtBQUNBLGVBQUEsRUFBQSwyQ0FBQTtBQUNBLFVBQUEsRUFBQSxXQUFBO0FBQ0EsT0FBQSxFQUFBLENBQUEsYUFBQSxFQUFBLFVBQUEsQ0FBQTtHQUNBLEVBQ0E7QUFDQSxNQUFBLEVBQUEsS0FBQTtBQUNBLFFBQUEsRUFBQSxRQUFBO0FBQ0Esa0JBQUEsRUFBQSw2QkFBQTtBQUNBLGVBQUEsRUFBQSxvQkFBQTtBQUNBLFVBQUEsRUFBQSxlQUFBO0FBQ0EsT0FBQSxFQUFBLENBQUEsV0FBQSxFQUFBLFlBQUEsQ0FBQTtHQUNBLEVBQ0E7QUFDQSxNQUFBLEVBQUEsS0FBQTtBQUNBLFFBQUEsRUFBQSxpQkFBQTtBQUNBLGtCQUFBLEVBQUEscUNBQUE7QUFDQSxlQUFBLEVBQUEsMkNBQUE7QUFDQSxVQUFBLEVBQUEsV0FBQTtBQUNBLE9BQUEsRUFBQSxDQUFBLGFBQUEsRUFBQSxVQUFBLENBQUE7R0FDQSxFQUNBO0FBQ0EsTUFBQSxFQUFBLEtBQUE7QUFDQSxRQUFBLEVBQUEsUUFBQTtBQUNBLGtCQUFBLEVBQUEsNkJBQUE7QUFDQSxlQUFBLEVBQUEsb0JBQUE7QUFDQSxVQUFBLEVBQUEsZUFBQTtBQUNBLE9BQUEsRUFBQSxDQUFBLFdBQUEsRUFBQSxZQUFBLENBQUE7R0FDQSxFQUNBO0FBQ0EsTUFBQSxFQUFBLEtBQUE7QUFDQSxRQUFBLEVBQUEsUUFBQTtBQUNBLGtCQUFBLEVBQUEsNkJBQUE7QUFDQSxlQUFBLEVBQUEsb0JBQUE7QUFDQSxVQUFBLEVBQUEsZUFBQTtBQUNBLE9BQUEsRUFBQSxDQUFBLFdBQUEsRUFBQSxZQUFBLENBQUE7R0FDQSxFQUNBO0FBQ0EsTUFBQSxFQUFBLEtBQUE7QUFDQSxRQUFBLEVBQUEsaUJBQUE7QUFDQSxrQkFBQSxFQUFBLHFDQUFBO0FBQ0EsZUFBQSxFQUFBLDJDQUFBO0FBQ0EsVUFBQSxFQUFBLFdBQUE7QUFDQSxPQUFBLEVBQUEsQ0FBQSxhQUFBLEVBQUEsVUFBQSxDQUFBO0dBQ0EsRUFDQTtBQUNBLE1BQUEsRUFBQSxLQUFBO0FBQ0EsUUFBQSxFQUFBLFFBQUE7QUFDQSxrQkFBQSxFQUFBLDZCQUFBO0FBQ0EsZUFBQSxFQUFBLG9CQUFBO0FBQ0EsVUFBQSxFQUFBLGVBQUE7QUFDQSxPQUFBLEVBQUEsQ0FBQSxXQUFBLEVBQUEsWUFBQSxDQUFBO0dBQ0EsRUFDQTtBQUNBLE1BQUEsRUFBQSxLQUFBO0FBQ0EsUUFBQSxFQUFBLFFBQUE7QUFDQSxrQkFBQSxFQUFBLDZCQUFBO0FBQ0EsZUFBQSxFQUFBLG9CQUFBO0FBQ0EsVUFBQSxFQUFBLGVBQUE7QUFDQSxPQUFBLEVBQUEsQ0FBQSxXQUFBLEVBQUEsWUFBQSxDQUFBO0dBQ0EsRUFDQTtBQUNBLE1BQUEsRUFBQSxLQUFBO0FBQ0EsUUFBQSxFQUFBLFFBQUE7QUFDQSxrQkFBQSxFQUFBLDZCQUFBO0FBQ0EsZUFBQSxFQUFBLG9CQUFBO0FBQ0EsVUFBQSxFQUFBLGVBQUE7QUFDQSxPQUFBLEVBQUEsQ0FBQSxXQUFBLEVBQUEsWUFBQSxDQUFBO0dBQ0EsRUFDQTtBQUNBLE1BQUEsRUFBQSxLQUFBO0FBQ0EsUUFBQSxFQUFBLGlCQUFBO0FBQ0Esa0JBQUEsRUFBQSxxQ0FBQTtBQUNBLGVBQUEsRUFBQSwyQ0FBQTtBQUNBLFVBQUEsRUFBQSxXQUFBO0FBQ0EsT0FBQSxFQUFBLENBQUEsYUFBQSxFQUFBLFVBQUEsQ0FBQTtHQUNBLEVBQ0E7QUFDQSxNQUFBLEVBQUEsS0FBQTtBQUNBLFFBQUEsRUFBQSxRQUFBO0FBQ0Esa0JBQUEsRUFBQSw2QkFBQTtBQUNBLGVBQUEsRUFBQSxvQkFBQTtBQUNBLFVBQUEsRUFBQSxlQUFBO0FBQ0EsT0FBQSxFQUFBLENBQUEsV0FBQSxFQUFBLFlBQUEsQ0FBQTtHQUNBLEVBQ0E7QUFDQSxNQUFBLEVBQUEsS0FBQTtBQUNBLFFBQUEsRUFBQSxpQkFBQTtBQUNBLGtCQUFBLEVBQUEscUNBQUE7QUFDQSxlQUFBLEVBQUEsMkNBQUE7QUFDQSxVQUFBLEVBQUEsV0FBQTtBQUNBLE9BQUEsRUFBQSxDQUFBLGFBQUEsRUFBQSxVQUFBLENBQUE7R0FDQSxFQUNBO0FBQ0EsTUFBQSxFQUFBLEtBQUE7QUFDQSxRQUFBLEVBQUEsUUFBQTtBQUNBLGtCQUFBLEVBQUEsNkJBQUE7QUFDQSxlQUFBLEVBQUEsb0JBQUE7QUFDQSxVQUFBLEVBQUEsZUFBQTtBQUNBLE9BQUEsRUFBQSxDQUFBLFdBQUEsRUFBQSxZQUFBLENBQUE7R0FDQSxFQUNBO0FBQ0EsTUFBQSxFQUFBLEtBQUE7QUFDQSxRQUFBLEVBQUEsaUJBQUE7QUFDQSxrQkFBQSxFQUFBLHFDQUFBO0FBQ0EsZUFBQSxFQUFBLDJDQUFBO0FBQ0EsVUFBQSxFQUFBLFdBQUE7QUFDQSxPQUFBLEVBQUEsQ0FBQSxhQUFBLEVBQUEsVUFBQSxDQUFBO0dBQ0EsRUFDQTtBQUNBLE1BQUEsRUFBQSxLQUFBO0FBQ0EsUUFBQSxFQUFBLFFBQUE7QUFDQSxrQkFBQSxFQUFBLDZCQUFBO0FBQ0EsZUFBQSxFQUFBLG9CQUFBO0FBQ0EsVUFBQSxFQUFBLGVBQUE7QUFDQSxPQUFBLEVBQUEsQ0FBQSxXQUFBLEVBQUEsWUFBQSxDQUFBO0dBQ0EsRUFDQTtBQUNBLE1BQUEsRUFBQSxLQUFBO0FBQ0EsUUFBQSxFQUFBLGlCQUFBO0FBQ0Esa0JBQUEsRUFBQSxxQ0FBQTtBQUNBLGVBQUEsRUFBQSwyQ0FBQTtBQUNBLFVBQUEsRUFBQSxXQUFBO0FBQ0EsT0FBQSxFQUFBLENBQUEsYUFBQSxFQUFBLFVBQUEsQ0FBQTtHQUNBLEVBQ0E7QUFDQSxNQUFBLEVBQUEsS0FBQTtBQUNBLFFBQUEsRUFBQSxRQUFBO0FBQ0Esa0JBQUEsRUFBQSw2QkFBQTtBQUNBLGVBQUEsRUFBQSxvQkFBQTtBQUNBLFVBQUEsRUFBQSxlQUFBO0FBQ0EsT0FBQSxFQUFBLENBQUEsV0FBQSxFQUFBLFlBQUEsQ0FBQTtHQUNBLEVBQ0E7QUFDQSxNQUFBLEVBQUEsS0FBQTtBQUNBLFFBQUEsRUFBQSxRQUFBO0FBQ0Esa0JBQUEsRUFBQSw2QkFBQTtBQUNBLGVBQUEsRUFBQSxvQkFBQTtBQUNBLFVBQUEsRUFBQSxlQUFBO0FBQ0EsT0FBQSxFQUFBLENBQUEsV0FBQSxFQUFBLFlBQUEsQ0FBQTtHQUNBLEVBQ0E7QUFDQSxNQUFBLEVBQUEsS0FBQTtBQUNBLFFBQUEsRUFBQSxpQkFBQTtBQUNBLGtCQUFBLEVBQUEscUNBQUE7QUFDQSxlQUFBLEVBQUEsMkNBQUE7QUFDQSxVQUFBLEVBQUEsV0FBQTtBQUNBLE9BQUEsRUFBQSxDQUFBLGFBQUEsRUFBQSxVQUFBLENBQUE7R0FDQSxFQUNBO0FBQ0EsTUFBQSxFQUFBLEtBQUE7QUFDQSxRQUFBLEVBQUEsUUFBQTtBQUNBLGtCQUFBLEVBQUEsNkJBQUE7QUFDQSxlQUFBLEVBQUEsb0JBQUE7QUFDQSxVQUFBLEVBQUEsZUFBQTtBQUNBLE9BQUEsRUFBQSxDQUFBLFdBQUEsRUFBQSxZQUFBLENBQUE7R0FDQSxFQUNBO0FBQ0EsTUFBQSxFQUFBLEtBQUE7QUFDQSxRQUFBLEVBQUEsUUFBQTtBQUNBLGtCQUFBLEVBQUEsNkJBQUE7QUFDQSxlQUFBLEVBQUEsb0JBQUE7QUFDQSxVQUFBLEVBQUEsZUFBQTtBQUNBLE9BQUEsRUFBQSxDQUFBLFdBQUEsRUFBQSxZQUFBLENBQUE7R0FDQSxFQUNBO0FBQ0EsTUFBQSxFQUFBLEtBQUE7QUFDQSxRQUFBLEVBQUEsUUFBQTtBQUNBLGtCQUFBLEVBQUEsNkJBQUE7QUFDQSxlQUFBLEVBQUEsb0JBQUE7QUFDQSxVQUFBLEVBQUEsZUFBQTtBQUNBLE9BQUEsRUFBQSxDQUFBLFdBQUEsRUFBQSxZQUFBLENBQUE7R0FDQSxFQUNBO0FBQ0EsTUFBQSxFQUFBLEtBQUE7QUFDQSxRQUFBLEVBQUEsaUJBQUE7QUFDQSxrQkFBQSxFQUFBLHFDQUFBO0FBQ0EsZUFBQSxFQUFBLDJDQUFBO0FBQ0EsVUFBQSxFQUFBLFdBQUE7QUFDQSxPQUFBLEVBQUEsQ0FBQSxhQUFBLEVBQUEsVUFBQSxDQUFBO0dBQ0EsRUFDQTtBQUNBLE1BQUEsRUFBQSxLQUFBO0FBQ0EsUUFBQSxFQUFBLFFBQUE7QUFDQSxrQkFBQSxFQUFBLDZCQUFBO0FBQ0EsZUFBQSxFQUFBLG9CQUFBO0FBQ0EsVUFBQSxFQUFBLGVBQUE7QUFDQSxPQUFBLEVBQUEsQ0FBQSxXQUFBLEVBQUEsWUFBQSxDQUFBO0dBQ0EsQ0FBQSxDQUFBO0VBRUEsQ0FBQTs7O0FBSUEsTUFBQSxDQUFBLGNBQUEsR0FBQSxVQUFBLE1BQUEsRUFBQTtBQUNBLFdBQUEsQ0FBQSxZQUFBLEdBQUEsTUFBQSxDQUFBO0FBQ0EsU0FBQSxTQUFBLENBQUE7RUFDQSxDQUFBO0FBQ0EsTUFBQSxDQUFBLFdBQUEsR0FBQSxVQUFBLE1BQUEsRUFBQTs7QUFFQSxXQUFBLEdBQUEsTUFBQSxJQUFBO0FBQ0EsTUFBQSxFQUFBLEtBQUE7QUFDQSxRQUFBLEVBQUEsaUJBQUE7QUFDQSxrQkFBQSxFQUFBLHFDQUFBO0FBQ0EsZUFBQSxFQUFBLDJDQUFBO0FBQ0EsVUFBQSxFQUFBLFdBQUE7QUFDQSxPQUFBLEVBQUEsQ0FBQSxhQUFBLEVBQUEsVUFBQSxDQUFBO0dBQ0EsQ0FBQTtFQUNBLENBQUE7QUFDQSxNQUFBLENBQUEsV0FBQSxHQUFBLFlBQUE7QUFDQSxTQUFBLFNBQUEsQ0FBQSxZQUFBLENBQUE7RUFDQSxDQUFBO0FBQ0EsTUFBQSxDQUFBLFFBQUEsR0FBQSxZQUFBO0FBQ0EsU0FBQSxTQUFBLENBQUE7RUFDQSxDQUFBOztBQUlBLFFBQUEsS0FBQSxDQUFBO0NBRUEsQ0FBQSxDQUFBO0FDalJBLEdBQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxjQUFBLEVBQUE7O0FBRUEsZUFBQSxDQUFBLEtBQUEsQ0FBQSxRQUFBLEVBQUE7QUFDQSxLQUFBLEVBQUEsU0FBQTtBQUNBLGFBQUEsRUFBQSx5QkFBQTtBQUNBLFlBQUEsRUFBQSxZQUFBO0VBQ0EsQ0FBQSxDQUFBO0NBRUEsQ0FBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxVQUFBLENBQUEsWUFBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLE1BQUEsRUFBQSxNQUFBLEVBQUE7O0FBRUEsT0FBQSxDQUFBLEtBQUEsR0FBQSxFQUFBLENBQUE7QUFDQSxPQUFBLENBQUEsS0FBQSxHQUFBLElBQUEsQ0FBQTs7QUFFQSxPQUFBLENBQUEsVUFBQSxHQUFBLFVBQUEsVUFBQSxFQUFBOztBQUVBLFFBQUEsQ0FBQSxLQUFBLEdBQUEsSUFBQSxDQUFBOztBQUVBLFFBQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxDQUFBLENBQUEsSUFBQSxDQUFBLFlBQUE7QUFDQSxTQUFBLENBQUEsRUFBQSxDQUFBLFNBQUEsQ0FBQSxDQUFBO0dBQ0EsQ0FBQSxTQUFBLENBQUEsWUFBQTtBQUNBLFNBQUEsQ0FBQSxLQUFBLEdBQUEsNEJBQUEsQ0FBQTtHQUNBLENBQUEsQ0FBQTtFQUVBLENBQUE7O0FBRUEsT0FBQSxDQUFBLFFBQUEsR0FBQSxZQUFBO0FBQ0EsUUFBQSxDQUFBLFFBQUEsRUFBQSxDQUFBLElBQUEsQ0FBQSxVQUFBLEtBQUEsRUFBQTtBQUNBLFVBQUEsQ0FBQSxHQUFBLENBQUEsS0FBQSxDQUFBLENBQUE7R0FDQSxDQUFBLENBQUE7RUFDQSxDQUFBO0NBRUEsQ0FBQSxDQUFBOztBQ2pDQSxZQUFBLENBQUE7O0FBRUEsR0FBQSxDQUFBLFVBQUEsQ0FBQSxrQkFBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLEVBRUEsQ0FBQSxDQUFBO0FDSkEsWUFBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxjQUFBLEVBQUE7QUFDQSxlQUFBLENBQUEsS0FBQSxDQUFBLFFBQUEsRUFBQTtBQUNBLEtBQUEsRUFBQSxTQUFBO0FBQ0EsYUFBQSxFQUFBLHVCQUFBO0FBQ0EsWUFBQSxFQUFBLGtCQUFBO0VBQ0EsQ0FBQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBO0FDUkEsWUFBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxVQUFBLENBQUEsZ0JBQUEsRUFBQSxVQUFBLE1BQUEsRUFBQSxJQUFBLEVBQUE7QUFDQSxPQUFBLENBQUEsSUFBQSxHQUFBLElBQUEsQ0FBQTtDQUNBLENBQUEsQ0FBQTtBQ0pBLFlBQUEsQ0FBQTs7QUFFQSxHQUFBLENBQUEsT0FBQSxDQUFBLE1BQUEsRUFBQSxVQUFBLEtBQUEsRUFBQTs7QUFFQSxVQUFBLElBQUEsQ0FBQSxLQUFBLEVBQUE7QUFDQSxTQUFBLENBQUEsTUFBQSxDQUFBLElBQUEsRUFBQSxLQUFBLENBQUEsQ0FBQTtFQUNBO0FBQ0EsS0FBQSxDQUFBLEdBQUEsR0FBQSxVQUFBLENBQUE7Ozs7QUFJQSxRQUFBLElBQUEsQ0FBQTtDQUNBLENBQUEsQ0FBQTtBQ1pBLFlBQUEsQ0FBQTs7QUFFQSxHQUFBLENBQUEsTUFBQSxDQUFBLFVBQUEsY0FBQSxFQUFBO0FBQ0EsZUFBQSxDQUFBLEtBQUEsQ0FBQSxNQUFBLEVBQUE7QUFDQSxLQUFBLEVBQUEsb0JBQUE7QUFDQSxhQUFBLEVBQUEsbUJBQUE7QUFDQSxZQUFBLEVBQUEsZ0JBQUE7QUFDQSxTQUFBLEVBQUE7QUFDQSxPQUFBLEVBQUEsY0FBQSxJQUFBLEVBQUEsWUFBQSxFQUFBOzs7QUFHQSxRQUFBLElBQUEsR0FBQTtBQUNBLGFBQUEsRUFBQSxlQUFBO0FBQ0EsZ0JBQUEsRUFBQSxNQUFBO0tBQ0EsQ0FBQTs7O0FBR0EsV0FBQSxJQUFBLENBQUE7SUFDQTtHQUNBO0VBQ0EsQ0FBQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBOztBQ3JCQSxZQUFBLENBQUE7O0FBRUEsR0FBQSxDQUFBLFNBQUEsQ0FBQSxZQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsUUFBQSxFQUFBO0FBQ0EsUUFBQTtBQUNBLFVBQUEsRUFBQSxHQUFBO0FBQ0EsTUFBQSxFQUFBLGNBQUEsS0FBQSxFQUFBLE9BQUEsRUFBQSxLQUFBLEVBQUE7QUFDQSxPQUFBLE1BQUEsR0FBQSxNQUFBLENBQUEsS0FBQSxDQUFBLFVBQUEsQ0FBQSxDQUFBO0FBQ0EsUUFBQSxDQUFBLE1BQUEsQ0FBQSxNQUFBLEVBQUEsVUFBQSxHQUFBLEVBQUE7QUFDQSxXQUFBLENBQUEsR0FBQSxDQUFBLFdBQUEsRUFBQSxHQUFBLENBQUEsQ0FBQTtBQUNBLFFBQUEsR0FBQSxLQUFBLElBQUEsRUFBQTtBQUNBLGFBQUEsQ0FBQSxZQUFBO0FBQ0EsYUFBQSxDQUFBLENBQUEsQ0FBQSxDQUFBLEtBQUEsRUFBQSxDQUFBO01BQ0EsQ0FBQSxDQUFBO0tBQ0E7SUFDQSxDQUFBLENBQUE7R0FDQTtFQUNBLENBQUE7Q0FDQSxDQUFBLENBQUE7O0FDaEJBLEdBQUEsQ0FBQSxPQUFBLENBQUEsUUFBQSxFQUFBLFVBQUEsS0FBQSxFQUFBLE1BQUEsRUFBQSxTQUFBLEVBQUE7QUFDQSxRQUFBO0FBQ0EsUUFBQSxFQUFBLGdCQUFBLFdBQUEsRUFBQTtBQUNBLFVBQUEsS0FBQSxDQUFBLElBQUEsQ0FBQSxVQUFBLEVBQUEsV0FBQSxDQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0EsV0FBQSxDQUFBLEdBQUEsQ0FBQSxHQUFBLENBQUEsSUFBQSxDQUFBLENBQUE7QUFDQSxXQUFBLEdBQUEsQ0FBQSxJQUFBLENBQUE7SUFDQSxDQUFBLENBQUE7R0FDQTs7QUFFQSxVQUFBLEVBQUEsb0JBQUE7QUFDQSxVQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUEsVUFBQSxDQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsUUFBQSxFQUFBO0FBQ0EsV0FBQSxRQUFBLENBQUEsSUFBQSxDQUFBO0lBQ0EsQ0FBQSxDQUFBO0dBQ0E7RUFDQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBOztBQ2hCQSxZQUFBLENBQUE7O0FBRUEsR0FBQSxDQUFBLFNBQUEsQ0FBQSxZQUFBLEVBQUEsWUFBQTtBQUNBLFFBQUE7QUFDQSxVQUFBLEVBQUEsR0FBQTtBQUNBLGFBQUEsRUFBQSwwQ0FBQTtBQUNBLFlBQUEsRUFBQSxtQkFBQTtFQUNBLENBQUE7Q0FDQSxDQUFBLENBQUE7QUNSQSxZQUFBLENBQUE7O0FBRUEsR0FBQSxDQUFBLFNBQUEsQ0FBQSxhQUFBLEVBQUEsWUFBQTtBQUNBLFFBQUE7QUFDQSxPQUFBLEVBQUE7QUFDQSxlQUFBLEVBQUEsR0FBQTtHQUNBO0FBQ0EsVUFBQSxFQUFBLEdBQUE7QUFDQSxhQUFBLEVBQUEsOENBQUE7RUFDQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBO0FDVkEsWUFBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxTQUFBLENBQUEsUUFBQSxFQUFBLFlBQUE7QUFDQSxRQUFBO0FBQ0EsVUFBQSxFQUFBLEdBQUE7QUFDQSxhQUFBLEVBQUEsa0NBQUE7QUFDQSxZQUFBLEVBQUEsbUJBQUE7RUFDQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBO0FDUkEsWUFBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxTQUFBLENBQUEsV0FBQSxFQUFBLFlBQUE7QUFDQSxRQUFBO0FBQ0EsVUFBQSxFQUFBLEdBQUE7QUFDQSxhQUFBLEVBQUEsd0NBQUE7RUFDQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBO0FDUEEsWUFBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxVQUFBLENBQUEsdUJBQUEsRUFBQSxVQUFBLE1BQUEsRUFBQSxLQUFBLEVBQUEsS0FBQSxFQUFBLE1BQUEsRUFBQTtBQUNBLE9BQUEsQ0FBQSxLQUFBLEdBQUEsS0FBQSxDQUFBO0FBQ0EsT0FBQSxDQUFBLE1BQUEsR0FBQSxNQUFBLENBQUE7Q0FDQSxDQUFBLENBQUE7QUNMQSxZQUFBLENBQUE7O0FBRUEsR0FBQSxDQUFBLE1BQUEsQ0FBQSxVQUFBLGNBQUEsRUFBQTtBQUNBLGVBQUEsQ0FBQSxLQUFBLENBQUEsT0FBQSxFQUFBO0FBQ0EsS0FBQSxFQUFBLFlBQUE7QUFDQSxhQUFBLEVBQUEsdUNBQUE7QUFDQSxZQUFBLEVBQUEsdUJBQUE7QUFDQSxTQUFBLEVBQUE7QUFDQSxRQUFBLEVBQUEsZUFBQSxLQUFBLEVBQUEsWUFBQSxFQUFBOzs7QUFHQSxRQUFBLEtBQUEsR0FBQTtBQUNBLFFBQUEsRUFBQSxLQUFBO0FBQ0EsVUFBQSxFQUFBLFFBQUE7QUFDQSxvQkFBQSxFQUFBLDhCQUFBO0FBQ0EsaUJBQUEsRUFBQSxvQkFBQTtBQUNBLFlBQUEsRUFBQSxlQUFBO0FBQ0EsU0FBQSxFQUFBLENBQUEsV0FBQSxFQUFBLFlBQUEsQ0FBQTtLQUNBLENBQUE7OztBQUdBLFNBQUEsQ0FBQSxXQUFBLENBQUEsS0FBQSxDQUFBLENBQUE7OztBQUdBLFdBQUEsS0FBQSxDQUFBO0lBQ0E7QUFDQSxTQUFBLEVBQUEsZ0JBQUEsS0FBQSxFQUFBO0FBQ0EsV0FBQSxLQUFBLENBQUEsUUFBQSxFQUFBLENBQUE7SUFDQTtHQUNBO0VBQ0EsQ0FBQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBO0FDL0JBLFlBQUEsQ0FBQTs7QUFFQSxHQUFBLENBQUEsVUFBQSxDQUFBLG1CQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsTUFBQSxFQUFBLEtBQUEsRUFBQTs7QUFFQSxPQUFBLENBQUEsV0FBQSxHQUFBLFlBQUE7QUFDQSxTQUFBLENBQUEsR0FBQSxDQUFBLE1BQUEsQ0FBQSxNQUFBLENBQUEsQ0FBQTtBQUNBLE9BQUEsQ0FBQSxXQUFBLEVBQUEsQ0FBQTtFQUNBLENBQUE7O0FBRUEsT0FBQSxDQUFBLE1BQUEsR0FBQSxNQUFBLENBQUE7Q0FFQSxDQUFBLENBQUE7QUNYQSxZQUFBLENBQUE7O0FBRUEsR0FBQSxDQUFBLE1BQUEsQ0FBQSxVQUFBLGNBQUEsRUFBQTs7QUFFQSxlQUFBLENBQUEsS0FBQSxDQUFBLFNBQUEsRUFBQTtBQUNBLEtBQUEsRUFBQSxHQUFBO0FBQ0EsYUFBQSxFQUFBLGlDQUFBO0FBQ0EsWUFBQSxFQUFBLG1CQUFBO0FBQ0EsU0FBQSxFQUFBO0FBQ0EsU0FBQSxFQUFBLGdCQUFBLEtBQUEsRUFBQTs7QUFFQSxTQUFBLENBQUEsV0FBQSxDQUFBO0FBQ0EsUUFBQSxFQUFBLEtBQUE7QUFDQSxVQUFBLEVBQUEsaUJBQUE7QUFDQSxvQkFBQSxFQUFBLHNDQUFBO0FBQ0EsaUJBQUEsRUFBQSwyQ0FBQTtBQUNBLFlBQUEsRUFBQSxXQUFBO0FBQ0EsU0FBQSxFQUFBLENBQUEsYUFBQSxFQUFBLFVBQUEsQ0FBQTtLQUNBLENBQUEsQ0FBQTs7O0FBR0EsV0FBQSxLQUFBLENBQUEsUUFBQSxFQUFBLENBQUE7SUFDQTtHQUNBO0VBQ0EsQ0FBQSxDQUFBO0NBRUEsQ0FBQSxDQUFBO0FDMUJBLFlBQUEsQ0FBQTs7QUFFQSxHQUFBLENBQUEsVUFBQSxDQUFBLGtCQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsS0FBQSxFQUFBOztBQUVBLE9BQUEsQ0FBQSxLQUFBLEdBQUEsS0FBQSxDQUFBLFFBQUEsRUFBQSxDQUFBOztBQUVBLE9BQUEsQ0FBQSxNQUFBLENBQUEsWUFBQTtBQUNBLFNBQUEsS0FBQSxDQUFBLFdBQUEsRUFBQSxDQUFBO0VBQ0EsRUFBQSxVQUFBLE1BQUEsRUFBQSxNQUFBLEVBQUE7QUFDQSxRQUFBLENBQUEsS0FBQSxHQUFBLEtBQUEsQ0FBQSxRQUFBLEVBQUEsQ0FBQTtFQUNBLENBQUEsQ0FBQTtDQUVBLENBQUEsQ0FBQTtBQ1pBLFlBQUEsQ0FBQTs7QUFFQSxHQUFBLENBQUEsU0FBQSxDQUFBLFNBQUEsRUFBQSxZQUFBO0FBQ0EsUUFBQTtBQUNBLFVBQUEsRUFBQSxHQUFBO0FBQ0EsWUFBQSxFQUFBLGtCQUFBO0FBQ0EsTUFBQSxFQUFBLGNBQUEsS0FBQSxFQUFBLE9BQUEsRUFBQSxJQUFBLEVBQUE7OztBQUdBLFFBQUEsQ0FBQSxXQUFBLEdBQUEsQ0FBQSxDQUFBLGVBQUEsQ0FBQSxDQUFBO0FBQ0EsT0FBQSxnQkFBQSxHQUFBLEtBQUEsQ0FBQSxXQUFBLENBQUEsS0FBQSxFQUFBLENBQUE7QUFDQSxPQUFBLGlCQUFBLEdBQUEsS0FBQSxDQUFBLFdBQUEsQ0FBQSxNQUFBLEVBQUEsQ0FBQTtBQUNBLE9BQUEseUJBQUEsR0FBQSxnQkFBQSxHQUFBLElBQUEsQ0FBQTs7O0FBR0EsT0FBQSxNQUFBLENBQUE7QUFDQSxRQUFBLENBQUEsTUFBQSxHQUFBLE1BQUEsQ0FBQTtBQUNBLE9BQUEsS0FBQSxDQUFBO0FBQ0EsUUFBQSxDQUFBLEtBQUEsR0FBQSxLQUFBLENBQUE7QUFDQSxPQUFBLFFBQUEsQ0FBQTtBQUNBLFFBQUEsQ0FBQSxRQUFBLEdBQUEsUUFBQSxDQUFBO0FBQ0EsT0FBQSxRQUFBLENBQUE7QUFDQSxRQUFBLENBQUEsUUFBQSxHQUFBLFFBQUEsQ0FBQTs7O0FBR0EsT0FBQSxFQUFBLENBQUE7OztBQUdBLE9BQUEsT0FBQSxHQUFBLElBQUEsS0FBQSxDQUFBLFlBQUEsRUFBQSxDQUFBO0FBQ0EsT0FBQSxPQUFBLEdBQUEsSUFBQSxLQUFBLENBQUEsVUFBQSxFQUFBLENBQUE7OztBQUdBLFFBQUEsQ0FBQSxNQUFBLENBQUEsb0JBQUEsRUFBQSxVQUFBLFFBQUEsRUFBQSxRQUFBLEVBQUE7QUFDQSxRQUFBLFFBQUEsSUFBQSxRQUFBLEVBQUE7QUFDQSxjQUFBLENBQUEsUUFBQSxDQUFBLENBQUE7S0FDQTtJQUNBLENBQUEsQ0FBQTs7O0FBR0EsWUFBQSxTQUFBLENBQUEsTUFBQSxFQUFBO0FBQ0EsV0FBQSxDQUFBLElBQUEsQ0FBQSxNQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUE7QUFDQSxXQUFBLENBQUEsS0FBQSxDQUFBLENBQUEsR0FBQSxNQUFBLENBQUEsS0FBQSxDQUFBLENBQUEsR0FBQSxNQUFBLENBQUEsS0FBQSxDQUFBLENBQUEsR0FBQSxJQUFBLEdBQUEseUJBQUEsQ0FBQTtBQUNBLFdBQUEsQ0FBQSxRQUFBLENBQUEsQ0FBQSxHQUFBLEVBQUEsQ0FBQTtBQUNBLFdBQUEsQ0FBQSxZQUFBLEVBQUEsQ0FBQTtBQUNBLFNBQUEsUUFBQSxFQUFBLEtBQUEsQ0FBQSxNQUFBLENBQUEsUUFBQSxDQUFBLENBQUE7QUFDQSxVQUFBLENBQUEsR0FBQSxDQUFBLE1BQUEsQ0FBQSxDQUFBOztBQUVBLGFBQUEsR0FBQSxNQUFBLENBQUE7S0FDQSxDQUFBLENBQUE7SUFDQTs7O0FBR0EsWUFBQSxDQUFBLEtBQUEsQ0FBQSxLQUFBLENBQUEsWUFBQSxDQUFBLENBQUE7QUFDQSxVQUFBLEVBQUEsQ0FBQTs7O0FBR0EsWUFBQSxJQUFBLEdBQUE7OztBQUdBLFVBQUEsR0FBQSxJQUFBLEtBQUEsQ0FBQSxpQkFBQSxDQUFBLEVBQUEsRUFBQSxnQkFBQSxHQUFBLGlCQUFBLEVBQUEsQ0FBQSxFQUFBLElBQUEsQ0FBQSxDQUFBO0FBQ0EsVUFBQSxDQUFBLFFBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQSxFQUFBLENBQUEsRUFBQSxDQUFBLENBQUEsQ0FBQTs7O0FBR0EsU0FBQSxHQUFBLElBQUEsS0FBQSxDQUFBLEtBQUEsRUFBQSxDQUFBOzs7O0FBSUEsU0FBQSxDQUFBLEdBQUEsQ0FBQSxJQUFBLEtBQUEsQ0FBQSxZQUFBLENBQUEsUUFBQSxDQUFBLENBQUEsQ0FBQTs7QUFFQSxRQUFBLGdCQUFBLEdBQUEsSUFBQSxLQUFBLENBQUEsZ0JBQUEsQ0FBQSxRQUFBLENBQUEsQ0FBQTtBQUNBLG9CQUFBLENBQUEsUUFBQSxDQUFBLENBQUEsR0FBQSxJQUFBLENBQUEsTUFBQSxFQUFBLEdBQUEsR0FBQSxDQUFBO0FBQ0Esb0JBQUEsQ0FBQSxRQUFBLENBQUEsQ0FBQSxHQUFBLElBQUEsQ0FBQSxNQUFBLEVBQUEsR0FBQSxHQUFBLENBQUE7QUFDQSxvQkFBQSxDQUFBLFFBQUEsQ0FBQSxDQUFBLEdBQUEsSUFBQSxDQUFBLE1BQUEsRUFBQSxHQUFBLEdBQUEsQ0FBQTtBQUNBLG9CQUFBLENBQUEsUUFBQSxDQUFBLFNBQUEsRUFBQSxDQUFBO0FBQ0EsU0FBQSxDQUFBLEdBQUEsQ0FBQSxnQkFBQSxDQUFBLENBQUE7OztBQUdBLFlBQUEsR0FBQSxJQUFBLEtBQUEsQ0FBQSxhQUFBLENBQUEsRUFBQSxTQUFBLEVBQUEsSUFBQSxFQUFBLENBQUEsQ0FBQTtBQUNBLFlBQUEsQ0FBQSxPQUFBLENBQUEsZ0JBQUEsRUFBQSxpQkFBQSxDQUFBLENBQUE7QUFDQSxZQUFBLENBQUEsYUFBQSxDQUFBLFFBQUEsQ0FBQSxDQUFBO0FBQ0EsV0FBQSxDQUFBLENBQUEsQ0FBQSxDQUFBLFdBQUEsQ0FBQSxRQUFBLENBQUEsVUFBQSxDQUFBLENBQUE7OztBQUdBLFVBQUEsQ0FBQSxnQkFBQSxDQUFBLFFBQUEsRUFBQSxjQUFBLEVBQUEsS0FBQSxDQUFBLENBQUE7OztJQUdBOzs7QUFHQSxZQUFBLGNBQUEsQ0FBQSxLQUFBLEVBQUE7QUFDQSxZQUFBLENBQUEsT0FBQSxDQUFBLEtBQUEsQ0FBQSxXQUFBLENBQUEsS0FBQSxFQUFBLEVBQUEsaUJBQUEsQ0FBQSxDQUFBO0FBQ0EsVUFBQSxDQUFBLE1BQUEsR0FBQSxLQUFBLENBQUEsV0FBQSxDQUFBLEtBQUEsRUFBQSxHQUFBLGlCQUFBLENBQUE7QUFDQSxVQUFBLENBQUEsc0JBQUEsRUFBQSxDQUFBO0lBQ0E7OztBQUdBLE9BQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQTtBQUNBLFlBQUEsT0FBQSxHQUFBO0FBQ0EsVUFBQSxFQUFBLENBQUE7QUFDQSx5QkFBQSxDQUFBLE9BQUEsQ0FBQSxDQUFBO0lBQ0E7OztBQUdBLFlBQUEsTUFBQSxHQUFBO0FBQ0EsUUFBQSxLQUFBLEdBQUEsSUFBQSxDQUFBLEdBQUEsRUFBQSxHQUFBLE9BQUEsQ0FBQTtBQUNBLFVBQUEsQ0FBQSxRQUFBLENBQUEsQ0FBQSxHQUFBLElBQUEsQ0FBQSxHQUFBLENBQUEsS0FBQSxDQUFBLEdBQUEsRUFBQSxDQUFBO0FBQ0EsVUFBQSxDQUFBLFFBQUEsQ0FBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBO0FBQ0EsVUFBQSxDQUFBLFFBQUEsQ0FBQSxDQUFBLEdBQUEsSUFBQSxDQUFBLEdBQUEsQ0FBQSxLQUFBLENBQUEsR0FBQSxHQUFBLENBQUE7QUFDQSxVQUFBLENBQUEsTUFBQSxDQUFBLEtBQUEsQ0FBQSxRQUFBLENBQUEsQ0FBQTtBQUNBLFlBQUEsQ0FBQSxNQUFBLENBQUEsS0FBQSxFQUFBLE1BQUEsQ0FBQSxDQUFBO0lBQ0E7R0FDQTtFQUNBLENBQUE7Q0FDQSxDQUFBLENBQUE7QUNqSEEsWUFBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxTQUFBLENBQUEsYUFBQSxFQUFBLFlBQUE7QUFDQSxRQUFBO0FBQ0EsVUFBQSxFQUFBLEdBQUE7QUFDQSxPQUFBLEVBQUE7QUFDQSxRQUFBLEVBQUEsR0FBQTtHQUNBO0FBQ0EsYUFBQSxFQUFBLG1DQUFBO0VBQ0EsQ0FBQTtDQUNBLENBQUEsQ0FBQSIsImZpbGUiOiJtYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xudmFyIGFwcCA9IGFuZ3VsYXIubW9kdWxlKCdGdWxsc3RhY2tHZW5lcmF0ZWRBcHAnLCBbJ3VpLnJvdXRlcicsICdmc2FQcmVCdWlsdCddKTtcblxuYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHVybFJvdXRlclByb3ZpZGVyLCAkbG9jYXRpb25Qcm92aWRlcikge1xuICAgIC8vIFRoaXMgdHVybnMgb2ZmIGhhc2hiYW5nIHVybHMgKC8jYWJvdXQpIGFuZCBjaGFuZ2VzIGl0IHRvIHNvbWV0aGluZyBub3JtYWwgKC9hYm91dClcbiAgICAkbG9jYXRpb25Qcm92aWRlci5odG1sNU1vZGUodHJ1ZSk7XG4gICAgLy8gSWYgd2UgZ28gdG8gYSBVUkwgdGhhdCB1aS1yb3V0ZXIgZG9lc24ndCBoYXZlIHJlZ2lzdGVyZWQsIGdvIHRvIHRoZSBcIi9cIiB1cmwuXG4gICAgJHVybFJvdXRlclByb3ZpZGVyLm90aGVyd2lzZSgnLycpO1xuICAgICR1cmxSb3V0ZXJQcm92aWRlci53aGVuKCcvYXV0aC86cHJvdmlkZXInLCBmdW5jdGlvbiAoKSB7XG4gICAgXHR3aW5kb3cubG9jYXRpb24ucmVsb2FkKCk7XG5cdH0pO1xuXG59KTtcblxuLy8gVGhpcyBhcHAucnVuIGlzIGZvciBjb250cm9sbGluZyBhY2Nlc3MgdG8gc3BlY2lmaWMgc3RhdGVzLlxuYXBwLnJ1bihmdW5jdGlvbiAoJHJvb3RTY29wZSwgQXV0aFNlcnZpY2UsICRzdGF0ZSkge1xuXG4gICAgLy8gVGhlIGdpdmVuIHN0YXRlIHJlcXVpcmVzIGFuIGF1dGhlbnRpY2F0ZWQgdXNlci5cbiAgICB2YXIgZGVzdGluYXRpb25TdGF0ZVJlcXVpcmVzQXV0aCA9IGZ1bmN0aW9uIChzdGF0ZSkge1xuICAgICAgICByZXR1cm4gc3RhdGUuZGF0YSAmJiBzdGF0ZS5kYXRhLmF1dGhlbnRpY2F0ZTtcbiAgICB9O1xuXG4gICAgLy8gJHN0YXRlQ2hhbmdlU3RhcnQgaXMgYW4gZXZlbnQgZmlyZWRcbiAgICAvLyB3aGVuZXZlciB0aGUgcHJvY2VzcyBvZiBjaGFuZ2luZyBhIHN0YXRlIGJlZ2lucy5cbiAgICAkcm9vdFNjb3BlLiRvbignJHN0YXRlQ2hhbmdlU3RhcnQnLCBmdW5jdGlvbiAoZXZlbnQsIHRvU3RhdGUpIHtcblxuICAgICAgICBpZiAoIWRlc3RpbmF0aW9uU3RhdGVSZXF1aXJlc0F1dGgodG9TdGF0ZSkpIHtcbiAgICAgICAgICAgIC8vIFRoZSBkZXN0aW5hdGlvbiBzdGF0ZSBkb2VzIG5vdCByZXF1aXJlIGF1dGhlbnRpY2F0aW9uXG4gICAgICAgICAgICAvLyBTaG9ydCBjaXJjdWl0IHdpdGggcmV0dXJuLlxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKEF1dGhTZXJ2aWNlLmlzQXV0aGVudGljYXRlZCgpKSB7XG4gICAgICAgICAgICAvLyBUaGUgdXNlciBpcyBhdXRoZW50aWNhdGVkLlxuICAgICAgICAgICAgLy8gU2hvcnQgY2lyY3VpdCB3aXRoIHJldHVybi5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENhbmNlbCBuYXZpZ2F0aW5nIHRvIG5ldyBzdGF0ZS5cbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKS50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICAgICAgICAvLyBJZiBhIHVzZXIgaXMgcmV0cmlldmVkLCB0aGVuIHJlbmF2aWdhdGUgdG8gdGhlIGRlc3RpbmF0aW9uXG4gICAgICAgICAgICAvLyAodGhlIHNlY29uZCB0aW1lLCBBdXRoU2VydmljZS5pc0F1dGhlbnRpY2F0ZWQoKSB3aWxsIHdvcmspXG4gICAgICAgICAgICAvLyBvdGhlcndpc2UsIGlmIG5vIHVzZXIgaXMgbG9nZ2VkIGluLCBnbyB0byBcImxvZ2luXCIgc3RhdGUuXG4gICAgICAgICAgICB2YXIgZGVzdGluYXRpb24gPSB1c2VyID8gdG9TdGF0ZS5uYW1lIDogJ2xvZ2luJztcbiAgICAgICAgICAgICRzdGF0ZS5nbyhkZXN0aW5hdGlvbik7XG4gICAgICAgIH0pO1xuXG4gICAgfSk7XG5cbn0pOyIsIihmdW5jdGlvbiAoKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICAvLyBIb3BlIHlvdSBkaWRuJ3QgZm9yZ2V0IEFuZ3VsYXIhIER1aC1kb3kuXG4gICAgaWYgKCF3aW5kb3cuYW5ndWxhcikgdGhyb3cgbmV3IEVycm9yKCdJIGNhblxcJ3QgZmluZCBBbmd1bGFyIScpO1xuXG4gICAgdmFyIGFwcCA9IGFuZ3VsYXIubW9kdWxlKCdmc2FQcmVCdWlsdCcsIFtdKTtcblxuICAgIGFwcC5mYWN0b3J5KCdTb2NrZXQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICghd2luZG93LmlvKSB0aHJvdyBuZXcgRXJyb3IoJ3NvY2tldC5pbyBub3QgZm91bmQhJyk7XG4gICAgICAgIHJldHVybiB3aW5kb3cuaW8od2luZG93LmxvY2F0aW9uLm9yaWdpbik7XG4gICAgfSk7XG5cbiAgICAvLyBBVVRIX0VWRU5UUyBpcyB1c2VkIHRocm91Z2hvdXQgb3VyIGFwcCB0b1xuICAgIC8vIGJyb2FkY2FzdCBhbmQgbGlzdGVuIGZyb20gYW5kIHRvIHRoZSAkcm9vdFNjb3BlXG4gICAgLy8gZm9yIGltcG9ydGFudCBldmVudHMgYWJvdXQgYXV0aGVudGljYXRpb24gZmxvdy5cbiAgICBhcHAuY29uc3RhbnQoJ0FVVEhfRVZFTlRTJywge1xuICAgICAgICBsb2dpblN1Y2Nlc3M6ICdhdXRoLWxvZ2luLXN1Y2Nlc3MnLFxuICAgICAgICBsb2dpbkZhaWxlZDogJ2F1dGgtbG9naW4tZmFpbGVkJyxcbiAgICAgICAgbG9nb3V0U3VjY2VzczogJ2F1dGgtbG9nb3V0LXN1Y2Nlc3MnLFxuICAgICAgICBzZXNzaW9uVGltZW91dDogJ2F1dGgtc2Vzc2lvbi10aW1lb3V0JyxcbiAgICAgICAgbm90QXV0aGVudGljYXRlZDogJ2F1dGgtbm90LWF1dGhlbnRpY2F0ZWQnLFxuICAgICAgICBub3RBdXRob3JpemVkOiAnYXV0aC1ub3QtYXV0aG9yaXplZCdcbiAgICB9KTtcblxuICAgIGFwcC5mYWN0b3J5KCdBdXRoSW50ZXJjZXB0b3InLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgJHEsIEFVVEhfRVZFTlRTKSB7XG4gICAgICAgIHZhciBzdGF0dXNEaWN0ID0ge1xuICAgICAgICAgICAgNDAxOiBBVVRIX0VWRU5UUy5ub3RBdXRoZW50aWNhdGVkLFxuICAgICAgICAgICAgNDAzOiBBVVRIX0VWRU5UUy5ub3RBdXRob3JpemVkLFxuICAgICAgICAgICAgNDE5OiBBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCxcbiAgICAgICAgICAgIDQ0MDogQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXRcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3BvbnNlRXJyb3I6IGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChzdGF0dXNEaWN0W3Jlc3BvbnNlLnN0YXR1c10sIHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gJHEucmVqZWN0KHJlc3BvbnNlKVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH0pO1xuXG4gICAgYXBwLmNvbmZpZyhmdW5jdGlvbiAoJGh0dHBQcm92aWRlcikge1xuICAgICAgICAkaHR0cFByb3ZpZGVyLmludGVyY2VwdG9ycy5wdXNoKFtcbiAgICAgICAgICAgICckaW5qZWN0b3InLFxuICAgICAgICAgICAgZnVuY3Rpb24gKCRpbmplY3Rvcikge1xuICAgICAgICAgICAgICAgIHJldHVybiAkaW5qZWN0b3IuZ2V0KCdBdXRoSW50ZXJjZXB0b3InKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgXSk7XG4gICAgfSk7XG5cbiAgICBhcHAuc2VydmljZSgnQXV0aFNlcnZpY2UnLCBmdW5jdGlvbiAoJGh0dHAsIFNlc3Npb24sICRyb290U2NvcGUsIEFVVEhfRVZFTlRTLCAkcSkge1xuXG4gICAgICAgIGZ1bmN0aW9uIG9uU3VjY2Vzc2Z1bExvZ2luKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICB2YXIgZGF0YSA9IHJlc3BvbnNlLmRhdGE7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcImxvZ2dlZCBpblwiKVxuICAgICAgICAgICAgU2Vzc2lvbi5jcmVhdGUoZGF0YS5pZCwgZGF0YS51c2VyKTtcbiAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChBVVRIX0VWRU5UUy5sb2dpblN1Y2Nlc3MpO1xuICAgICAgICAgICAgcmV0dXJuIGRhdGEudXNlcjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFVzZXMgdGhlIHNlc3Npb24gZmFjdG9yeSB0byBzZWUgaWYgYW5cbiAgICAgICAgLy8gYXV0aGVudGljYXRlZCB1c2VyIGlzIGN1cnJlbnRseSByZWdpc3RlcmVkLlxuICAgICAgICB0aGlzLmlzQXV0aGVudGljYXRlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAhIVNlc3Npb24udXNlcjtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmdldExvZ2dlZEluVXNlciA9IGZ1bmN0aW9uIChmcm9tU2VydmVyKSB7XG5cbiAgICAgICAgICAgIC8vIElmIGFuIGF1dGhlbnRpY2F0ZWQgc2Vzc2lvbiBleGlzdHMsIHdlXG4gICAgICAgICAgICAvLyByZXR1cm4gdGhlIHVzZXIgYXR0YWNoZWQgdG8gdGhhdCBzZXNzaW9uXG4gICAgICAgICAgICAvLyB3aXRoIGEgcHJvbWlzZS4gVGhpcyBlbnN1cmVzIHRoYXQgd2UgY2FuXG4gICAgICAgICAgICAvLyBhbHdheXMgaW50ZXJmYWNlIHdpdGggdGhpcyBtZXRob2QgYXN5bmNocm9ub3VzbHkuXG5cbiAgICAgICAgICAgIC8vIE9wdGlvbmFsbHksIGlmIHRydWUgaXMgZ2l2ZW4gYXMgdGhlIGZyb21TZXJ2ZXIgcGFyYW1ldGVyLFxuICAgICAgICAgICAgLy8gdGhlbiB0aGlzIGNhY2hlZCB2YWx1ZSB3aWxsIG5vdCBiZSB1c2VkLlxuXG4gICAgICAgICAgICBpZiAodGhpcy5pc0F1dGhlbnRpY2F0ZWQoKSAmJiBmcm9tU2VydmVyICE9PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRxLndoZW4oU2Vzc2lvbi51c2VyKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gTWFrZSByZXF1ZXN0IEdFVCAvc2Vzc2lvbi5cbiAgICAgICAgICAgIC8vIElmIGl0IHJldHVybnMgYSB1c2VyLCBjYWxsIG9uU3VjY2Vzc2Z1bExvZ2luIHdpdGggdGhlIHJlc3BvbnNlLlxuICAgICAgICAgICAgLy8gSWYgaXQgcmV0dXJucyBhIDQwMSByZXNwb25zZSwgd2UgY2F0Y2ggaXQgYW5kIGluc3RlYWQgcmVzb2x2ZSB0byBudWxsLlxuICAgICAgICAgICAgcmV0dXJuICRodHRwLmdldCgnL3Nlc3Npb24nKS50aGVuKG9uU3VjY2Vzc2Z1bExvZ2luKS5jYXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMubG9naW4gPSBmdW5jdGlvbiAoY3JlZGVudGlhbHMpIHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5wb3N0KCcvbG9naW4nLCBjcmVkZW50aWFscylcbiAgICAgICAgICAgICAgICAudGhlbihvblN1Y2Nlc3NmdWxMb2dpbilcbiAgICAgICAgICAgICAgICAuY2F0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJHEucmVqZWN0KHsgbWVzc2FnZTogJ0ludmFsaWQgbG9naW4gY3JlZGVudGlhbHMuJyB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmxvZ291dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9sb2dvdXQnKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBTZXNzaW9uLmRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoQVVUSF9FVkVOVFMubG9nb3V0U3VjY2Vzcyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgIH0pO1xuXG4gICAgYXBwLnNlcnZpY2UoJ1Nlc3Npb24nLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgQVVUSF9FVkVOVFMpIHtcblxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMubm90QXV0aGVudGljYXRlZCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc2VsZi5kZXN0cm95KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzZWxmLmRlc3Ryb3koKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5pZCA9IG51bGw7XG4gICAgICAgIHRoaXMudXNlciA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5jcmVhdGUgPSBmdW5jdGlvbiAoc2Vzc2lvbklkLCB1c2VyKSB7XG4gICAgICAgICAgICB0aGlzLmlkID0gc2Vzc2lvbklkO1xuICAgICAgICAgICAgdGhpcy51c2VyID0gdXNlcjtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLmlkID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMudXNlciA9IG51bGw7XG4gICAgICAgIH07XG5cbiAgICB9KTtcblxufSkoKTtcbiIsIid1c2Ugc3RyaWN0JztcblxuYXBwLmNvbnRyb2xsZXIoJ01hbmFnZXJDb250cm9sbGVyJywgZnVuY3Rpb24oJHNjb3BlLCAkdGltZW91dCl7XG5cblx0Ly8gTmF2YmFyXG5cdCRzY29wZS5uYXZiYXJFeHBhbmQgPSBmYWxzZTtcblx0XG5cdC8vIENvbGxlY3Rpb24gUGFuZWxcblx0JHNjb3BlLmNvbGxlY3Rpb25PcGVuID0gZmFsc2U7XG5cdCRzY29wZS5jb2xsZWN0aW9uVG9nZ2xlID0gZnVuY3Rpb24oKXtcblx0XHRpZiAoISRzY29wZS5jb2xsZWN0aW9uT3BlbikgJHNjb3BlLmNvbGxlY3Rpb25PcGVuID0gdHJ1ZTtcblx0XHRlbHNlIHtcblx0XHRcdCRzY29wZS5jb2xsZWN0aW9uT3BlbiA9IGZhbHNlO1xuXHRcdH1cblx0fVxuXG5cdC8vQ29sbGFwc2UgQWxsXG5cdCRzY29wZS5jb2xsYXBzZVRvcCA9IGZ1bmN0aW9uKCl7XG5cdFx0JHNjb3BlLmNvbGxlY3Rpb25PcGVuID0gZmFsc2U7XG5cdFx0JHRpbWVvdXQoZnVuY3Rpb24oKXtcblx0XHRcdCRzY29wZS5uYXZiYXJFeHBhbmQgPSBmYWxzZTtcblx0XHR9LCAyMDApO1xuXHR9XG5cblx0Ly8gQWN0dWFsIGNvbGxlY3Rpb25cblx0JHNjb3BlLmNvbGxlY3Rpb24gPSBbXVxuXG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2xvZ2luJywge1xuICAgICAgICB1cmw6ICcvbG9naW4nLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2xvZ2luL2xvZ2luLmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnTG9naW5DdHJsJ1xuICAgIH0pO1xuXG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ0xvZ2luQ3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsIEF1dGhTZXJ2aWNlLCAkc3RhdGUpIHtcblxuICAgICRzY29wZS5sb2dpbiA9IHt9O1xuICAgICRzY29wZS5lcnJvciA9IG51bGw7XG5cbiAgICAkc2NvcGUuc2VuZExvZ2luID0gZnVuY3Rpb24gKGxvZ2luSW5mbykge1xuICAgICAgICBjb25zb2xlLmxvZyhcImhpdCBjb250cm9sbGVyXCIpXG4gICAgICAgICRzY29wZS5lcnJvciA9IG51bGw7XG5cbiAgICAgICAgQXV0aFNlcnZpY2UubG9naW4obG9naW5JbmZvKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzdGF0ZS5nbygnaG9tZScpO1xuICAgICAgICB9KS5jYXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUuZXJyb3IgPSAnSW52YWxpZCBsb2dpbiBjcmVkZW50aWFscy4nO1xuICAgICAgICB9KTtcblxuICAgIH07XG5cbn0pOyIsIid1c2Ugc3RyaWN0JztcblxuYXBwLmZhY3RvcnkoJ01vZGVsJywgZnVuY3Rpb24gKCRodHRwKSB7XG5cdC8vIE1vZGVsIENvbnN0cnVjdG9yXG5cdGZ1bmN0aW9uIE1vZGVsIChwcm9wcykge1xuXHRcdGFuZ3VsYXIuZXh0ZW5kKHRoaXMsIHByb3BzKTtcblx0fVxuXHRNb2RlbC51cmwgPSAnYXBpL3Byb2R1Y3QnXG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShNb2RlbC5wcm90b3R5cGUsICd1cmwnLCB7XG5cdFx0Z2V0OiBmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gTW9kZWwudXJsICsgdGhpcy5faWQ7XG5cdFx0fVxuXHR9KTtcblxuXHQvLyBDdXJyZW50bHkgUmVuZGVyZWQgT2JqZWN0XG5cdHZhciByZW5kZXJPYmogPSB7XG5cdFx0bW9kZWxGaWxlVXJsOiAnbW9kZWxzL3VudGl0bGVkLXNjZW5lL3VudGl0bGVkLXNjZW5lLmpzb24nLFxuXHRcdGNyZWF0b3I6ICdNYXJ5IEFubmUnXG5cdH07XG5cblx0Ly8gTGlzdGluZyBGdW5jdGlvbmFsaXR5XG5cdE1vZGVsLnByb3RvdHlwZS5mZXRjaCA9IGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuICRodHRwLmdldCh0aGlzLnVybCkudGhlbihmdW5jdGlvbiAocmVzKSB7XG5cdFx0XHRyZXR1cm4gbmV3IE1vZGVsKHJlcy5kYXRhKTtcblx0XHR9KTtcblx0fVxuXG5cdE1vZGVsLmZldGNoQWxsID0gZnVuY3Rpb24oKXtcblx0XHQvLyByZXR1cm4gJGh0cHAuZ2V0KE1vZGVsLnVybCkudGhlbihmdW5jdGlvbiAoZGF0YSkge1xuXHRcdC8vIFx0cmV0dXJuIHJlcy5kYXRhLm1hcChmdW5jdGlvbiAob2JqKSB7XG5cdFx0Ly8gXHRcdHJldHVybiBuZXcgTW9kZWwob2JqKTtcblx0XHQvLyBcdH0pO1xuXHRcdC8vIH0pO1xuXHRcdHJldHVybiBbXG5cdFx0e1xuXHRcdFx0X2lkOiAxMjQyNCxcblx0XHRcdHRpdGxlOiAnRmxvYXRpbmcgSXNsYW5kJyxcblx0XHRcdHNuYXBzaG90RmlsZVVybDogJ2ltYWdlcy9zbmFwc2hvdHMvdW50aXRsZWQtc2NlbmUucG5nJyxcblx0XHRcdG1vZGVsRmlsZVVybDogJ21vZGVscy91bnRpdGxlZC1zY2VuZS91bnRpdGxlZC1zY2VuZS5qc29uJyxcblx0XHRcdGNyZWF0b3I6ICdNYXJ5IEFubmUnLFxuXHRcdFx0dGFnczogWydFbnZpcm9ubWVudCcsJ0xvdy1Qb2x5J11cblx0XHR9LCBcblx0XHR7XG5cdFx0XHRfaWQ6IDEyMzYyLFxuXHRcdFx0dGl0bGU6ICdCYXltYXgnLFxuXHRcdFx0c25hcHNob3RGaWxlVXJsOiAnaW1hZ2VzL3NuYXBzaG90cy9iYXltYXgucG5nJyxcblx0XHRcdG1vZGVsRmlsZVVybDogJ21vZGVscy9iYXltYXguanNvbicsXG5cdFx0XHRjcmVhdG9yOiAnTWlsdG9uIEdsYXNlcicsXG5cdFx0XHR0YWdzOiBbJ0NoYXJhY3RlcicsJ0Z1dHVyaXN0aWMnXVxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0X2lkOiAxMjQyNCxcblx0XHRcdHRpdGxlOiAnRmxvYXRpbmcgSXNsYW5kJyxcblx0XHRcdHNuYXBzaG90RmlsZVVybDogJ2ltYWdlcy9zbmFwc2hvdHMvdW50aXRsZWQtc2NlbmUucG5nJyxcblx0XHRcdG1vZGVsRmlsZVVybDogJ21vZGVscy91bnRpdGxlZC1zY2VuZS91bnRpdGxlZC1zY2VuZS5qc29uJyxcblx0XHRcdGNyZWF0b3I6ICdNYXJ5IEFubmUnLFxuXHRcdFx0dGFnczogWydFbnZpcm9ubWVudCcsJ0xvdy1Qb2x5J11cblx0XHR9LCBcblx0XHR7XG5cdFx0XHRfaWQ6IDEyMzYyLFxuXHRcdFx0dGl0bGU6ICdCYXltYXgnLFxuXHRcdFx0c25hcHNob3RGaWxlVXJsOiAnaW1hZ2VzL3NuYXBzaG90cy9iYXltYXgucG5nJyxcblx0XHRcdG1vZGVsRmlsZVVybDogJ21vZGVscy9iYXltYXguanNvbicsXG5cdFx0XHRjcmVhdG9yOiAnTWlsdG9uIEdsYXNlcicsXG5cdFx0XHR0YWdzOiBbJ0NoYXJhY3RlcicsJ0Z1dHVyaXN0aWMnXVxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0X2lkOiAxMjQyNCxcblx0XHRcdHRpdGxlOiAnRmxvYXRpbmcgSXNsYW5kJyxcblx0XHRcdHNuYXBzaG90RmlsZVVybDogJ2ltYWdlcy9zbmFwc2hvdHMvdW50aXRsZWQtc2NlbmUucG5nJyxcblx0XHRcdG1vZGVsRmlsZVVybDogJ21vZGVscy91bnRpdGxlZC1zY2VuZS91bnRpdGxlZC1zY2VuZS5qc29uJyxcblx0XHRcdGNyZWF0b3I6ICdNYXJ5IEFubmUnLFxuXHRcdFx0dGFnczogWydFbnZpcm9ubWVudCcsJ0xvdy1Qb2x5J11cblx0XHR9LCBcblx0XHR7XG5cdFx0XHRfaWQ6IDEyMzYyLFxuXHRcdFx0dGl0bGU6ICdCYXltYXgnLFxuXHRcdFx0c25hcHNob3RGaWxlVXJsOiAnaW1hZ2VzL3NuYXBzaG90cy9iYXltYXgucG5nJyxcblx0XHRcdG1vZGVsRmlsZVVybDogJ21vZGVscy9iYXltYXguanNvbicsXG5cdFx0XHRjcmVhdG9yOiAnTWlsdG9uIEdsYXNlcicsXG5cdFx0XHR0YWdzOiBbJ0NoYXJhY3RlcicsJ0Z1dHVyaXN0aWMnXVxuXHRcdH0sIFxuXHRcdHtcblx0XHRcdF9pZDogMTIzNjIsXG5cdFx0XHR0aXRsZTogJ0JheW1heCcsXG5cdFx0XHRzbmFwc2hvdEZpbGVVcmw6ICdpbWFnZXMvc25hcHNob3RzL2JheW1heC5wbmcnLFxuXHRcdFx0bW9kZWxGaWxlVXJsOiAnbW9kZWxzL2JheW1heC5qc29uJyxcblx0XHRcdGNyZWF0b3I6ICdNaWx0b24gR2xhc2VyJyxcblx0XHRcdHRhZ3M6IFsnQ2hhcmFjdGVyJywnRnV0dXJpc3RpYyddXG5cdFx0fSxcblx0XHR7XG5cdFx0XHRfaWQ6IDEyNDI0LFxuXHRcdFx0dGl0bGU6ICdGbG9hdGluZyBJc2xhbmQnLFxuXHRcdFx0c25hcHNob3RGaWxlVXJsOiAnaW1hZ2VzL3NuYXBzaG90cy91bnRpdGxlZC1zY2VuZS5wbmcnLFxuXHRcdFx0bW9kZWxGaWxlVXJsOiAnbW9kZWxzL3VudGl0bGVkLXNjZW5lL3VudGl0bGVkLXNjZW5lLmpzb24nLFxuXHRcdFx0Y3JlYXRvcjogJ01hcnkgQW5uZScsXG5cdFx0XHR0YWdzOiBbJ0Vudmlyb25tZW50JywnTG93LVBvbHknXVxuXHRcdH0sIFxuXHRcdHtcblx0XHRcdF9pZDogMTIzNjIsXG5cdFx0XHR0aXRsZTogJ0JheW1heCcsXG5cdFx0XHRzbmFwc2hvdEZpbGVVcmw6ICdpbWFnZXMvc25hcHNob3RzL2JheW1heC5wbmcnLFxuXHRcdFx0bW9kZWxGaWxlVXJsOiAnbW9kZWxzL2JheW1heC5qc29uJyxcblx0XHRcdGNyZWF0b3I6ICdNaWx0b24gR2xhc2VyJyxcblx0XHRcdHRhZ3M6IFsnQ2hhcmFjdGVyJywnRnV0dXJpc3RpYyddXG5cdFx0fSwgXG5cdFx0e1xuXHRcdFx0X2lkOiAxMjM2Mixcblx0XHRcdHRpdGxlOiAnQmF5bWF4Jyxcblx0XHRcdHNuYXBzaG90RmlsZVVybDogJ2ltYWdlcy9zbmFwc2hvdHMvYmF5bWF4LnBuZycsXG5cdFx0XHRtb2RlbEZpbGVVcmw6ICdtb2RlbHMvYmF5bWF4Lmpzb24nLFxuXHRcdFx0Y3JlYXRvcjogJ01pbHRvbiBHbGFzZXInLFxuXHRcdFx0dGFnczogWydDaGFyYWN0ZXInLCdGdXR1cmlzdGljJ11cblx0XHR9LFxuXHRcdHtcblx0XHRcdF9pZDogMTIzNjIsXG5cdFx0XHR0aXRsZTogJ0JheW1heCcsXG5cdFx0XHRzbmFwc2hvdEZpbGVVcmw6ICdpbWFnZXMvc25hcHNob3RzL2JheW1heC5wbmcnLFxuXHRcdFx0bW9kZWxGaWxlVXJsOiAnbW9kZWxzL2JheW1heC5qc29uJyxcblx0XHRcdGNyZWF0b3I6ICdNaWx0b24gR2xhc2VyJyxcblx0XHRcdHRhZ3M6IFsnQ2hhcmFjdGVyJywnRnV0dXJpc3RpYyddXG5cdFx0fSxcblx0XHR7XG5cdFx0XHRfaWQ6IDEyNDI0LFxuXHRcdFx0dGl0bGU6ICdGbG9hdGluZyBJc2xhbmQnLFxuXHRcdFx0c25hcHNob3RGaWxlVXJsOiAnaW1hZ2VzL3NuYXBzaG90cy91bnRpdGxlZC1zY2VuZS5wbmcnLFxuXHRcdFx0bW9kZWxGaWxlVXJsOiAnbW9kZWxzL3VudGl0bGVkLXNjZW5lL3VudGl0bGVkLXNjZW5lLmpzb24nLFxuXHRcdFx0Y3JlYXRvcjogJ01hcnkgQW5uZScsXG5cdFx0XHR0YWdzOiBbJ0Vudmlyb25tZW50JywnTG93LVBvbHknXVxuXHRcdH0sIFxuXHRcdHtcblx0XHRcdF9pZDogMTIzNjIsXG5cdFx0XHR0aXRsZTogJ0JheW1heCcsXG5cdFx0XHRzbmFwc2hvdEZpbGVVcmw6ICdpbWFnZXMvc25hcHNob3RzL2JheW1heC5wbmcnLFxuXHRcdFx0bW9kZWxGaWxlVXJsOiAnbW9kZWxzL2JheW1heC5qc29uJyxcblx0XHRcdGNyZWF0b3I6ICdNaWx0b24gR2xhc2VyJyxcblx0XHRcdHRhZ3M6IFsnQ2hhcmFjdGVyJywnRnV0dXJpc3RpYyddXG5cdFx0fSxcblx0XHR7XG5cdFx0XHRfaWQ6IDEyNDI0LFxuXHRcdFx0dGl0bGU6ICdGbG9hdGluZyBJc2xhbmQnLFxuXHRcdFx0c25hcHNob3RGaWxlVXJsOiAnaW1hZ2VzL3NuYXBzaG90cy91bnRpdGxlZC1zY2VuZS5wbmcnLFxuXHRcdFx0bW9kZWxGaWxlVXJsOiAnbW9kZWxzL3VudGl0bGVkLXNjZW5lL3VudGl0bGVkLXNjZW5lLmpzb24nLFxuXHRcdFx0Y3JlYXRvcjogJ01hcnkgQW5uZScsXG5cdFx0XHR0YWdzOiBbJ0Vudmlyb25tZW50JywnTG93LVBvbHknXVxuXHRcdH0sIFxuXHRcdHtcblx0XHRcdF9pZDogMTIzNjIsXG5cdFx0XHR0aXRsZTogJ0JheW1heCcsXG5cdFx0XHRzbmFwc2hvdEZpbGVVcmw6ICdpbWFnZXMvc25hcHNob3RzL2JheW1heC5wbmcnLFxuXHRcdFx0bW9kZWxGaWxlVXJsOiAnbW9kZWxzL2JheW1heC5qc29uJyxcblx0XHRcdGNyZWF0b3I6ICdNaWx0b24gR2xhc2VyJyxcblx0XHRcdHRhZ3M6IFsnQ2hhcmFjdGVyJywnRnV0dXJpc3RpYyddXG5cdFx0fSxcblx0XHR7XG5cdFx0XHRfaWQ6IDEyNDI0LFxuXHRcdFx0dGl0bGU6ICdGbG9hdGluZyBJc2xhbmQnLFxuXHRcdFx0c25hcHNob3RGaWxlVXJsOiAnaW1hZ2VzL3NuYXBzaG90cy91bnRpdGxlZC1zY2VuZS5wbmcnLFxuXHRcdFx0bW9kZWxGaWxlVXJsOiAnbW9kZWxzL3VudGl0bGVkLXNjZW5lL3VudGl0bGVkLXNjZW5lLmpzb24nLFxuXHRcdFx0Y3JlYXRvcjogJ01hcnkgQW5uZScsXG5cdFx0XHR0YWdzOiBbJ0Vudmlyb25tZW50JywnTG93LVBvbHknXVxuXHRcdH0sIFxuXHRcdHtcblx0XHRcdF9pZDogMTIzNjIsXG5cdFx0XHR0aXRsZTogJ0JheW1heCcsXG5cdFx0XHRzbmFwc2hvdEZpbGVVcmw6ICdpbWFnZXMvc25hcHNob3RzL2JheW1heC5wbmcnLFxuXHRcdFx0bW9kZWxGaWxlVXJsOiAnbW9kZWxzL2JheW1heC5qc29uJyxcblx0XHRcdGNyZWF0b3I6ICdNaWx0b24gR2xhc2VyJyxcblx0XHRcdHRhZ3M6IFsnQ2hhcmFjdGVyJywnRnV0dXJpc3RpYyddXG5cdFx0fSxcblx0XHR7XG5cdFx0XHRfaWQ6IDEyNDI0LFxuXHRcdFx0dGl0bGU6ICdGbG9hdGluZyBJc2xhbmQnLFxuXHRcdFx0c25hcHNob3RGaWxlVXJsOiAnaW1hZ2VzL3NuYXBzaG90cy91bnRpdGxlZC1zY2VuZS5wbmcnLFxuXHRcdFx0bW9kZWxGaWxlVXJsOiAnbW9kZWxzL3VudGl0bGVkLXNjZW5lL3VudGl0bGVkLXNjZW5lLmpzb24nLFxuXHRcdFx0Y3JlYXRvcjogJ01hcnkgQW5uZScsXG5cdFx0XHR0YWdzOiBbJ0Vudmlyb25tZW50JywnTG93LVBvbHknXVxuXHRcdH0sIFxuXHRcdHtcblx0XHRcdF9pZDogMTIzNjIsXG5cdFx0XHR0aXRsZTogJ0JheW1heCcsXG5cdFx0XHRzbmFwc2hvdEZpbGVVcmw6ICdpbWFnZXMvc25hcHNob3RzL2JheW1heC5wbmcnLFxuXHRcdFx0bW9kZWxGaWxlVXJsOiAnbW9kZWxzL2JheW1heC5qc29uJyxcblx0XHRcdGNyZWF0b3I6ICdNaWx0b24gR2xhc2VyJyxcblx0XHRcdHRhZ3M6IFsnQ2hhcmFjdGVyJywnRnV0dXJpc3RpYyddXG5cdFx0fSwgXG5cdFx0e1xuXHRcdFx0X2lkOiAxMjM2Mixcblx0XHRcdHRpdGxlOiAnQmF5bWF4Jyxcblx0XHRcdHNuYXBzaG90RmlsZVVybDogJ2ltYWdlcy9zbmFwc2hvdHMvYmF5bWF4LnBuZycsXG5cdFx0XHRtb2RlbEZpbGVVcmw6ICdtb2RlbHMvYmF5bWF4Lmpzb24nLFxuXHRcdFx0Y3JlYXRvcjogJ01pbHRvbiBHbGFzZXInLFxuXHRcdFx0dGFnczogWydDaGFyYWN0ZXInLCdGdXR1cmlzdGljJ11cblx0XHR9LFxuXHRcdHtcblx0XHRcdF9pZDogMTI0MjQsXG5cdFx0XHR0aXRsZTogJ0Zsb2F0aW5nIElzbGFuZCcsXG5cdFx0XHRzbmFwc2hvdEZpbGVVcmw6ICdpbWFnZXMvc25hcHNob3RzL3VudGl0bGVkLXNjZW5lLnBuZycsXG5cdFx0XHRtb2RlbEZpbGVVcmw6ICdtb2RlbHMvdW50aXRsZWQtc2NlbmUvdW50aXRsZWQtc2NlbmUuanNvbicsXG5cdFx0XHRjcmVhdG9yOiAnTWFyeSBBbm5lJyxcblx0XHRcdHRhZ3M6IFsnRW52aXJvbm1lbnQnLCdMb3ctUG9seSddXG5cdFx0fSwgXG5cdFx0e1xuXHRcdFx0X2lkOiAxMjM2Mixcblx0XHRcdHRpdGxlOiAnQmF5bWF4Jyxcblx0XHRcdHNuYXBzaG90RmlsZVVybDogJ2ltYWdlcy9zbmFwc2hvdHMvYmF5bWF4LnBuZycsXG5cdFx0XHRtb2RlbEZpbGVVcmw6ICdtb2RlbHMvYmF5bWF4Lmpzb24nLFxuXHRcdFx0Y3JlYXRvcjogJ01pbHRvbiBHbGFzZXInLFxuXHRcdFx0dGFnczogWydDaGFyYWN0ZXInLCdGdXR1cmlzdGljJ11cblx0XHR9LCBcblx0XHR7XG5cdFx0XHRfaWQ6IDEyMzYyLFxuXHRcdFx0dGl0bGU6ICdCYXltYXgnLFxuXHRcdFx0c25hcHNob3RGaWxlVXJsOiAnaW1hZ2VzL3NuYXBzaG90cy9iYXltYXgucG5nJyxcblx0XHRcdG1vZGVsRmlsZVVybDogJ21vZGVscy9iYXltYXguanNvbicsXG5cdFx0XHRjcmVhdG9yOiAnTWlsdG9uIEdsYXNlcicsXG5cdFx0XHR0YWdzOiBbJ0NoYXJhY3RlcicsJ0Z1dHVyaXN0aWMnXVxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0X2lkOiAxMjM2Mixcblx0XHRcdHRpdGxlOiAnQmF5bWF4Jyxcblx0XHRcdHNuYXBzaG90RmlsZVVybDogJ2ltYWdlcy9zbmFwc2hvdHMvYmF5bWF4LnBuZycsXG5cdFx0XHRtb2RlbEZpbGVVcmw6ICdtb2RlbHMvYmF5bWF4Lmpzb24nLFxuXHRcdFx0Y3JlYXRvcjogJ01pbHRvbiBHbGFzZXInLFxuXHRcdFx0dGFnczogWydDaGFyYWN0ZXInLCdGdXR1cmlzdGljJ11cblx0XHR9LFxuXHRcdHtcblx0XHRcdF9pZDogMTI0MjQsXG5cdFx0XHR0aXRsZTogJ0Zsb2F0aW5nIElzbGFuZCcsXG5cdFx0XHRzbmFwc2hvdEZpbGVVcmw6ICdpbWFnZXMvc25hcHNob3RzL3VudGl0bGVkLXNjZW5lLnBuZycsXG5cdFx0XHRtb2RlbEZpbGVVcmw6ICdtb2RlbHMvdW50aXRsZWQtc2NlbmUvdW50aXRsZWQtc2NlbmUuanNvbicsXG5cdFx0XHRjcmVhdG9yOiAnTWFyeSBBbm5lJyxcblx0XHRcdHRhZ3M6IFsnRW52aXJvbm1lbnQnLCdMb3ctUG9seSddXG5cdFx0fSwgXG5cdFx0e1xuXHRcdFx0X2lkOiAxMjM2Mixcblx0XHRcdHRpdGxlOiAnQmF5bWF4Jyxcblx0XHRcdHNuYXBzaG90RmlsZVVybDogJ2ltYWdlcy9zbmFwc2hvdHMvYmF5bWF4LnBuZycsXG5cdFx0XHRtb2RlbEZpbGVVcmw6ICdtb2RlbHMvYmF5bWF4Lmpzb24nLFxuXHRcdFx0Y3JlYXRvcjogJ01pbHRvbiBHbGFzZXInLFxuXHRcdFx0dGFnczogWydDaGFyYWN0ZXInLCdGdXR1cmlzdGljJ11cblx0XHR9XTtcblxuXHR9XG5cblxuXHQvLyBSZW5kZXJlciBGdW5jdGlvbmFsaXR5XG5cdE1vZGVsLmNoYW5nZU1vZGVsVXJsID0gZnVuY3Rpb24gKG5ld1VybCkge1xuXHRcdHJlbmRlck9iai5tb2RlbEZpbGVVcmwgPSBuZXdVcmw7XG5cdFx0cmV0dXJuIHJlbmRlck9iajtcblx0fTtcblx0TW9kZWwuY2hhbmdlTW9kZWwgPSBmdW5jdGlvbiAobmV3T2JqKSB7XG5cdFx0Ly8gVGVtcCBhdHRyaWJ1dGVzIGZvciB0ZXN0aW5nXG5cdFx0cmVuZGVyT2JqID0gbmV3T2JqIHx8IHtcblx0XHRcdF9pZDogMTI0MjQsXG5cdFx0XHR0aXRsZTogJ0Zsb2F0aW5nIElzbGFuZCcsXG5cdFx0XHRzbmFwc2hvdEZpbGVVcmw6ICdpbWFnZXMvc25hcHNob3RzL3VudGl0bGVkLXNjZW5lLnBuZycsXG5cdFx0XHRtb2RlbEZpbGVVcmw6ICdtb2RlbHMvdW50aXRsZWQtc2NlbmUvdW50aXRsZWQtc2NlbmUuanNvbicsXG5cdFx0XHRjcmVhdG9yOiAnTWFyeSBBbm5lJyxcblx0XHRcdHRhZ3M6IFsnRW52aXJvbm1lbnQnLCdMb3ctUG9seSddXG5cdFx0fTtcblx0fTtcblx0TW9kZWwuZ2V0TW9kZWxVcmwgPSBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIHJlbmRlck9iai5tb2RlbEZpbGVVcmw7XG5cdH07XG5cdE1vZGVsLmdldE1vZGVsID0gZnVuY3Rpb24gKCkge1xuXHRcdHJldHVybiByZW5kZXJPYmo7XG5cdH07XG5cblxuXG5cdHJldHVybiBNb2RlbDtcblxufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcblxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdzaWduVXAnLCB7XG4gICAgICAgIHVybDogJy9zaWdudXAnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL3NpZ24tdXAvc2lnbi11cC5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ1NpZ25VcEN0cmwnXG4gICAgfSk7XG5cbn0pO1xuXG5hcHAuY29udHJvbGxlcignU2lnblVwQ3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsIFNpZ25VcCwgJHN0YXRlKSB7XG5cbiAgICAkc2NvcGUubG9naW4gPSB7fTtcbiAgICAkc2NvcGUuZXJyb3IgPSBudWxsO1xuXG4gICAgJHNjb3BlLnNlbmRTaWduVXAgPSBmdW5jdGlvbiAoc2lnblVwSW5mbykge1xuXG4gICAgICAgICRzY29wZS5lcnJvciA9IG51bGw7XG5cbiAgICAgICAgU2lnblVwLnNpZ251cChzaWduVXBJbmZvKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzdGF0ZS5nbygnbGlzdGluZycpO1xuICAgICAgICB9KS5jYXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUuZXJyb3IgPSAnSW52YWxpZCBsb2dpbiBjcmVkZW50aWFscy4nO1xuICAgICAgICB9KTtcblxuICAgIH07XG4gICAgXG4gICAgJHNjb3BlLmdldFVzZXJzID0gZnVuY3Rpb24oKXtcbiAgICAgICAgU2lnblVwLmdldFVzZXJzKCkudGhlbihmdW5jdGlvbih1c2Vycyl7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyh1c2VycylcbiAgICAgICAgfSlcbiAgICB9XG5cbn0pO1xuXG4iLCIndXNlIHN0cmljdCc7XG5cbmFwcC5jb250cm9sbGVyKCdVcGxvYWRDb250cm9sbGVyJywgZnVuY3Rpb24oJHNjb3BlKXtcblxufSk7IiwiJ3VzZSBzdHJpY3QnO1xuXG5hcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcil7XG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCd1cGxvYWQnLCB7XG5cdFx0dXJsOiAnL3VwbG9hZCcsXG5cdFx0dGVtcGxhdGVVcmw6ICdqcy91cGxvYWQvdXBsb2FkLmh0bWwnLFxuXHRcdGNvbnRyb2xsZXI6ICdVcGxvYWRDb250cm9sbGVyJ1xuXHR9KTtcbn0pOyIsIid1c2Ugc3RyaWN0JztcblxuYXBwLmNvbnRyb2xsZXIoJ1VzZXJDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgdXNlcil7XG5cdCRzY29wZS51c2VyID0gdXNlcjtcbn0pOyIsIid1c2Ugc3RyaWN0JztcblxuYXBwLmZhY3RvcnkoJ1VzZXInLCBmdW5jdGlvbiAoJGh0dHApIHtcblx0Ly8gVXNlciBDb250cnVjdG9yXG5cdGZ1bmN0aW9uIFVzZXIgKHByb3BzKXtcblx0XHRhbmd1bGFyLmV4dGVuZCh0aGlzLCBwcm9wcyk7XG5cdH1cblx0VXNlci51cmwgPSAnYXBpL3VzZXInXG5cblx0Ly8gXG5cblx0cmV0dXJuIFVzZXI7XG59KTsiLCIndXNlIHN0cmljdCc7XG5cbmFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCd1c2VyJywge1xuXHRcdHVybDogJy91c2VyLzpkaXNwbGF5TmFtZScsXG5cdFx0dGVtcGxhdGVVcmw6ICdqcy91c2VyL3VzZXIuaHRtbCcsXG5cdFx0Y29udHJvbGxlcjogJ1VzZXJDb250cm9sbGVyJyxcblx0XHRyZXNvbHZlOiB7XG5cdFx0XHR1c2VyOiBmdW5jdGlvbiAoVXNlciwgJHN0YXRlUGFyYW1zKSB7XG5cdFx0XHRcdC8vR2V0IFVzZXJcblx0XHRcdFx0Ly8gdmFyIHVzZXIgPSBuZXcgVXNlcih7ZGlzcGxheU5hbWU6ICRzdGF0ZVBhcmFtcy5kaXNwbGF5TmFtZX0pLmZldGNoKCk7XG5cdFx0XHRcdHZhciB1c2VyID0ge1xuXHRcdFx0XHRcdGZ1bGxOYW1lOiAnTWlsdG9uIEdsYXNlcicsXG5cdFx0XHRcdFx0ZGlzcGxheU5hbWU6ICdNaWx0J1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gQXR0YWNoIHJldHVybmVkIHVzZXIgdG8gc2NvcGVcblx0XHRcdFx0cmV0dXJuIHVzZXI7XG5cdFx0XHR9XG5cdFx0fVxuXHR9KTtcbn0pOyIsIid1c2Ugc3RyaWN0JztcblxuYXBwLmRpcmVjdGl2ZSgnZmllbGRGb2N1cycsIGZ1bmN0aW9uKCRwYXJzZSwgJHRpbWVvdXQpe1xuXHRyZXR1cm4ge1xuXHRcdHJlc3RyaWN0OiAnQScsXG5cdFx0bGluazogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50LCBhdHRycyl7XG5cdFx0XHR2YXIgc3RhdHVzID0gJHBhcnNlKGF0dHJzLmZpZWxkRm9jdXMpO1xuXHRcdFx0c2NvcGUuJHdhdGNoKHN0YXR1cywgZnVuY3Rpb24odmFsKXtcblx0XHRcdFx0Y29uc29sZS5sb2coJ3N0YXR1cyA9ICcsIHZhbCk7XG5cdFx0XHRcdGlmICh2YWwgPT09IHRydWUpe1xuXHRcdFx0XHRcdCR0aW1lb3V0KGZ1bmN0aW9uKCl7XG5cdFx0XHRcdFx0XHRlbGVtZW50WzBdLmZvY3VzKCk7XG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0fVxuXHRcdFx0fSlcblx0XHR9XG5cdH1cbn0pIiwiXG5hcHAuZmFjdG9yeSgnU2lnblVwJywgZnVuY3Rpb24gKCRodHRwLCAkc3RhdGUsICRsb2NhdGlvbikge1xuXHRyZXR1cm57XG5cdFx0c2lnbnVwOiBmdW5jdGlvbiAoY3JlZGVudGlhbHMpIHtcblx0XHRyZXR1cm4gJGh0dHAucG9zdCgnYXBpL3VzZXInLCBjcmVkZW50aWFscykudGhlbihmdW5jdGlvbiAocmVzKSB7XG5cdFx0XHRjb25zb2xlLmxvZyhyZXMuZGF0YSlcblx0XHRcdHJldHVybiByZXMuZGF0YTtcblx0XHR9KTtcblx0XHR9LFxuXG4gICAgICAgIGdldFVzZXJzOiBmdW5jdGlvbigpe1xuICAgICAgICAgICAgcmV0dXJuICRodHRwLmdldCgnYXBpL3VzZXInKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UuZGF0YTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cblx0fVxufSk7XG5cbiIsIid1c2Ugc3RyaWN0JztcblxuYXBwLmRpcmVjdGl2ZSgnY29sbGVjdGlvbicsIGZ1bmN0aW9uKCl7XG5cdHJldHVybiB7XG5cdFx0cmVzdHJpY3Q6ICdFJyxcblx0XHR0ZW1wbGF0ZVVybDogJ2pzL2NvbXBvbmVudHMvY29sbGVjdGlvbi9jb2xsZWN0aW9uLmh0bWwnLFxuXHRcdGNvbnRyb2xsZXI6ICdNYW5hZ2VyQ29udHJvbGxlcidcblx0fVxufSk7IiwiJ3VzZSBzdHJpY3QnO1xuXG5hcHAuZGlyZWN0aXZlKCdvYXV0aEJ1dHRvbicsIGZ1bmN0aW9uICgpIHtcblx0cmV0dXJuIHtcblx0XHRzY29wZToge1xuXHRcdFx0cHJvdmlkZXJOYW1lOiAnQCdcblx0XHR9LFxuXHRcdHJlc3RyaWN0OiAnRScsXG5cdFx0dGVtcGxhdGVVcmw6ICdqcy9jb21wb25lbnRzL29hdXRoLWJ1dHRvbi9vYXV0aC1idXR0b24uaHRtbCdcblx0fVxufSk7IiwiJ3VzZSBzdHJpY3QnO1xuXG5hcHAuZGlyZWN0aXZlKCduYXZiYXInLCBmdW5jdGlvbiAoKSB7XG5cdHJldHVybiB7XG5cdFx0cmVzdHJpY3Q6IFwiRVwiLFxuXHRcdHRlbXBsYXRlVXJsOiBcImpzL2NvbXBvbmVudHMvbmF2YmFyL25hdmJhci5odG1sXCIsXG5cdFx0Y29udHJvbGxlcjogJ01hbmFnZXJDb250cm9sbGVyJ1xuXHR9XG59KTsiLCIndXNlIHN0cmljdCc7XG5cbmFwcC5kaXJlY3RpdmUoJ3NlYXJjaGJhcicsIGZ1bmN0aW9uICgpe1xuXHRyZXR1cm4ge1xuXHRcdHJlc3RyaWN0OiAnRScsXG5cdFx0dGVtcGxhdGVVcmw6ICdqcy9jb21wb25lbnRzL3NlYXJjaGJhci9zZWFyY2hiYXIuaHRtbCdcblx0fVxufSk7IiwiJ3VzZSBzdHJpY3QnO1xuXG5hcHAuY29udHJvbGxlcignTW9kZWxEZXRhaWxDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgTW9kZWwsIG1vZGVsLCBtb2RlbHMpIHtcblx0JHNjb3BlLm1vZGVsID0gbW9kZWw7XG5cdCRzY29wZS5tb2RlbHMgPSBtb2RlbHM7XG59KTsiLCIndXNlIHN0cmljdCc7XG5cbmFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdtb2RlbCcsIHtcblx0XHR1cmw6ICcvbW9kZWwvOmlkJyxcblx0XHR0ZW1wbGF0ZVVybDogJ2pzL3Byb2R1Y3QvZGV0YWlsL3Byb2R1Y3QuZGV0YWlsLmh0bWwnLFxuXHRcdGNvbnRyb2xsZXI6ICdNb2RlbERldGFpbENvbnRyb2xsZXInLFxuXHRcdHJlc29sdmU6IHtcblx0XHRcdG1vZGVsOiBmdW5jdGlvbiAoTW9kZWwsICRzdGF0ZVBhcmFtcykge1xuXHRcdFx0XHQvLyBHZXQgTW9kZWxcblx0XHRcdFx0Ly8gdmFyIG1vZGVsID0gbmV3IE1vZGVsKHtfaWQ6ICRzdGF0ZW1QYXJhbXMuaWR9KS5mZXRjaCgpO1xuXHRcdFx0XHR2YXIgbW9kZWwgPSB7XG5cdFx0XHRcdFx0X2lkOiAxMjM2Mixcblx0XHRcdFx0XHR0aXRsZTogJ0JheW1heCcsXG5cdFx0XHRcdFx0c25hcHNob3RGaWxlVXJsOiAnL2ltYWdlcy9zbmFwc2hvdHMvYmF5bWF4LnBuZycsXG5cdFx0XHRcdFx0bW9kZWxGaWxlVXJsOiAnbW9kZWxzL2JheW1heC5qc29uJyxcblx0XHRcdFx0XHRjcmVhdG9yOiAnTWlsdG9uIEdsYXNlcicsXG5cdFx0XHRcdFx0dGFnczogWydDaGFyYWN0ZXInLCdGdXR1cmlzdGljJ11cblx0XHRcdFx0fTtcblxuXHRcdFx0XHQvLyBTZXQgbmV3IHJlbmRlck9ialxuXHRcdFx0XHRNb2RlbC5jaGFuZ2VNb2RlbChtb2RlbCk7XG5cblx0XHRcdFx0Ly8gQXR0YWNoIHJldHVybmVkIG1vZGVsIHRvIHNjb3BlXG5cdFx0XHRcdHJldHVybiBtb2RlbDtcblx0XHRcdH0sXG5cdFx0XHRtb2RlbHM6IGZ1bmN0aW9uIChNb2RlbCkge1xuXHRcdFx0XHRyZXR1cm4gTW9kZWwuZmV0Y2hBbGwoKTtcblx0XHRcdH1cblx0XHR9XHRcdFx0XHRcblx0fSk7XG59KTsiLCIndXNlIHN0cmljdCc7XG5cbmFwcC5jb250cm9sbGVyKCdMaXN0aW5nQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIG1vZGVscywgTW9kZWwpIHtcblxuICAgICRzY29wZS5jaGFuZ2VNb2RlbCA9IGZ1bmN0aW9uKCl7XG4gICAgXHRjb25zb2xlLmxvZygkc2NvcGUubW9kZWxzKTtcbiAgICBcdE1vZGVsLmNoYW5nZU1vZGVsKCk7XG4gICAgfVxuXG4gICAgJHNjb3BlLm1vZGVscyA9IG1vZGVscztcblxufSk7IiwiJ3VzZSBzdHJpY3QnO1xuXG5hcHAuY29uZmlnKCBmdW5jdGlvbigkc3RhdGVQcm92aWRlcil7XG5cblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2xpc3RpbmcnLCB7XG5cdFx0dXJsOiAnLycsXG5cdFx0dGVtcGxhdGVVcmw6ICdqcy9wcm9kdWN0L2xpc3RpbmcvbGlzdGluZy5odG1sJyxcblx0XHRjb250cm9sbGVyOiAnTGlzdGluZ0NvbnRyb2xsZXInLFxuXHRcdHJlc29sdmU6IHtcblx0XHRcdG1vZGVsczogZnVuY3Rpb24gKE1vZGVsKSB7XG5cdFx0XHRcdC8vIFNldCBJc2xhbmQgb2JqZWN0IGFzIGhvbWUgcmVuZGVyXG5cdFx0XHRcdE1vZGVsLmNoYW5nZU1vZGVsKHtcblx0XHRcdFx0XHRfaWQ6IDEyNDI0LFxuXHRcdFx0XHRcdHRpdGxlOiAnRmxvYXRpbmcgSXNsYW5kJyxcblx0XHRcdFx0XHRzbmFwc2hvdEZpbGVVcmw6ICcvaW1hZ2VzL3NuYXBzaG90cy91bnRpdGxlZC1zY2VuZS5wbmcnLFxuXHRcdFx0XHRcdG1vZGVsRmlsZVVybDogJ21vZGVscy91bnRpdGxlZC1zY2VuZS91bnRpdGxlZC1zY2VuZS5qc29uJyxcblx0XHRcdFx0XHRjcmVhdG9yOiAnTWFyeSBBbm5lJyxcblx0XHRcdFx0XHR0YWdzOiBbJ0Vudmlyb25tZW50JywnTG93LVBvbHknXVxuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHQvLyBjb25zb2xlLmxvZyhNb2RlbC5mZXRjaEFsbCgpKTtcblx0XHRcdFx0cmV0dXJuIE1vZGVsLmZldGNoQWxsKCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9KTtcblxufSk7IiwiJ3VzZSBzdHJpY3QnO1xuXG5hcHAuY29udHJvbGxlcignUmVuZGVyQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIE1vZGVsKSB7XG5cblx0JHNjb3BlLm1vZGVsID0gTW9kZWwuZ2V0TW9kZWwoKTtcblx0XG5cdCRzY29wZS4kd2F0Y2goZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gTW9kZWwuZ2V0TW9kZWxVcmwoKVxuXHR9LCBmdW5jdGlvbiAobmV3VmFsLCBvbGRWYWwpe1xuXHRcdCRzY29wZS5tb2RlbCA9IE1vZGVsLmdldE1vZGVsKCk7IFxuXHR9KTtcblxufSk7IiwiJ3VzZSBzdHJpY3QnO1xuXG5hcHAuZGlyZWN0aXZlKCduZ1dlYmdsJywgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICByZXN0cmljdDogJ0EnLFxuICAgICAgY29udHJvbGxlcjogXCJSZW5kZXJDb250cm9sbGVyXCIsXG4gICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHIpIHtcblxuICAgICAgICAvLyBTZXR1cCBzZWxlY3Rpb25zXG4gICAgICAgIHNjb3BlLnJlbmRlckZyYW1lID0gJCgnI3JlbmRlci1mcmFtZScpO1xuICAgICAgICB2YXIgcmVuZGVyRnJhbWVXaWR0aCA9IHNjb3BlLnJlbmRlckZyYW1lLndpZHRoKCk7XG4gICAgICAgIHZhciByZW5kZXJGcmFtZUhlaWdodCA9IHNjb3BlLnJlbmRlckZyYW1lLmhlaWdodCgpO1xuICAgICAgICB2YXIgcmVuZGVyT2JqZWN0U2NhbGVNb2RpZmllciA9IHJlbmRlckZyYW1lV2lkdGgvMTAyNDtcblxuICAgICAgICAvLyBTZXR1cCBUSFJFRS5qcyB2YXJpYWJsZXMgd2l0aCBzY29wZVxuICAgICAgICB2YXIgY2FtZXJhO1xuICAgICAgICAgICAgc2NvcGUuY2FtZXJhID0gY2FtZXJhO1xuICAgICAgICB2YXIgc2NlbmU7XG4gICAgICAgICAgICBzY29wZS5zY2VuZSA9IHNjZW5lO1xuICAgICAgICB2YXIgcmVuZGVyZXI7XG4gICAgICAgICAgICBzY29wZS5yZW5kZXJlciA9IHJlbmRlcmVyO1xuICAgICAgICB2YXIgcHJldmlvdXM7XG4gICAgICAgICAgICBzY29wZS5wcmV2aW91cyA9IHByZXZpb3VzO1xuXG4gICAgICAgIC8vIGluaXRpYWxpemUgc2NlbmVcbiAgICAgICAgaW5pdCgpO1xuXG4gICAgICAgIC8vIGxvYWQgZGVmYXVsdCBtb2RlbCBvbiBzY29wZSAtLSBqZWVwIG1vZGVsIC0tIHZpYSBBc3NpbXBKU09OTG9hZGVyXG4gICAgICAgIHZhciBsb2FkZXIyID0gbmV3IFRIUkVFLk9iamVjdExvYWRlcigpO1xuICAgICAgICB2YXIgbG9hZGVyMyA9IG5ldyBUSFJFRS5KU09OTG9hZGVyKCk7XG5cbiAgICAgICAgLy8gV2F0Y2ggZm9yIGNoYW5nZXMgdG8gc2NvcGVcbiAgICAgICAgc2NvcGUuJHdhdGNoKCdtb2RlbC5tb2RlbEZpbGVVcmwnLCBmdW5jdGlvbiAobmV3VmFsdWUsIG9sZFZhbHVlKXtcbiAgICAgICAgICBpZiAobmV3VmFsdWUgIT0gb2xkVmFsdWUpIHtcbiAgICAgICAgICAgIGxvYWRNb2RlbChuZXdWYWx1ZSk7IFxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8hISBIYW5kbGUgcmVtb3Zpbmcgb2JqZWN0IGFuZCBhZGRpbmcgbmV3IG9iamVjdFxuICAgICAgICBmdW5jdGlvbiBsb2FkTW9kZWwobW9kVXJsKSB7XG4gICAgICAgICAgICBsb2FkZXIyLmxvYWQobW9kVXJsLCBmdW5jdGlvbiAob2JqZWN0KSB7XG4gICAgICAgICAgICAgIG9iamVjdC5zY2FsZS54ID0gb2JqZWN0LnNjYWxlLnkgPSBvYmplY3Quc2NhbGUueiA9ICguMDI4ICogcmVuZGVyT2JqZWN0U2NhbGVNb2RpZmllcik7XG4gICAgICAgICAgICAgIG9iamVjdC5wb3NpdGlvbi55ID0gLjU7XG4gICAgICAgICAgICAgIG9iamVjdC51cGRhdGVNYXRyaXgoKTtcbiAgICAgICAgICAgICAgaWYgKHByZXZpb3VzKSBzY2VuZS5yZW1vdmUocHJldmlvdXMpO1xuICAgICAgICAgICAgICBzY2VuZS5hZGQob2JqZWN0KTtcblxuICAgICAgICAgICAgICBwcmV2aW91cyA9IG9iamVjdDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cblxuICAgICAgICAvLyBydW4gbG9hZCBtb2RlbCBvbiBjdXJyZW50IG1vZGVsVXJsXG4gICAgICAgIGxvYWRNb2RlbChzY29wZS5tb2RlbC5tb2RlbEZpbGVVcmwpO1xuICAgICAgICBhbmltYXRlKCk7XG5cbiAgICAgICAgLy8gU2V0dXAgVEhSRUUuanMgY2FtZXJhcywgc2NlbmUsIHJlbmRlcmVyLCBsaWdodGluZ1xuICAgICAgICBmdW5jdGlvbiBpbml0KCl7XG5cbiAgICAgICAgICAvLyBDYW1lcmFcbiAgICAgICAgICBjYW1lcmEgPSBuZXcgVEhSRUUuUGVyc3BlY3RpdmVDYW1lcmEoNTAsIHJlbmRlckZyYW1lV2lkdGggLyByZW5kZXJGcmFtZUhlaWdodCwgMSwgMjAwMCk7XG4gICAgICAgICAgY2FtZXJhLnBvc2l0aW9uLnNldCgyLDQsNSk7XG5cbiAgICAgICAgICAvLyBTY2VuZVxuICAgICAgICAgIHNjZW5lID0gbmV3IFRIUkVFLlNjZW5lKCk7XG4gICAgICAgICAgLy8gc2NlbmUuZm9nID0gbmV3IFRIUkVFLkZvZ0V4cDIoMHgwMDAwMDAsIDAuMDAwMSk7XG5cbiAgICAgICAgICAvLyBMaWdodHNcbiAgICAgICAgICBzY2VuZS5hZGQobmV3IFRIUkVFLkFtYmllbnRMaWdodCgweGNjY2NjYykpO1xuXG4gICAgICAgICAgdmFyIGRpcmVjdGlvbmFsTGlnaHQgPSBuZXcgVEhSRUUuRGlyZWN0aW9uYWxMaWdodCgweGNjY2NjYyk7XG4gICAgICAgICAgZGlyZWN0aW9uYWxMaWdodC5wb3NpdGlvbi54ID0gTWF0aC5yYW5kb20oKSAtIDAuNTtcbiAgICAgICAgICBkaXJlY3Rpb25hbExpZ2h0LnBvc2l0aW9uLnkgPSBNYXRoLnJhbmRvbSgpIC0gMC41O1xuICAgICAgICAgIGRpcmVjdGlvbmFsTGlnaHQucG9zaXRpb24ueiA9IE1hdGgucmFuZG9tKCkgLSAwLjU7XG4gICAgICAgICAgZGlyZWN0aW9uYWxMaWdodC5wb3NpdGlvbi5ub3JtYWxpemUoKTtcbiAgICAgICAgICBzY2VuZS5hZGQoZGlyZWN0aW9uYWxMaWdodCk7XG5cbiAgICAgICAgICAvLyEhISEgUmVuZGVyZXJcbiAgICAgICAgICByZW5kZXJlciA9IG5ldyBUSFJFRS5XZWJHTFJlbmRlcmVyKHsgYW50aWFsaWFzOiB0cnVlIH0pO1xuICAgICAgICAgIHJlbmRlcmVyLnNldFNpemUocmVuZGVyRnJhbWVXaWR0aCwgcmVuZGVyRnJhbWVIZWlnaHQpO1xuICAgICAgICAgIHJlbmRlcmVyLnNldENsZWFyQ29sb3IoIDB4ZmZmZmZmICk7XG4gICAgICAgICAgZWxlbWVudFswXS5hcHBlbmRDaGlsZChyZW5kZXJlci5kb21FbGVtZW50KTtcblxuICAgICAgICAgIC8vIENoZWNrIGZvciBSZXNpemUgRXZlbnRcbiAgICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgb25XaW5kb3dSZXNpemUsIGZhbHNlKTtcblxuICAgICAgICAgIC8vIGNvbnNvbGUubG9nKHNjZW5lKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEhhbmRsZSBSZXNpemVcbiAgICAgICAgZnVuY3Rpb24gb25XaW5kb3dSZXNpemUoZXZlbnQpe1xuICAgICAgICAgIHJlbmRlcmVyLnNldFNpemUoc2NvcGUucmVuZGVyRnJhbWUud2lkdGgoKSwgcmVuZGVyRnJhbWVIZWlnaHQpO1xuICAgICAgICAgIGNhbWVyYS5hc3BlY3QgPSBzY29wZS5yZW5kZXJGcmFtZS53aWR0aCgpIC8gcmVuZGVyRnJhbWVIZWlnaHQ7XG4gICAgICAgICAgY2FtZXJhLnVwZGF0ZVByb2plY3Rpb25NYXRyaXgoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEFuaW1hdGVcbiAgICAgICAgdmFyIHQgPSAwOyAvLyA/XG4gICAgICAgIGZ1bmN0aW9uIGFuaW1hdGUoKSB7ICAgICAgICAgIFxuICAgICAgICAgIHJlbmRlcigpO1xuICAgICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZShhbmltYXRlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEhhbmRsZSByZS1SZW5kZXJpbmcgb2Ygc2NlbmUgZm9yIHNwaW5uaW5nXG4gICAgICAgIGZ1bmN0aW9uIHJlbmRlcigpeyBcbiAgICAgICAgICB2YXIgdGltZXIgPSBEYXRlLm5vdygpICogMC4wMDAxNTtcbiAgICAgICAgICAgIGNhbWVyYS5wb3NpdGlvbi54ID0gTWF0aC5jb3ModGltZXIpICogMTA7XG4gICAgICAgICAgICBjYW1lcmEucG9zaXRpb24ueSA9IDQ7XG4gICAgICAgICAgICBjYW1lcmEucG9zaXRpb24ueiA9IE1hdGguc2luKHRpbWVyKSAqIDguNTtcbiAgICAgICAgICAgIGNhbWVyYS5sb29rQXQoc2NlbmUucG9zaXRpb24pO1xuICAgICAgICAgICAgcmVuZGVyZXIucmVuZGVyKHNjZW5lLCBjYW1lcmEpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxufSk7IiwiJ3VzZSBzdHJpY3QnO1xuXG5hcHAuZGlyZWN0aXZlKCdwcm9kdWN0VGlsZScsIGZ1bmN0aW9uKCl7XG5cdHJldHVybiB7XG5cdFx0cmVzdHJpY3Q6ICdFJyxcblx0XHRzY29wZToge1xuXHRcdFx0bW9kZWw6ICc9J1xuXHRcdH0sXG5cdFx0dGVtcGxhdGVVcmw6ICdqcy9wcm9kdWN0L3RpbGUvcHJvZHVjdC50aWxlLmh0bWwnXG5cdH1cbn0pOyJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==