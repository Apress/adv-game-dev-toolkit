"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

//The Fullscreen API is in flux and has a quirky browser
//implementations. Here's a fix for it, thanks to Norman Paschke:

(function (doc) {
  // Use JavaScript strict mode
  "use strict"

  /*global Element, Promise */

  ;
  var pollute = true,
      api,
      vendor,
      apis = {
    // http://dvcs.w3.org/hg/fullscreen/raw-file/tip/Overview.html
    w3: {
      enabled: "fullscreenEnabled",
      element: "fullscreenElement",
      request: "requestFullscreen",
      exit: "exitFullscreen",
      events: {
        change: "fullscreenchange",
        error: "fullscreenerror"
      }
    },
    webkit: {
      enabled: "webkitFullscreenEnabled",
      element: "webkitCurrentFullScreenElement",
      request: "webkitRequestFullscreen",
      exit: "webkitExitFullscreen",
      events: {
        change: "webkitfullscreenchange",
        error: "webkitfullscreenerror"
      }
    },
    moz: {
      enabled: "mozFullScreenEnabled",
      element: "mozFullScreenElement",
      request: "mozRequestFullScreen",
      exit: "mozCancelFullScreen",
      events: {
        change: "mozfullscreenchange",
        error: "mozfullscreenerror"
      }
    },
    ms: {
      enabled: "msFullscreenEnabled",
      element: "msFullscreenElement",
      request: "msRequestFullscreen",
      exit: "msExitFullscreen",
      events: {
        change: "MSFullscreenChange",
        error: "MSFullscreenError"
      }
    }
  },
      w3 = apis.w3;

  // Loop through each vendor's specific API
  for (vendor in apis) {
    // Check if document has the "enabled" property
    if (apis[vendor].enabled in doc) {
      // It seems this browser support the fullscreen API
      api = apis[vendor];
      break;
    }
  }

  function dispatch(type, target) {
    var event = doc.createEvent("Event");

    event.initEvent(type, true, false);
    target.dispatchEvent(event);
  } // end of dispatch()

  function handleChange(e) {
    e.stopPropagation();
    e.stopImmediatePropagation();

    // Recopy the enabled and element values
    doc[w3.enabled] = doc[api.enabled];
    doc[w3.element] = doc[api.element];

    dispatch(w3.events.change, e.target);
  } // end of handleChange()

  function handleError(e) {
    dispatch(w3.events.error, e.target);
  } // end of handleError()

  // Prepare a resolver to use for the requestFullscreen and exitFullscreen's promises
  // Use a closure since we need to check which method was used
  function createResolver(method) {
    return function resolver(resolve, reject) {
      // Reject the promise if asked to exitFullscreen and there is no element currently in fullscreen
      if (method === w3.exit && !doc[api.element]) {
        setTimeout(function () {
          reject(new TypeError());
        }, 1);
        return;
      }

      // When receiving an internal fullscreenchange event, fulfill the promise
      function change() {
        resolve();
        doc.removeEventListener(api.events.change, change, false);
      }

      // When receiving an internal fullscreenerror event, reject the promise
      function error() {
        reject(new TypeError());
        doc.removeEventListener(api.events.error, error, false);
      }

      doc.addEventListener(api.events.change, change, false);
      doc.addEventListener(api.events.error, error, false);
    };
  }

  // Pollute only if the API doesn't already exists
  if (pollute && !(w3.enabled in doc) && api) {
    // Add listeners for fullscreen events
    doc.addEventListener(api.events.change, handleChange, false);
    doc.addEventListener(api.events.error, handleError, false);

    // Copy the default value
    doc[w3.enabled] = doc[api.enabled];
    doc[w3.element] = doc[api.element];

    // Match the reference for exitFullscreen
    doc[w3.exit] = function () {
      var result = doc[api.exit]();
      return !result && window.Promise ? new Promise(createResolver(w3.exit)) : result;
    };

    // Add the request method to the Element's prototype
    Element.prototype[w3.request] = function () {
      var result = this[api.request].apply(this, arguments);
      return !result && window.Promise ? new Promise(createResolver(w3.request)) : result;
    };
  }

  // Return the API found (or undefined if the Fullscreen API is unavailable)
  return api;
})(document);

//Here's the FullScreen class, which contains all the relevant
//application code

