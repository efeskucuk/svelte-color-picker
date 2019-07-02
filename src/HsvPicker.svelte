<script>
import {onMount,createEventDispatcher} from 'svelte';


onMount(() => {
 document.addEventListener("mouseup", mouseUp);
 document.addEventListener("mousemove", mouseMove);
});

const dispatch = createEventDispatcher();
let tracked;
let h = 1;
let s = 1;
let v = 1;
let a = 1;
let r = 255;
let g = 0;
let b = 0;
let hexValue = '#FF0000';


function colorChangeCallback() {
  dispatch('colorChange', {
  			r: r,
        g: g,
        b: b,
        a: a
  		});
}

function mouseMove(event) {
 if (tracked) {
  let mouseX = event.clientX;
  let mouseY = event.clientY;
  let trackedPos = tracked.getBoundingClientRect();
  let xPercentage, yPercentage, picker;
  switch (tracked.id) {
   case "colorsquare-event":
    xPercentage = (mouseX - trackedPos.x) / 240 * 100;
    yPercentage = (mouseY - trackedPos.y) / 160 * 100;
    (xPercentage > 100) ? xPercentage = 100: (xPercentage < 0) ? xPercentage = 0 : null;
    (yPercentage > 100) ? yPercentage = 100: (yPercentage < 0) ? yPercentage = 0 : null;
    picker = document.querySelector("#colorsquare-picker");
    yPercentage = yPercentage.toFixed(2);
    xPercentage = xPercentage.toFixed(2);
    picker.style.top = yPercentage + "%";
    picker.style.left = xPercentage + "%";
    s = xPercentage / 100;
    v = 1 - yPercentage / 100;
    colorChange();
    break;
   case "hue-event":
    xPercentage = (mouseX - 10 - trackedPos.x) / 220 * 100;
    (xPercentage > 100) ? xPercentage = 100: (xPercentage < 0) ? xPercentage = 0 : null;
    xPercentage = xPercentage.toFixed(2);
    picker = document.querySelector("#hue-picker");
    picker.style.left = xPercentage + "%";
    h = xPercentage / 100;
    hueChange();
    break;
   case "alpha-event":
    xPercentage = (mouseX - 10 - trackedPos.x) / 220 * 100;
    (xPercentage > 100) ? xPercentage = 100: (xPercentage < 0) ? xPercentage = 0 : null;
    xPercentage = xPercentage.toFixed(2);
    picker = document.querySelector("#alpha-picker");
    picker.style.left = xPercentage + "%";
    a = xPercentage / 100;
    colorChange();
    break;
  }

 }

}

function csDown(event) {
 tracked = event.currentTarget;
 let xPercentage = ((event.offsetX + 1) / 240) * 100;
 let yPercentage = ((event.offsetY + 1) / 160) * 100;
 yPercentage = yPercentage.toFixed(2);
 xPercentage = xPercentage.toFixed(2)
 let picker = document.querySelector("#colorsquare-picker");
 picker.style.top = yPercentage + "%";
 picker.style.left = xPercentage + "%";
 s = xPercentage / 100;
 v = 1 - yPercentage / 100;
 colorChange();
}

function mouseUp(event) {
 tracked = null;
}

function hueDown(event) {
 tracked = event.currentTarget;
 let xPercentage = ((event.offsetX - 9) / 220) * 100;
 xPercentage = xPercentage.toFixed(2);
 let picker = document.querySelector("#hue-picker");
 picker.style.left = xPercentage + "%";
 h = xPercentage / 100;
 hueChange();
}

function hueChange() {
 let rgb = hsvToRgb(h, 1, 1)
 let colorsquare = document.querySelector(".colorsquare")
 colorsquare.style.background = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},1)`;
 colorChange();
}

function colorChange() {
 let rgb = hsvToRgb(h, s, v);
 r = rgb[0];
 g = rgb[1];
 b = rgb[2];
 hexValue = RGBAToHex();
 let pickedColor = document.querySelector(".color-picked");
 pickedColor.style.background = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`;
 colorChangeCallback();
}


