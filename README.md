# Svelte Color Picker [\[Demo Page\]](https://qintarp.github.io/svelte-color-picker)
 [![svelte-v3](https://img.shields.io/badge/svelte-v3-blueviolet.svg)](https://svelte.dev)
## Installation

With npm
```sh
$ cd yourSvelteProject
$ npm i svelte-color-picker
```

## Usage
In your component :
```jsx
<script>
import {HsvPicker} from 'svelte-color-picker';

function colorCallback(rgba) {
	console.log(rgba.detail)
}
</script>

<HsvPicker on:colorChange={colorCallback} startColor={"#FBFBFB"}/>
```


## Components

Svelte Color Picker currently has one type of colorpicker.

#### \</HsvPicker>
| Props | Value Type | Use |
| ------ | ------ | ------ |
| on:colorChange | function | Given function gets called every time color changes |
| startColor | string | Initializes color picker with the value (hexadecimal without alpha). |

License
----

MIT
