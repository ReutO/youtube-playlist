(function () {

    "use strict";

    var registerModule = angular.module("registerModule", ["serviceModule"]);

    registerModule.controller("RegisterController", function ($scope, $http, $menuFocus, $saveCookies, $wachedVideos) {

        $scope.wachedVideos = $wachedVideos.returnWachedVideos();

        //calling menuFocus service to change the focus on the main menu
        var menuFocus = function () {
            $menuFocus.startMenuFocus("menuLogin", "menuPlaylist", "menuHome");
        }
        menuFocus();

        //function that is calling service to save cookie
        var saveCookies = function (variable, value) {
            $saveCookies.startSaveCookies(variable, value);
        }
        // function to make a registration.
        // sends name, email and password.
        // recieves wrong email (email registered already), or errors.
        // in case of success, removes saved videos from local storage of the previos user, 
        //client recieves a token to save in cookies using a service and then client redirect to playlist.
        $scope.register = function () {
            //selecting the parameters from ng-model
            $http.post("/register", { firstName: $scope.firstName, lastName: $scope.lastName, email: $scope.email, password: $scope.password })
               .then(function (response) {
                   var res = response.data;
                   if (res.code == 170) {  //case the email registered already
                       $scope.modal = {
                           title: "Email already exists",
                           message: res.message
                       }
                       $("#generalModal").modal();
                   } else if (res.code == 110 || res.code == 120) {  // case there's a problem reading / writing json file
                       $scope.modal = {
                           code: res.code,
                           message: res.message
                       }
                       $("#errorReadyModal").modal();
                   } else if(res.user) {  //case register success
                       $scope.user = response.data;
                       saveCookies("token", $scope.user.user.token); //token is being saved and changes on every login
                       if ($scope.wachedVideos) {
                           localStorage.removeItem("wachedVideos");
                       }
                       location.hash = "#!/playlist";
                   } else {  // case the response is with unexpected errors
                    $scope.error = res;
                   $("#errorModal").modal();
                   }
               }, function (err) {
                   $scope.error = err;
                   $("#errorModal").modal();
               }
               );
        }

    });
})();