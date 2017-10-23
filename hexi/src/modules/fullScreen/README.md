**WARNING: This code is now deprecated and should not be used!**

FullScreen
==========

Use FullScreen to launch a canvas element in full screen mode.

First, create a new instance of FullScreen and supply any HTML canvas
element in the constructor argument.
```js
let fs = new FullScreen(canvasElement);
```

Then add this bit of code at the beginning of in your application:
```js
fs.enableFullscreen();
```
As soon as the user clicks or touches the canvas, the application will enter full screen mode. The
full screen canvas will be aligned and centered in the screen. 

To exit full screen mode, the user can press `esc` on the keyboard. Or, you can 
define your own custom exit keys by providing ascii key code numbers as 
`enableFullScreen`'s arguments, like this:
```js
fs.enableFullscreen(88, 120);
```
In this case pressing lowercase `x` (88) or uppercase `X` (120) will exit full screen 
mode. If you choose to use full screen mode, make sure you inform your users
of the keys they need to press to exit it! 