function alphaDown(event) {
 tracked = event.currentTarget;
 let xPercentage = ((event.offsetX - 9) / 220) * 100;
 xPercentage = xPercentage.toFixed(2);
 let picker = document.querySelector("#alpha-picker");
 picker.style.left = xPercentage + "%";
 a = xPercentage / 100;
 colorChange();
}

//Math algorithms
function hsvToRgb(h, s, v) {
 var r, g, b;

 var i = Math.floor(h * 6);
 var f = h * 6 - i;
 var p = v * (1 - s);
 var q = v * (1 - f * s);
 var t = v * (1 - (1 - f) * s);

 switch (i % 6) {
  case 0:
   r = v, g = t, b = p;
   break;
  case 1:
   r = q, g = v, b = p;
   break;
  case 2:
   r = p, g = v, b = t;
   break;
  case 3:
   r = p, g = q, b = v;
   break;
  case 4:
   r = t, g = p, b = v;
   break;
  case 5:
   r = v, g = p, b = q;
   break;
 }

 return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function RGBAToHex() {
 let rHex = r.toString(16);
 let gHex = g.toString(16);
 let bHex = b.toString(16);

 if (rHex.length == 1)
  rHex = "0" + rHex;
 if (gHex.length == 1)
  gHex = "0" + gHex;
 if (bHex.length == 1)
  bHex = "0" + bHex;


 return ("#" + rHex + gHex + bHex).toUpperCase();
}
</script>

<style>
.main-container {
	width: 240px;
	height: 265px;
	background: #f2f2f2;
	border-radius: 1px;
	-webkit-box-shadow: 0px 0px 4px 0px rgba(0, 0, 0, 0.51);
	-moz-box-shadow: 0px 0px 4px 0px rgba(0, 0, 0, 0.51);
	box-shadow: 0px 0px 4px 0px rgba(0, 0, 0, 0.51);
  -webkit-touch-callout: none;
    -webkit-user-select: none;
     -khtml-user-select: none;
       -moz-user-select: none;
        -ms-user-select: none;
            user-select: none;
}

.saturation-gradient {
	background: linear-gradient(to right, rgb(255, 255, 255), rgba(255, 255, 255, 0));
	width: 240px;
	height: 160px;
}

.value-gradient {
	background: linear-gradient(to top, rgb(0, 0, 0), rgba(0, 0, 0, 0));
	overflow: hidden;
	width: 240px;
	height: 160px;
}

.hue-selector {
	background: linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%);
	margin: 15px 10px 10px 10px;
	border-radius: 10px;
	height: 10px;
}

#hue-picker {
	background: #FFF;
	width: 12px;
	height: 12px;
	border-radius: 50%;
	left: 0%;
	position: relative;
	cursor: default;
	transform: translate(-5px, -1px);
	-webkit-box-shadow: 0px 0px 5px 0px rgba(0, 0, 0, 0.67);
	-moz-box-shadow: 0px 0px 5px 0px rgba(0, 0, 0, 0.67);
	box-shadow: 0px 0px 5px 0px rgba(0, 0, 0, 0.67);
}

#hue-event {
	width: 236px;
	height: 14px;
	transform: translate(-8px, -14px);
	cursor: default;
}

.alpha-selector {
	background-image: linear-gradient(45deg, #808080 25%, transparent 25%), linear-gradient(-45deg, #808080 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #808080 75%), linear-gradient(-45deg, transparent 75%, #808080 75%);
	background-size: 10px 10px;
	background-position: 0 0, 0 5px, 5px -5px, -5px 0px;
	margin: 10px 10px;
	border-radius: 10px;
	height: 10px;
	position: relative;
}

#alpha-picker {
	background: #FFF;
	width: 12px;
	height: 12px;
	border-radius: 50%;
	left: 100%;
	position: relative;
	cursor: default;
	transform: translate(-5px, -11px);
	-webkit-box-shadow: 0px 0px 5px 0px rgba(0, 0, 0, 0.67);
	-moz-box-shadow: 0px 0px 5px 0px rgba(0, 0, 0, 0.67);
	box-shadow: 0px 0px 5px 0px rgba(0, 0, 0, 0.67);
}

