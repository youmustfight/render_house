'use strict';

var app = angular.module('renderhouse', ['ui.router']);

app.config(function ($urlRouterProvider, $locationProvider){
	$locationProvider.html5Mode(true);
	$urlRouterProvider.otherwise('/');
});