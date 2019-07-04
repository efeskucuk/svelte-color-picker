<head>
<script async defer src="https://buttons.github.io/buttons.js"></script>
</head>

<script>
	import {HsvPicker} from 'svelte-color-picker';


	function colorCallback(rgb) {
		let r = rgb.detail.r;
		let g = rgb.detail.g;
		let b = rgb.detail.b;
		let bw = 255 - ((r + g + b) / 4);

		let main = document.querySelector(".main");
		main.style.background = `rgb(${r},${g},${b})`;
		let header = document.querySelector("h3");
		header.style.color = `rgb(${bw},${bw},${bw})`;
		let p = document.querySelector("p");
		p.style.color = `rgb(${bw},${bw},${bw})`;
		let body = document.querySelector("body");
		body.style.background = `rgb(${bw},${bw},${bw})`;
	}
</script>

<style>

	h3 {
		padding:0;
		margin:0;
		font-family: sans-serif;
	}

	p {
		margin:10px 5px;
	}

	.main {
		border-radius:20px;
		width:600px;
		padding:20px;
		margin:0 auto;
	}
	.container{
		display:inline-block;
		vertical-align: top;
	}

</style>

<div class="main">
	<div class="container">
		<h3>Svelte Color Picker</h3>
		<p>A color picker component for svelte.</p>
		<a class="github-button" href="https://github.com/qintarp/svelte-color-picker" data-icon="octicon-star" data-size="large" data-show-count="true" aria-label="Star qintarp/svelte-color-picker on GitHub">Star</a>
	</div>
	<div class="container">
		<HsvPicker on:colorChange={colorCallback} startColor={"#82EAEA"}/>
	</div>
</div>
