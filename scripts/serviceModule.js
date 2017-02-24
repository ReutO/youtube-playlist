(function () {

    "use strict";

    var serviceModule = angular.module('serviceModule', []);
    serviceModule.service('$menuFocus', function () {
        //a service that changes the focus of the of the menu accorging to the page the user is in.
        // recieves the id of the menu that should be focused, and the other id's that shouldn't be.
        // checks if in there's a focus already on the menu item (e.g clicking twice on an item).
        // if there is a focus function doesn't do anything.
        // if there isn't, function adds a "class= active", and remove the class from the other menu items using the id's that were given.
        this.startMenuFocus = function (idFocus, idNotFocus1, idNotfocus2) {
            var menuFocus = document.getElementById(idFocus);
            var isclassMenu = menuFocus.getAttribute("class");
            if (!isclassMenu) {
                menuFocus.setAttribute("class", "active");
            }
            //removing the focus on the other menu buttons
            removeAtrr(idNotFocus1);
            removeAtrr(idNotfocus2);

            function removeAtrr(idName) {
                var id = document.getElementById(idName);
                var isclassMenu = id.getAttribute("class");
                if (isclassMenu) {
                    id.removeAttribute("class");
                }
            }
        }
    });
    serviceModule.service('$saveCookies', function () {
        // a service that saves cookie token.
        //why a cookie? because the cookie is being sent on every server request. local storage doesn't.
        this.startSaveCookies = function (variable, value) {
            var d = new Date();
            d.setFullYear(d.getFullYear() + 1);
            var expires = d.toUTCString();
            var variableCookie = variable;
            var valueCookie = value;

            document.cookie = variableCookie + "=" + valueCookie + ";expires=" + expires;
        }
    })
    serviceModule.service('$embedUrl', function () {
        // a service that creates embed url from regular youtube url that the user entered.
        //the goal is to find the video key (e.g: v=**lkjnkjn**), and add it to the embed link.
        // e.g: from the link: https://www.youtube.com/watch?v=8SbUC-UaAxE&list=PL3485902CC4FB6C67, remove the key: "8SbUC-UaAxE", and add it to: https://www.youtube.com/embed/8SbUC-UaAxE.
        // the function handels two kinds of links:
        //https://www.youtube.com/watch?v=8SbUC-UaAxE&list=PL3485902CC4FB6C67
        //and
        //https://www.youtube.com/watch?v=zRIbf6JqkNc

        this.createEmbedUrl = function (urlVariables) {
            var EmbedLink = "";
            if (urlVariables.length == 1) {
                var allUrlVariables = urlVariables[0].split('=');
                for (var i = 0; i < allUrlVariables.length; i++) {
                    if (allUrlVariables[i] == 'v') {
                        EmbedLink = "https://www.youtube.com/embed/" + allUrlVariables[i + 1];
                        break;
                    }
                }
            } else {
                for (var i = 0 ; i < urlVariables.length ; i++) {
                    var allUrlVariables = urlVariables[i].split("=");
                    if (allUrlVariables[0] == 'v') {
                        EmbedLink = "https://www.youtube.com/embed/" + allUrlVariables[1];
                        break;
                    }
                }
            }
            return EmbedLink;
        }
    })
    // a service that returns local storage of wached videos
    serviceModule.service('$wachedVideos', function () {
        this.returnWachedVideos = function () {
            var wachedVideosString = localStorage.getItem("wachedVideos");
            var wachedVideos = JSON.parse(wachedVideosString);
            return wachedVideos;
        }
    })
})();