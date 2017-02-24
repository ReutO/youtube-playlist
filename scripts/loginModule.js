(function () {

    "use strict";

    var loginModule = angular.module("loginModule", ["serviceModule"]);

    loginModule.controller("LoginController", function ($scope, $http, $menuFocus, $saveCookies, $wachedVideos) {

        //adding last watch videos to the scope (to be used in the footer html)
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

        // function to make login.
        // sends email and password.
        // recieves wrong password / email, or errors
        // in case of success, remove saved videos from local storage of the previos user, 
        //client recieves a token to save in cookies using a service and then client redirect to playlist.
        $scope.login = function () {
            $http.post("/login", { email: $scope.emailLogin, password: $scope.passwordLogin })
            .then(function (response) {
                var res = response.data;
                if (res.code == 100) {  //case responce success
                    var token = res.token;
                    saveCookies("token", token); //token is being saved and changes on every login
                    if ($scope.wachedVideos) {
                        localStorage.removeItem("wachedVideos");
                    }
                    location.hash = "#!/playlist";
                } else if (res.code == 150) { //// case password isn't correct
                    $scope.modal = {
                        title: "Incorrect password",
                        message: res.message
                    }
                    $("#generalModal").modal();
                } else if (res.code == 160) {  // case email isn't correct
                    $scope.modal = {
                        title: "Incorrect email",
                        message: res.message
                    }
                    $("#generalModal").modal();
                } else if (res.code == 110 || res.code == 120) {  // case there's a problem reading / writing json file
                    $scope.modal = {
                        code: res.code,
                        message: res.message
                    }
                    $("#errorReadyModal").modal();
                } else {  // case the response is with unexpected errors
                    $scope.error = res;
                    $("#errorModal").modal();
                }
            }, function (err) { 
                $scope.error = err;
                $("#errorModal").modal();
            }
            );
        };

    });

})();