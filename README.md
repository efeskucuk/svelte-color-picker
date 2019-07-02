# Svelte Color Picker
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

<HsvPicker on:colorChange={colorCallback}/>
```


## Components

Svelte Color Picker currently has one type of colorpicker.

#### </HsvPicker>
| Props | Value Type | Use |
| ------ | ------ | ------ |
| on:colorChange | function | Function gets called every time color changes |

License
----

MIT
