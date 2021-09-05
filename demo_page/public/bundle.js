
(function(l, i, v, e) { v = l.createElement(i); v.async = 1; v.src = '//' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; e = l.getElementsByTagName(i)[0]; e.parentNode.insertBefore(v, e)})(document, 'script');
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_data(text, data) {
        data = '' + data;
        if (text.data !== data)
            text.data = data;
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function createEventDispatcher() {
        const component = current_component;
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment) {
            $$.update($$.dirty);
            run_all($$.before_update);
            $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.callbacks.push(() => {
                outroing.delete(block);
                if (callback) {
                    block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        if (component.$$.fragment) {
            run_all(component.$$.on_destroy);
            component.$$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            component.$$.on_destroy = component.$$.fragment = null;
            component.$$.ctx = {};
        }
    }
    function make_dirty(component, key) {
        if (!component.$$.dirty) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty = blank_object();
        }
        component.$$.dirty[key] = true;
    }
    function init(component, options, instance, create_fragment, not_equal$$1, prop_names) {
        const parent_component = current_component;
        set_current_component(component);
        const props = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props: prop_names,
            update: noop,
            not_equal: not_equal$$1,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, props, (key, value) => {
                if ($$.ctx && not_equal$$1($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
            })
            : props;
        $$.update();
        ready = true;
        run_all($$.before_update);
        $$.fragment = create_fragment($$.ctx);
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    /* node_modules\svelte-color-picker\src\HsvPicker.svelte generated by Svelte v3.6.4 */

    const file = "node_modules\\svelte-color-picker\\src\\HsvPicker.svelte";

    function create_fragment(ctx) {
    	var div20, div4, div3, div2, div0, t0, div1, t1, div7, div5, t2, div6, t3, div11, div8, t4, div9, t5, div10, t6, div19, div13, div12, t7, div14, p0, t8, t9, div18, div15, p1, t10, t11, p2, t13, div16, p3, t14, t15, p4, t17, div17, p5, t18, t19, p6, dispose;

    	return {
    		c: function create() {
    			div20 = element("div");
    			div4 = element("div");
    			div3 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div1 = element("div");
    			t1 = space();
    			div7 = element("div");
    			div5 = element("div");
    			t2 = space();
    			div6 = element("div");
    			t3 = space();
    			div11 = element("div");
    			div8 = element("div");
    			t4 = space();
    			div9 = element("div");
    			t5 = space();
    			div10 = element("div");
    			t6 = space();
    			div19 = element("div");
    			div13 = element("div");
    			div12 = element("div");
    			t7 = space();
    			div14 = element("div");
    			p0 = element("p");
    			t8 = text(ctx.hexValue);
    			t9 = space();
    			div18 = element("div");
    			div15 = element("div");
    			p1 = element("p");
    			t10 = text(ctx.r);
    			t11 = space();
    			p2 = element("p");
    			p2.textContent = "R";
    			t13 = space();
    			div16 = element("div");
    			p3 = element("p");
    			t14 = text(ctx.g);
    			t15 = space();
    			p4 = element("p");
    			p4.textContent = "G";
    			t17 = space();
    			div17 = element("div");
    			p5 = element("p");
    			t18 = text(ctx.b);
    			t19 = space();
    			p6 = element("p");
    			p6.textContent = "B";
    			attr(div0, "id", "colorsquare-picker");
    			attr(div0, "class", "svelte-8esefu");
    			add_location(div0, file, 602, 14, 15656);
    			attr(div1, "id", "colorsquare-event");
    			attr(div1, "class", "svelte-8esefu");
    			add_location(div1, file, 603, 14, 15706);
    			attr(div2, "class", "value-gradient svelte-8esefu");
    			add_location(div2, file, 601, 10, 15613);
    			attr(div3, "class", "saturation-gradient svelte-8esefu");
    			add_location(div3, file, 600, 6, 15569);
    			attr(div4, "class", "colorsquare size svelte-8esefu");
    			add_location(div4, file, 599, 2, 15532);
    			attr(div5, "id", "hue-picker");
    			attr(div5, "class", "svelte-8esefu");
    			add_location(div5, file, 609, 6, 15866);
    			attr(div6, "id", "hue-event");
    			attr(div6, "class", "svelte-8esefu");
    			add_location(div6, file, 610, 6, 15900);
    			attr(div7, "class", "hue-selector svelte-8esefu");
    			add_location(div7, file, 608, 2, 15833);
    			attr(div8, "class", "alpha-value svelte-8esefu");
    			add_location(div8, file, 614, 6, 16026);
    			attr(div9, "id", "alpha-picker");
    			attr(div9, "class", "svelte-8esefu");
    			add_location(div9, file, 615, 6, 16064);
    			attr(div10, "id", "alpha-event");
    			attr(div10, "class", "svelte-8esefu");
    			add_location(div10, file, 616, 6, 16100);
    			attr(div11, "class", "alpha-selector svelte-8esefu");
    			add_location(div11, file, 613, 2, 15991);
    			attr(div12, "class", "color-picked svelte-8esefu");
    			add_location(div12, file, 621, 6, 16266);
    			attr(div13, "class", "color-picked-bg svelte-8esefu");
    			add_location(div13, file, 620, 4, 16230);
    			attr(p0, "class", "text svelte-8esefu");
    			add_location(p0, file, 625, 6, 16350);
    			attr(div14, "class", "hex-text-block svelte-8esefu");
    			add_location(div14, file, 624, 4, 16315);
    			attr(p1, "class", "text svelte-8esefu");
    			add_location(p1, file, 630, 8, 16467);
    			attr(p2, "class", "text-label svelte-8esefu");
    			add_location(p2, file, 631, 8, 16499);
    			attr(div15, "class", "rgb-text-block svelte-8esefu");
    			add_location(div15, file, 629, 6, 16430);
    			attr(p3, "class", "text svelte-8esefu");
    			add_location(p3, file, 635, 8, 16584);
    			attr(p4, "class", "text-label svelte-8esefu");
    			add_location(p4, file, 636, 8, 16616);
    			attr(div16, "class", "rgb-text-block svelte-8esefu");
    			add_location(div16, file, 634, 6, 16547);
    			attr(p5, "class", "text svelte-8esefu");
    			add_location(p5, file, 640, 8, 16701);
    			attr(p6, "class", "text-label svelte-8esefu");
    			add_location(p6, file, 641, 8, 16733);
    			attr(div17, "class", "rgb-text-block svelte-8esefu");
    			add_location(div17, file, 639, 6, 16664);
    			attr(div18, "class", "rgb-text-div svelte-8esefu");
    			add_location(div18, file, 628, 4, 16397);
    			attr(div19, "class", "color-info-box svelte-8esefu");
    			add_location(div19, file, 619, 2, 16197);
    			attr(div20, "class", "main-container svelte-8esefu");
    			add_location(div20, file, 597, 0, 15500);

    			dispose = [
    				listen(div1, "mousedown", ctx.csDown),
    				listen(div1, "touchstart", ctx.csDownTouch),
    				listen(div6, "mousedown", ctx.hueDown),
    				listen(div6, "touchstart", ctx.hueDownTouch),
    				listen(div10, "mousedown", ctx.alphaDown),
    				listen(div10, "touchstart", ctx.alphaDownTouch)
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div20, anchor);
    			append(div20, div4);
    			append(div4, div3);
    			append(div3, div2);
    			append(div2, div0);
    			append(div2, t0);
    			append(div2, div1);
    			append(div20, t1);
    			append(div20, div7);
    			append(div7, div5);
    			append(div7, t2);
    			append(div7, div6);
    			append(div20, t3);
    			append(div20, div11);
    			append(div11, div8);
    			append(div11, t4);
    			append(div11, div9);
    			append(div11, t5);
    			append(div11, div10);
    			append(div20, t6);
    			append(div20, div19);
    			append(div19, div13);
    			append(div13, div12);
    			append(div19, t7);
    			append(div19, div14);
    			append(div14, p0);
    			append(p0, t8);
    			append(div19, t9);
    			append(div19, div18);
    			append(div18, div15);
    			append(div15, p1);
    			append(p1, t10);
    			append(div15, t11);
    			append(div15, p2);
    			append(div18, t13);
    			append(div18, div16);
    			append(div16, p3);
    			append(p3, t14);
    			append(div16, t15);
    			append(div16, p4);
    			append(div18, t17);
    			append(div18, div17);
    			append(div17, p5);
    			append(p5, t18);
    			append(div17, t19);
    			append(div17, p6);
    		},

    		p: function update(changed, ctx) {
    			if (changed.hexValue) {
    				set_data(t8, ctx.hexValue);
    			}

    			if (changed.r) {
    				set_data(t10, ctx.r);
    			}

    			if (changed.g) {
    				set_data(t14, ctx.g);
    			}

    			if (changed.b) {
    				set_data(t18, ctx.b);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div20);
    			}

    			run_all(dispose);
    		}
    	};
    }

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

    function instance($$self, $$props, $$invalidate) {
    	let { startColor ="#FF0000" } = $$props;

    onMount(() => {
     document.addEventListener("mouseup", mouseUp);
     document.addEventListener("touchend", mouseUp);
     document.addEventListener("mousemove", mouseMove);
     document.addEventListener("touchmove", touchMove);
     document.addEventListener("touchstart", killMouseEvents);
     document.addEventListener("mousedown", killTouchEvents);
     setStartColor();
    });

    Number.prototype.mod = function(n) {
        return ((this%n)+n)%n;
    };
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


    function setStartColor() {
      let hex = startColor.replace('#','');
      if (hex.length !== 6 && hex.length !== 3 && !hex.match(/([^A-F0-9])/gi)) {
        alert('Invalid property value (startColor)');
        return;
      }
      let hexFiltered='';
      if (hex.length === 3)
        hex.split('').forEach( c => {hexFiltered += c+c;});
      else
        hexFiltered=hex;
      $$invalidate('hexValue', hexValue = hexFiltered);
      $$invalidate('r', r = parseInt(hexFiltered.substring(0,2), 16));
      $$invalidate('g', g = parseInt(hexFiltered.substring(2,4), 16));
      $$invalidate('b', b = parseInt(hexFiltered.substring(4,6), 16));
      rgbToHSV(r,g,b,true);
      updateCsPicker();
      updateHuePicker();
    }

    function killMouseEvents() {
      document.querySelector("#alpha-event").removeEventListener("mousedown",alphaDown);
      document.querySelector("#colorsquare-event").removeEventListener("mousedown",csDown);
      document.querySelector("#hue-event").removeEventListener("mousedown",hueDown);
      document.removeEventListener("mouseup",mouseUp);
      document.removeEventListener("mousemove",mouseMove);
      document.removeEventListener("touchstart",killMouseEvents);
      document.removeEventListener("mousedown",killTouchEvents);
    }

    function killTouchEvents() {
      document.querySelector("#alpha-event").removeEventListener("touchstart",alphaDownTouch);
      document.querySelector("#colorsquare-event").removeEventListener("touchstart",csDownTouch);
      document.querySelector("#hue-event").removeEventListener("touchstart",hueDownTouch);
      document.removeEventListener("touchend",mouseUp);
      document.removeEventListener("touchmove",touchMove);
      document.removeEventListener("touchstart",killMouseEvents);
      document.removeEventListener("mousedown",killTouchEvents);
    }

    function updateCsPicker() {
      let csPicker = document.querySelector("#colorsquare-picker");
      let xPercentage = s * 100;
      let yPercentage = (1 - v) * 100;
      csPicker.style.top = yPercentage + "%";
      csPicker.style.left = xPercentage + "%";
    }

    function updateHuePicker() {
      let huePicker = document.querySelector("#hue-picker");
      let xPercentage = h * 100;
      huePicker.style.left = xPercentage + "%";
    }

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

    function touchMove(event) {
     if (tracked) {
      let mouseX = event.touches[0].clientX;
      let mouseY = event.touches[0].clientY;
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
     xPercentage = xPercentage.toFixed(2);
     let picker = document.querySelector("#colorsquare-picker");
     picker.style.top = yPercentage + "%";
     picker.style.left = xPercentage + "%";
     s = xPercentage / 100;
     v = 1 - yPercentage / 100;
     colorChange();
    }

    function csDownTouch(event) {
     tracked = event.currentTarget;
     let rect = event.target.getBoundingClientRect();
     let offsetX = event.targetTouches[0].clientX - rect.left;
     let offsetY = event.targetTouches[0].clientY - rect.top;
     let xPercentage = ((offsetX + 1) / 240) * 100;
     let yPercentage = ((offsetY + 1) / 160) * 100;
     yPercentage = yPercentage.toFixed(2);
     xPercentage = xPercentage.toFixed(2);
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

    function hueDownTouch(event) {
     tracked = event.currentTarget;
     let rect = event.target.getBoundingClientRect();
     let offsetX = event.targetTouches[0].clientX - rect.left;
     let xPercentage = ((offsetX - 9) / 220) * 100;
     xPercentage = xPercentage.toFixed(2);
     let picker = document.querySelector("#hue-picker");
     picker.style.left = xPercentage + "%";
     h = xPercentage / 100;
     hueChange();
    }

    function hueChange() {
     let rgb = hsvToRgb(h, 1, 1);
     let colorsquare = document.querySelector(".colorsquare");
     colorsquare.style.background = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},1)`;
     colorChange();
    }

    function colorChange() {
     let rgb = hsvToRgb(h, s, v);
     $$invalidate('r', r = rgb[0]);
     $$invalidate('g', g = rgb[1]);
     $$invalidate('b', b = rgb[2]);
     $$invalidate('hexValue', hexValue = RGBAToHex());
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

    function alphaDownTouch(event) {
     tracked = event.currentTarget;
     let rect = event.target.getBoundingClientRect();
     let offsetX = event.targetTouches[0].clientX - rect.left;
     let xPercentage = ((offsetX - 9) / 220) * 100;
     xPercentage = xPercentage.toFixed(2);
     let picker = document.querySelector("#alpha-picker");
     picker.style.left = xPercentage + "%";
     a = xPercentage / 100;
     colorChange();
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

    function rgbToHSV(r, g, b, update) {
        let rperc, gperc, bperc,max,min,diff,pr,hnew,snew,vnew;
        rperc = r / 255;
        gperc = g / 255;
        bperc = b / 255;
        max = Math.max(rperc, gperc, bperc);
        min = Math.min(rperc, gperc, bperc);
        diff = max - min;

        vnew = max;
        (vnew == 0) ? snew = 0 : snew = diff / max ;

        for (let i=0;i<3;i++) {
          if ([rperc,gperc,bperc][i] === max) {
            pr=i;
            break;
          }
        }
        if (diff==0) {
          hnew = 0;
          if (update) {
            h=hnew;
            s=snew;
            v=vnew;
            hueChange();
            return;
          }
          else {
            return {h:hnew,s:snew,v:vnew};
          }
        }
        else {
          switch (pr) {
            case 0:
              hnew=60*(((gperc-bperc)/diff)%6)/360;
              break;
            case 1:
              hnew=60*(((bperc-rperc)/diff)+2)/360;
              break;
            case 2:
              hnew=60*(((rperc-gperc)/diff)+4)/360;
              break;
          }
          if (hnew < 0) hnew+=6;
        }

        if (update) {
          h=hnew;
          s=snew;
          v=vnew;
          hueChange();
        }
        else {
          return {h:hnew,s:snew,v:vnew};
        }
    }

    	const writable_props = ['startColor'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<HsvPicker> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('startColor' in $$props) $$invalidate('startColor', startColor = $$props.startColor);
    	};

    	return {
    		startColor,
    		r,
    		g,
    		b,
    		hexValue,
    		csDown,
    		csDownTouch,
    		hueDown,
    		hueDownTouch,
    		alphaDown,
    		alphaDownTouch
    	};
    }

    class HsvPicker extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, ["startColor"]);
    	}

    	get startColor() {
    		throw new Error("<HsvPicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set startColor(value) {
    		throw new Error("<HsvPicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.6.4 */

    const file$1 = "src\\App.svelte";

    function create_fragment$1(ctx) {
    	var head, script, t0, div2, div0, h3, t2, p, t4, a, t6, div1, current;

    	var hsvpicker = new HsvPicker({
    		props: { startColor: "#82EAEA" },
    		$$inline: true
    	});
    	hsvpicker.$on("colorChange", colorCallback);

    	return {
    		c: function create() {
    			head = element("head");
    			script = element("script");
    			t0 = space();
    			div2 = element("div");
    			div0 = element("div");
    			h3 = element("h3");
    			h3.textContent = "Svelte Color Picker";
    			t2 = space();
    			p = element("p");
    			p.textContent = "A color picker component for svelte.";
    			t4 = space();
    			a = element("a");
    			a.textContent = "Star";
    			t6 = space();
    			div1 = element("div");
    			hsvpicker.$$.fragment.c();
    			script.async = true;
    			script.defer = true;
    			attr(script, "src", "https://buttons.github.io/buttons.js");
    			add_location(script, file$1, 23, 2, 697);
    			add_location(head, file$1, 22, 0, 687);
    			attr(h3, "class", "svelte-nm050s");
    			add_location(h3, file$1, 28, 4, 833);
    			attr(p, "class", "svelte-nm050s");
    			add_location(p, file$1, 29, 4, 867);
    			attr(a, "class", "github-button");
    			attr(a, "href", "https://github.com/qintarp/svelte-color-picker");
    			a.dataset.icon = "octicon-star";
    			a.dataset.size = "large";
    			a.dataset.showCount = "true";
    			attr(a, "aria-label", "Star qintarp/svelte-color-picker on GitHub");
    			add_location(a, file$1, 30, 4, 916);
    			attr(div0, "class", "container svelte-nm050s");
    			add_location(div0, file$1, 27, 2, 804);
    			attr(div1, "class", "container svelte-nm050s");
    			add_location(div1, file$1, 39, 2, 1187);
    			attr(div2, "class", "main svelte-nm050s");
    			add_location(div2, file$1, 26, 0, 782);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, head, anchor);
    			append(head, script);
    			insert(target, t0, anchor);
    			insert(target, div2, anchor);
    			append(div2, div0);
    			append(div0, h3);
    			append(div0, t2);
    			append(div0, p);
    			append(div0, t4);
    			append(div0, a);
    			append(div2, t6);
    			append(div2, div1);
    			mount_component(hsvpicker, div1, null);
    			current = true;
    		},

    		p: noop,

    		i: function intro(local) {
    			if (current) return;
    			transition_in(hsvpicker.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(hsvpicker.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(head);
    				detach(t0);
    				detach(div2);
    			}

    			destroy_component(hsvpicker, );
    		}
    	};
    }

    function colorCallback(rgba) {
      let r = rgba.detail.r;
      let g = rgba.detail.g;
      let b = rgba.detail.b;
      let a = rgba.detail.a;
      console.log(a);
      let bw = 255 - (r + g + b) / 4;

      let main = document.querySelector(".main");
      main.style.background = `rgba(${r},${g},${b},${a})`;
      let header = document.querySelector("h3");
      header.style.color = `rgb(${bw},${bw},${bw})`;
      let p = document.querySelector("p");
      p.style.color = `rgb(${bw},${bw},${bw})`;
      let body = document.querySelector("body");
      body.style.background = `rgb(${bw},${bw},${bw})`;
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$1, safe_not_equal, []);
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