#alpha-event {
	width: 236px;
	height: 14px;
	transform: translate(-8px, -24px);
	cursor: default;
}

.alpha-value {
	background: linear-gradient(to right, rgba(0, 0, 0, 0), rgba(0, 0, 0, 1));
	width: 100%;
	height: 100%;
	border-radius: 10px;
}

.colorsquare {
	background: rgb(255, 0, 0);
}

#colorsquare-picker {
	margin: 0;
	padding: 0;
	width: 12px;
	height: 12px;
	border-radius: 50%;
	border: 2px solid #FFFB;
	position: relative;
	transform: translate(-9px, -9px);
	left: 100%;
}

#colorsquare-event {
	width: 100%;
	height: 100%;
	position: relative;
	transform: translate(0, -16px);
}

.color-info-box {
	margin: 10px;
	width: 100%;
	height: 22px;
	vertical-align: middle;
	position: relative;
}

.color-picked {
	width: 18px;
	height: 18px;
	border-radius: 2px;
	background: rgba(255, 0, 0, 1);
	display: inline-block;
}

.color-picked-bg {
	background-image: linear-gradient(45deg, #808080 25%, transparent 25%), linear-gradient(-45deg, #808080 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #808080 75%), linear-gradient(-45deg, transparent 75%, #808080 75%);
	background-size: 10px 10px;
	background-position: 0 0, 0 5px, 5px -5px, -5px 0px;
	border: 2px solid #FFF;
	border-radius: 4px;
	width: 18px;
	height: 18px;
	color: #fff;
	display: inline-block;
}

.hex-text-block {
	display: inline-block;
	background: white;
	border-radius: 2px;
	padding: 2px;
	border: 1px solid #e3e3e3;
	height: 16px;
	width: 54px;
	vertical-align: top;
	text-align: center;
}

.rgb-text-block {
	display: inline-block;
	background: white;
	border-radius: 2px;
	padding: 2px;
	margin: 0 1px;
	border: 1px solid #dcdcdc;
	height: 16px;
	width: 23px;
	vertical-align: top;
	text-align: center;
}

.rgb-text-div {
	right: 10%;
	display: inline-block;
	vertical-align: top;
	position: absolute;
}

.text-label {
	position: relative;
	top: -12px;
	font-family: sans-serif;
	font-size: small;
  color:#888;
}

.text {
	display: inline;
	font-family: sans-serif;
	margin: 0;
	display: inline-block;
	font-size: 12px;
	font-size-adjust: 0.50;
	position: relative;
	top: -1px;
  vertical-align: middle;
  -webkit-touch-callout: all;
    -webkit-user-select: all;
     -khtml-user-select: all;
       -moz-user-select: all;
        -ms-user-select: all;
            user-select: all;
}
</style>

<div class="main-container">

  <div class="colorsquare size">
      <div class="saturation-gradient">
          <div class="value-gradient">
              <div id="colorsquare-picker"></div>
              <div id="colorsquare-event" on:mousedown={csDown}></div>
          </div>
      </div>
  </div>

  <div class="hue-selector">
      <div id="hue-picker"></div>
      <div id="hue-event" on:mousedown={hueDown}></div>
  </div>

  <div class="alpha-selector">
      <div class="alpha-value"></div>
      <div id="alpha-picker"></div>
      <div id="alpha-event" on:mousedown={alphaDown}></div>
  </div>

  <div class="color-info-box">
    <div class="color-picked-bg">
      <div class="color-picked"></div>
    </div>

    <div class="hex-text-block">
      <p class="text">{hexValue}</p>
    </div>

    <div class="rgb-text-div">
      <div class="rgb-text-block">
        <p class="text">{r}</p>
        <p class="text-label">R</p>
      </div>

      <div class="rgb-text-block">
        <p class="text">{g}</p>
        <p class="text-label">G</p>
      </div>

      <div class="rgb-text-block">
        <p class="text">{b}</p>
        <p class="text-label">B</p>
      </div>
    </div>
  </div>

</div>
