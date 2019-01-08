/* If you're feeling fancy you can add interactivity 
    to your site with Javascript */

// prints "hi" in the browser's dev tools console
var color = prompt("enter color", "red");
var style = prompt("enter style property", "backgroundColor");

var helloWorldElement = document.getElementById('p1');
helloWorldElement.style[style] = color;
