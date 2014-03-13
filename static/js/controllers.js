'use strict';

app.controller('DashboardCtrl', ['$scope', '$location', '$http', '$routeParams', 'Utils',
    function($scope, $location, $http, $routeParams, Utils) {
        $scope.messages = [];
        $scope.filters = {
            businessHours: false
        }
        $scope.focusedList = false;

        $scope.toggleFilter = function(filter) {
            $scope.filters[filter] = !$scope.filters[filter]
        }

        $scope.arraysEqual= function(a, b) {
            if(a.length != b.length) { return false }
            for(var i=0; i < a.length; i++) {
                if(a[i] !== b[i]) { return false }
            }
            return true
        }

        $scope.listFocus = function(list) {
            if($scope.focusedList && $scope.arraysEqual(list, $scope.focusedList)) { 
                $scope.focusedList = false
            }
            $scope.focusedList = list;
        }

        $scope.getDaysAgo = function(n) {
            var date = new Date();
            if(n != 0) {
                date.setDate(date.getDate() - n);
            }
            var day = String(date.getDate());
            var month = String(date.getMonth() + 1);
            var year = String(date.getFullYear());

            if(day.length < 2) {
                day = '0' + day;
            }

            if(month.length < 2) {
                month = '0' + month;
            }

            return year + '-' + month + '-' + day;
        }

        $scope.dates = { 
            start: $scope.getDaysAgo(30),
            end: $scope.getDaysAgo(-1)
        }

        $scope.fetchData = function() {
            $http.post('/fetch_data', {
                start: $scope.dates.start,
                end: $scope.dates.end
            })
            .success(function(data) {
                $scope.messages = data;
                $scope.analyze();
            });
        };

        $scope.analyze = function() {
            // Bucket messages
            $scope.data = Utils.bucketMessages($scope.messages, $scope.filters)
        }

        $scope.focusEmail = function(email) {

            $scope.focusedEmail = {
                email: email,
                info: $scope.data.emails[email]
            } 
        }

        $scope.$watch('dates.start', $scope.fetchData)
        $scope.$watch('dates.end', $scope.fetchData)
        $scope.$watch('filters.businessHours', $scope.fetchData)
    }])

app.controller('UploaderCtrl', ['$scope', '$location', '$http', '$routeParams',
    function($scope, $location, $http, $routeParams) {
        $scope.spreadsheet = $routeParams.sh;
        $scope.worksheet = $routeParams.ws;
        
        $scope.submitData = function() {
            $scope.uploadMessage = true;
            $http.post('/upload_data', {
                spreadsheet: $scope.spreadsheet,
                worksheet: $scope.worksheet
            })
            .success(function(data) {
                $location.path('/')
            });
        }
    }])