var FullScreen = (function () {
  function FullScreen(element) {
    _classCallCheck(this, FullScreen);

    this.element = element;
    this.fullscreenScale = 1;
  }

  //`requestFullScreen` is used by `enableFullScreen` to launch
  //fullscreen mode.

  _createClass(FullScreen, [{
    key: "requestFullScreen",
    value: function requestFullScreen() {
      if (!document.fullscreenEnabled) {
        //console.log("requestFullscreen")
        //if (this.fullScreenScale !== 1) {
        this.element.requestFullscreen();
      }
    }
  }, {
    key: "exitFullScreen",

    //`exitFullScreen` is used by `enableFullScreen` to exit
    //fullscreen mode.
    value: function exitFullScreen() {
      if (document.fullscreenEnabled) {
        //if (this.fullScreenScale !== 1) {
        document.exitFullscreen();
      }
    }
  }, {
    key: "alignFullScreen",

    //`alignFullScreen` is called by `enableFullScreen` to center and
    //align the element vertically or horizontally inside the users
    //screen. It also sets `this.fullScreenScale` which can optionally
    //be used by your application for setting things like the pointer's
    //scale
    value: function alignFullScreen() {
      var scaleX = undefined,
          scaleY = undefined;

      //Scale the element to the correct size.
      //Figure out the scale amount on each axis.
      scaleX = screen.width / this.element.width;
      scaleY = screen.height / this.element.height;

      //Set the scale based on whichever value is less: `scaleX` or `scaleY`.
      this.fullscreenScale = Math.min(scaleX, scaleY);

      //To center the element we need to inject some CSS
      //and into the HTML document's `<style>` tag. Some
      //browsers require an existing `<style>` tag to do this, so
      //if no `<style>` tag already exists, let's create one and
      //append it to the `<body>:
      var styleSheets = document.styleSheets;
      if (styleSheets.length === 0) {
        var divNode = document.createElement("div");
        divNode.innerHTML = "<style></style>";
        document.body.appendChild(divNode);
      }

      //Unfortunately we also need to do some browser detection
      //to inject the full screen CSS with the correct vendor
      //prefix. So, let's find out what the `userAgent` is.
      //`ua` will be an array containing lower-case browser names.
      var ua = navigator.userAgent.toLowerCase();

      //Now Decide whether to center the canvas vertically or horizontally.
      //Wide canvases should be centered vertically, and
      //square or tall canvases should be centered horizontally.

      if (this.element.width > this.element.height) {

        //Center vertically.
        //Add CSS to the stylesheet to center the canvas vertically.
        //You need a version for each browser vendor, plus a generic
        //version
        //(Unfortunately the CSS string cannot include line breaks, so
        //it all has to be on one long line.)
        if (ua.indexOf("safari") !== -1 || ua.indexOf("chrome") !== -1) {
          document.styleSheets[0].insertRule("canvas:-webkit-full-screen {position: fixed; width: 100%; height: auto; top: 0; right: 0; bottom: 0; left: 0; margin: auto; object-fit: contain}", 0);
        } else if (ua.indexOf("firefox") !== -1) {
          document.styleSheets[0].insertRule("canvas:-moz-full-screen {position: fixed; width: 100%; height: auto; top: 0; right: 0; bottom: 0; left: 0; margin: auto; object-fit: contain;}", 0);
        } else if (ua.indexOf("opera") !== -1) {
          document.styleSheets[0].insertRule("canvas:-o-full-screen {position: fixed; width: 100%; height: auto; top: 0; right: 0; bottom: 0; left: 0; margin: auto; object-fit: contain;}", 0);
        } else if (ua.indexOf("explorer") !== -1) {
          document.styleSheets[0].insertRule("canvas:-ms-full-screen {position: fixed; width: 100%; height: auto; top: 0; right: 0; bottom: 0; left: 0; margin: auto; object-fit: contain;}", 0);
        } else {
          document.styleSheets[0].insertRule("canvas:fullscreen {position: fixed; width: 100%; height: auto; top: 0; right: 0; bottom: 0; left: 0; margin: auto; object-fit: contain;}", 0);
        }
      } else {

        //Center horizontally.
        if (ua.indexOf("safari") !== -1 || ua.indexOf("chrome") !== -1) {
          document.styleSheets[0].insertRule("canvas:-webkit-full-screen {height: 100%; margin: 0 auto; object-fit: contain;}", 0);
        } else if (ua.indexOf("firefox") !== -1) {
          document.styleSheets[0].insertRule("canvas:-moz-full-screen {height: 100%; margin: 0 auto; object-fit: contain;}", 0);
        } else if (ua.indexOf("opera") !== -1) {
          document.styleSheets[0].insertRule("canvas:-o-full-screen {height: 100%; margin: 0 auto; object-fit: contain;}", 0);
        } else if (ua.indexOf("msie") !== -1) {
          document.styleSheets[0].insertRule("canvas:-ms-full-screen {height: 100%; margin: 0 auto; object-fit: contain;}", 0);
        } else {
          document.styleSheets[0].insertRule("canvas:fullscreen {height: 100%; margin: 0 auto; object-fit: contain;}", 0);
        }
      }
    }

    /*
    Use `enableFullScreen` to make the browser display the game full screen.
    It automatically centers the game canvas for the best fit. Optionally supply any number of ascii
    keycodes as arguments to represent the keyboard keys that should exit fullscreen mode.
    */

  }, {
    key: "enableFullScreen",
    value: function enableFullScreen() {
      var _this = this;

      //Center and align the fullscreen element.
      this.alignFullScreen();

      //Add mouse and touch listeners to the canvas to enable
      //fullscreen mode.
      this.element.addEventListener("mouseup", this.requestFullScreen.bind(this), false);
      this.element.addEventListener("touchend", this.requestFullScreen.bind(this), false);

      for (var _len = arguments.length, exitKeyCodes = Array(_len), _key = 0; _key < _len; _key++) {
        exitKeyCodes[_key] = arguments[_key];
      }

      if (exitKeyCodes) {
        exitKeyCodes.forEach(function (keyCode) {
          window.addEventListener("keyup", function (event) {
            if (event.keyCode === keyCode) {
              _this.exitFullScreen();
            }
            event.preventDefault();
          }, false);
        });
      }
    }
  }]);

  return FullScreen;
})();
//# sourceMappingURL=fullScreen.js.map