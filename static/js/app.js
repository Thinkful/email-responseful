'use strict';

var app = angular.module('ResponsefulApp', ['ngRoute'])

app.config(function($routeProvider, $locationProvider){
    $routeProvider
    .when('/', {
        templateUrl: '/static/views/dashboard.html',
        controller: 'DashboardCtrl'
    })
    .when('/upload/:sh/:ws', {
        templateUrl: '/static/views/uploader.html',
        controller: 'UploaderCtrl'
    })
    .otherwise({ 
        redirectTo: '/' 
    })

    $locationProvider.html5Mode(true)
})