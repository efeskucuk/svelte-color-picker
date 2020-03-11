
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
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
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

    function noop$1() { }
    function add_location$1(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run$1(fn) {
        return fn();
    }
    function blank_object$1() {
        return Object.create(null);
    }
    function run_all$1(fns) {
        fns.forEach(run$1);
    }
    function is_function$1(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal$1(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    function append$1(target, node) {
        target.appendChild(node);
    }
    function insert$1(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach$1(node) {
        node.parentNode.removeChild(node);
    }
    function element$1(name) {
        return document.createElement(name);
    }
    function text$1(data) {
        return document.createTextNode(data);
    }
    function space$1() {
        return text$1(' ');
    }
    function empty() {
        return text$1('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr$1(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? undefined : +value;
    }
    function children$1(element) {
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

    let current_component$1;
    function set_current_component$1(component) {
        current_component$1 = component;
    }
    function get_current_component() {
        if (!current_component$1)
            throw new Error(`Function called outside component initialization`);
        return current_component$1;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function createEventDispatcher() {
        const component = current_component$1;
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

    const dirty_components$1 = [];
    const resolved_promise$1 = Promise.resolve();
    let update_scheduled$1 = false;
    const binding_callbacks$1 = [];
    const render_callbacks$1 = [];
    const flush_callbacks$1 = [];
    function schedule_update$1() {
        if (!update_scheduled$1) {
            update_scheduled$1 = true;
            resolved_promise$1.then(flush$1);
        }
    }
    function add_render_callback$1(fn) {
        render_callbacks$1.push(fn);
    }
    function flush$1() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components$1.length) {
                const component = dirty_components$1.shift();
                set_current_component$1(component);
                update$1(component.$$);
            }
            while (binding_callbacks$1.length)
                binding_callbacks$1.shift()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            while (render_callbacks$1.length) {
                const callback = render_callbacks$1.pop();
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
        } while (dirty_components$1.length);
        while (flush_callbacks$1.length) {
            flush_callbacks$1.pop()();
        }
        update_scheduled$1 = false;
    }
    function update$1($$) {
        if ($$.fragment) {
            $$.update($$.dirty);
            run_all$1($$.before_render);
            $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
            $$.after_render.forEach(add_render_callback$1);
        }
    }
    function mount_component$1(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_render } = component.$$;
        fragment.m(target, anchor);
        // onMount happens after the initial afterUpdate. Because
        // afterUpdate callbacks happen in reverse order (inner first)
        // we schedule onMount callbacks before afterUpdate callbacks
        add_render_callback$1(() => {
            const new_on_destroy = on_mount.map(run$1).filter(is_function$1);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all$1(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_render.forEach(add_render_callback$1);
    }
    function destroy(component, detaching) {
        if (component.$$) {
            run_all$1(component.$$.on_destroy);
            component.$$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            component.$$.on_destroy = component.$$.fragment = null;
            component.$$.ctx = {};
        }
    }
    function make_dirty$1(component, key) {
        if (!component.$$.dirty) {
            dirty_components$1.push(component);
            schedule_update$1();
            component.$$.dirty = blank_object$1();
        }
        component.$$.dirty[key] = true;
    }
    function init$1(component, options, instance, create_fragment, not_equal$$1, prop_names) {
        const parent_component = current_component$1;
        set_current_component$1(component);
        const props = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props: prop_names,
            update: noop$1,
            not_equal: not_equal$$1,
            bound: blank_object$1(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_render: [],
            after_render: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object$1(),
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, props, (key, value) => {
                if ($$.ctx && not_equal$$1($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty$1(component, key);
                }
            })
            : props;
        $$.update();
        ready = true;
        run_all$1($$.before_render);
        $$.fragment = create_fragment($$.ctx);
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.l(children$1(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.c();
            }
            if (options.intro && component.$$.fragment.i)
                component.$$.fragment.i();
            mount_component$1(component, options.target, options.anchor);
            flush$1();
        }
        set_current_component$1(parent_component);
    }
    class SvelteComponent$1 {
        $destroy() {
            destroy(this, true);
            this.$destroy = noop$1;
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
    class SvelteComponentDev$1 extends SvelteComponent$1 {
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

    /* Users/user/Projects/svelte-color-picker/src/HsvPicker.svelte generated by Svelte v3.6.4 */

    const file = "Users/user/Projects/svelte-color-picker/src/HsvPicker.svelte";

    // (788:0) {#if warnMessage}
    function create_if_block(ctx) {
    	var div, t;

    	return {
    		c: function create() {
    			div = element$1("div");
    			t = text$1(ctx.warnMessage);
    			attr$1(div, "class", "warning svelte-15rwxoo");
    			add_location$1(div, file, 788, 2, 20878);
    		},

    		m: function mount(target, anchor) {
    			insert$1(target, div, anchor);
    			append$1(div, t);
    		},

    		p: function update(changed, ctx) {
    			if (changed.warnMessage) {
    				set_data(t, ctx.warnMessage);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach$1(div);
    			}
    		}
    	};
    }

    function create_fragment(ctx) {
    	var div20, div4, div3, div2, div0, t0, div1, t1, div7, div5, t2, div6, t3, div11, div8, t4, div9, t5, div10, t6, div19, div13, div12, t7, div14, input0, t8, div18, div15, input1, t9, p0, t11, div16, input2, t12, p1, t14, div17, input3, t15, p2, t17, if_block_anchor, dispose;

    	var if_block = (ctx.warnMessage) && create_if_block(ctx);

    	return {
    		c: function create() {
    			div20 = element$1("div");
    			div4 = element$1("div");
    			div3 = element$1("div");
    			div2 = element$1("div");
    			div0 = element$1("div");
    			t0 = space$1();
    			div1 = element$1("div");
    			t1 = space$1();
    			div7 = element$1("div");
    			div5 = element$1("div");
    			t2 = space$1();
    			div6 = element$1("div");
    			t3 = space$1();
    			div11 = element$1("div");
    			div8 = element$1("div");
    			t4 = space$1();
    			div9 = element$1("div");
    			t5 = space$1();
    			div10 = element$1("div");
    			t6 = space$1();
    			div19 = element$1("div");
    			div13 = element$1("div");
    			div12 = element$1("div");
    			t7 = space$1();
    			div14 = element$1("div");
    			input0 = element$1("input");
    			t8 = space$1();
    			div18 = element$1("div");
    			div15 = element$1("div");
    			input1 = element$1("input");
    			t9 = space$1();
    			p0 = element$1("p");
    			p0.textContent = "R";
    			t11 = space$1();
    			div16 = element$1("div");
    			input2 = element$1("input");
    			t12 = space$1();
    			p1 = element$1("p");
    			p1.textContent = "G";
    			t14 = space$1();
    			div17 = element$1("div");
    			input3 = element$1("input");
    			t15 = space$1();
    			p2 = element$1("p");
    			p2.textContent = "B";
    			t17 = space$1();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			attr$1(div0, "id", "colorsquare-picker");
    			attr$1(div0, "class", "svelte-15rwxoo");
    			add_location$1(div0, file, 717, 8, 19252);
    			attr$1(div1, "id", "colorsquare-event");
    			attr$1(div1, "class", "svelte-15rwxoo");
    			add_location$1(div1, file, 718, 8, 19292);
    			attr$1(div2, "class", "value-gradient svelte-15rwxoo");
    			add_location$1(div2, file, 716, 6, 19215);
    			attr$1(div3, "class", "saturation-gradient svelte-15rwxoo");
    			add_location$1(div3, file, 715, 4, 19175);
    			attr$1(div4, "class", "colorsquare size svelte-15rwxoo");
    			add_location$1(div4, file, 714, 2, 19140);
    			attr$1(div5, "id", "hue-picker");
    			attr$1(div5, "class", "svelte-15rwxoo");
    			add_location$1(div5, file, 727, 4, 19470);
    			attr$1(div6, "id", "hue-event");
    			attr$1(div6, "class", "svelte-15rwxoo");
    			add_location$1(div6, file, 728, 4, 19498);
    			attr$1(div7, "class", "hue-selector svelte-15rwxoo");
    			add_location$1(div7, file, 726, 2, 19439);
    			attr$1(div8, "class", "alpha-value svelte-15rwxoo");
    			add_location$1(div8, file, 732, 4, 19618);
    			attr$1(div9, "id", "alpha-picker");
    			attr$1(div9, "class", "svelte-15rwxoo");
    			add_location$1(div9, file, 733, 4, 19650);
    			attr$1(div10, "id", "alpha-event");
    			attr$1(div10, "class", "svelte-15rwxoo");
    			add_location$1(div10, file, 734, 4, 19680);
    			attr$1(div11, "class", "alpha-selector svelte-15rwxoo");
    			add_location$1(div11, file, 731, 2, 19585);
    			attr$1(div12, "class", "color-picked svelte-15rwxoo");
    			add_location$1(div12, file, 741, 6, 19859);
    			attr$1(div13, "class", "color-picked-bg svelte-15rwxoo");
    			add_location$1(div13, file, 740, 4, 19823);
    			attr$1(input0, "class", "text svelte-15rwxoo");
    			input0.value = ctx.hexValue;
    			attr$1(input0, "maxlength", "7");
    			add_location$1(input0, file, 744, 6, 19938);
    			attr$1(div14, "class", "hex-text-block svelte-15rwxoo");
    			add_location$1(div14, file, 743, 4, 19903);
    			attr$1(input1, "type", "number");
    			attr$1(input1, "min", "0");
    			attr$1(input1, "max", "255");
    			attr$1(input1, "step", "1");
    			attr$1(input1, "class", "svelte-15rwxoo");
    			add_location$1(input1, file, 753, 8, 20155);
    			attr$1(p0, "class", "text-label svelte-15rwxoo");
    			add_location$1(p0, file, 760, 8, 20310);
    			attr$1(div15, "class", "rgb-text-block svelte-15rwxoo");
    			add_location$1(div15, file, 752, 6, 20118);
    			attr$1(input2, "type", "number");
    			attr$1(input2, "min", "0");
    			attr$1(input2, "max", "255");
    			attr$1(input2, "step", "1");
    			attr$1(input2, "class", "svelte-15rwxoo");
    			add_location$1(input2, file, 764, 8, 20395);
    			attr$1(p1, "class", "text-label svelte-15rwxoo");
    			add_location$1(p1, file, 771, 8, 20550);
    			attr$1(div16, "class", "rgb-text-block svelte-15rwxoo");
    			add_location$1(div16, file, 763, 6, 20358);
    			attr$1(input3, "type", "number");
    			attr$1(input3, "min", "0");
    			attr$1(input3, "max", "255");
    			attr$1(input3, "step", "1");
    			attr$1(input3, "class", "svelte-15rwxoo");
    			add_location$1(input3, file, 775, 8, 20635);
    			attr$1(p2, "class", "text-label svelte-15rwxoo");
    			add_location$1(p2, file, 782, 8, 20790);
    			attr$1(div17, "class", "rgb-text-block svelte-15rwxoo");
    			add_location$1(div17, file, 774, 6, 20598);
    			attr$1(div18, "class", "rgb-text-div svelte-15rwxoo");
    			add_location$1(div18, file, 751, 4, 20085);
    			attr$1(div19, "class", "color-info-box svelte-15rwxoo");
    			add_location$1(div19, file, 739, 2, 19790);
    			attr$1(div20, "class", "main-container svelte-15rwxoo");
    			add_location$1(div20, file, 712, 0, 19108);

    			dispose = [
    				listen(div1, "mousedown", ctx.csDown),
    				listen(div1, "touchstart", ctx.csDownTouch),
    				listen(div6, "mousedown", ctx.hueDown),
    				listen(div6, "touchstart", ctx.hueDownTouch),
    				listen(div10, "mousedown", ctx.alphaDown),
    				listen(div10, "touchstart", ctx.alphaDownTouch),
    				listen(input0, "change", ctx.change_handler),
    				listen(input1, "input", ctx.input1_input_handler),
    				listen(input1, "input", ctx.updateRgb),
    				listen(input2, "input", ctx.input2_input_handler),
    				listen(input2, "input", ctx.updateRgb),
    				listen(input3, "input", ctx.input3_input_handler),
    				listen(input3, "input", ctx.updateRgb)
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert$1(target, div20, anchor);
    			append$1(div20, div4);
    			append$1(div4, div3);
    			append$1(div3, div2);
    			append$1(div2, div0);
    			append$1(div2, t0);
    			append$1(div2, div1);
    			append$1(div20, t1);
    			append$1(div20, div7);
    			append$1(div7, div5);
    			append$1(div7, t2);
    			append$1(div7, div6);
    			append$1(div20, t3);
    			append$1(div20, div11);
    			append$1(div11, div8);
    			append$1(div11, t4);
    			append$1(div11, div9);
    			append$1(div11, t5);
    			append$1(div11, div10);
    			append$1(div20, t6);
    			append$1(div20, div19);
    			append$1(div19, div13);
    			append$1(div13, div12);
    			append$1(div19, t7);
    			append$1(div19, div14);
    			append$1(div14, input0);
    			append$1(div19, t8);
    			append$1(div19, div18);
    			append$1(div18, div15);
    			append$1(div15, input1);

    			input1.value = ctx.r;

    			append$1(div15, t9);
    			append$1(div15, p0);
    			append$1(div18, t11);
    			append$1(div18, div16);
    			append$1(div16, input2);

    			input2.value = ctx.g;

    			append$1(div16, t12);
    			append$1(div16, p1);
    			append$1(div18, t14);
    			append$1(div18, div17);
    			append$1(div17, input3);

    			input3.value = ctx.b;

    			append$1(div17, t15);
    			append$1(div17, p2);
    			insert$1(target, t17, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert$1(target, if_block_anchor, anchor);
    		},

    		p: function update(changed, ctx) {
    			if (changed.hexValue) {
    				input0.value = ctx.hexValue;
    			}

    			if (changed.r) input1.value = ctx.r;
    			if (changed.g) input2.value = ctx.g;
    			if (changed.b) input3.value = ctx.b;

    			if (ctx.warnMessage) {
    				if (if_block) {
    					if_block.p(changed, ctx);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},

    		i: noop$1,
    		o: noop$1,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach$1(div20);
    				detach$1(t17);
    			}

    			if (if_block) if_block.d(detaching);

    			if (detaching) {
    				detach$1(if_block_anchor);
    			}

    			run_all$1(dispose);
    		}
    	};
    }

    function removeEventListenerFromElement(
      elementId,
      eventName,
      listenerCallback
    ) {
      let element = document.querySelector(elementId);
      if (element) element.removeEventListener(eventName, listenerCallback);
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
          (r = v), (g = t), (b = p);
          break;
        case 1:
          (r = q), (g = v), (b = p);
          break;
        case 2:
          (r = p), (g = v), (b = t);
          break;
        case 3:
          (r = p), (g = q), (b = v);
          break;
        case 4:
          (r = t), (g = p), (b = v);
          break;
        case 5:
          (r = v), (g = p), (b = q);
          break;
      }

      return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    }

    function instance($$self, $$props, $$invalidate) {
    	let { startColor = "#FF0000" } = $$props;

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
        return ((this % n) + n) % n;
      };
      const dispatch = createEventDispatcher();
      let tracked;
      let warnMessage = null;
      let h = 1;
      let s = 1;
      let v = 1;
      let a = 1;
      let r = 255;
      let g = 0;
      let b = 0;
      let hexValue = "#FF0000";

      function hexToRgb(_hex) {
        let r, g, b;
        let hex = _hex.replace("#", "");
        let hexFiltered = "";
        if (hex.length === 3)
          hex.split("").forEach(c => {
            hexFiltered += c + c;
          });
        else hexFiltered = hex;
        $$invalidate('hexValue', hexValue = hexFiltered);
        r = parseInt(hexFiltered.substring(0, 2), 16);
        g = parseInt(hexFiltered.substring(2, 4), 16);
        b = parseInt(hexFiltered.substring(4, 6), 16);
        return {
          r,
          g,
          b
        };
      }

      function setStartColor() {
        updateHex(startColor, true);
      }

      function killMouseEvents() {
        removeEventListenerFromElement("#alpha-event", "mousedown", alphaDown);
        removeEventListenerFromElement("#colorsquare-event", "mousedown", csDown);
        removeEventListenerFromElement("#hue-event", "mousedown", hueDown);
        document.removeEventListener("mouseup", mouseUp);
        document.removeEventListener("mousemove", mouseMove);
        document.removeEventListener("touchstart", killMouseEvents);
        document.removeEventListener("mousedown", killTouchEvents);
      }

      function killTouchEvents() {
        removeEventListenerFromElement(
          "#alpha-event",
          "touchstart",
          alphaDownTouch
        );
        removeEventListenerFromElement(
          "#colorsquare-event",
          "touchstart",
          csDownTouch
        );
        removeEventListenerFromElement("#hue-event", "touchstart", hueDownTouch);
        document.removeEventListener("touchend", mouseUp);
        document.removeEventListener("touchmove", touchMove);
        document.removeEventListener("touchstart", killMouseEvents);
        document.removeEventListener("mousedown", killTouchEvents);
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
        dispatch("colorChange", {
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
              xPercentage = ((mouseX - trackedPos.x) / 240) * 100;
              yPercentage = ((mouseY - trackedPos.y) / 160) * 100;
              xPercentage > 100
                ? (xPercentage = 100)
                : xPercentage < 0
                ? (xPercentage = 0)
                : null;
              yPercentage > 100
                ? (yPercentage = 100)
                : yPercentage < 0
                ? (yPercentage = 0)
                : null;
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
              xPercentage = ((mouseX - 10 - trackedPos.x) / 220) * 100;
              xPercentage > 100
                ? (xPercentage = 100)
                : xPercentage < 0
                ? (xPercentage = 0)
                : null;
              xPercentage = xPercentage.toFixed(2);
              picker = document.querySelector("#hue-picker");
              picker.style.left = xPercentage + "%";
              h = xPercentage / 100;
              hueChange();
              break;
            case "alpha-event":
              xPercentage = ((mouseX - 10 - trackedPos.x) / 220) * 100;
              xPercentage > 100
                ? (xPercentage = 100)
                : xPercentage < 0
                ? (xPercentage = 0)
                : null;
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
              xPercentage = ((mouseX - trackedPos.x) / 240) * 100;
              yPercentage = ((mouseY - trackedPos.y) / 160) * 100;
              xPercentage > 100
                ? (xPercentage = 100)
                : xPercentage < 0
                ? (xPercentage = 0)
                : null;
              yPercentage > 100
                ? (yPercentage = 100)
                : yPercentage < 0
                ? (yPercentage = 0)
                : null;
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
              xPercentage = ((mouseX - 10 - trackedPos.x) / 220) * 100;
              xPercentage > 100
                ? (xPercentage = 100)
                : xPercentage < 0
                ? (xPercentage = 0)
                : null;
              xPercentage = xPercentage.toFixed(2);
              picker = document.querySelector("#hue-picker");
              picker.style.left = xPercentage + "%";
              h = xPercentage / 100;
              hueChange();
              break;
            case "alpha-event":
              xPercentage = ((mouseX - 10 - trackedPos.x) / 220) * 100;
              xPercentage > 100
                ? (xPercentage = 100)
                : xPercentage < 0
                ? (xPercentage = 0)
                : null;
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

      function updateRgb() {
        const rgbValid =
          typeof r === "number" && typeof g === "number" && typeof b === "number";
        if (rgbValid) {
          rgbToHSV(r, g, b, true);
          colorChange();
        }
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

        if (rHex.length == 1) rHex = "0" + rHex;
        if (gHex.length == 1) gHex = "0" + gHex;
        if (bHex.length == 1) bHex = "0" + bHex;

        return ("#" + rHex + gHex + bHex).toUpperCase();
      }

      function rgbToHSV(r, g, b, update) {
        let rperc, gperc, bperc, max, min, diff, pr, hnew, snew, vnew;
        rperc = r / 255;
        gperc = g / 255;
        bperc = b / 255;
        max = Math.max(rperc, gperc, bperc);
        min = Math.min(rperc, gperc, bperc);
        diff = max - min;

        vnew = max;
        vnew == 0 ? (snew = 0) : (snew = diff / max);

        for (let i = 0; i < 3; i++) {
          if ([rperc, gperc, bperc][i] === max) {
            pr = i;
            break;
          }
        }
        if (diff == 0) {
          hnew = 0;
          if (update) {
            h = hnew;
            s = snew;
            v = vnew;
            hueChange();
            return;
          } else {
            return { h: hnew, s: snew, v: vnew };
          }
        } else {
          switch (pr) {
            case 0:
              hnew = (60 * (((gperc - bperc) / diff) % 6)) / 360;
              break;
            case 1:
              hnew = (60 * ((bperc - rperc) / diff + 2)) / 360;
              break;
            case 2:
              hnew = (60 * ((rperc - gperc) / diff + 4)) / 360;
              break;
          }
          if (hnew < 0) hnew += 6;
        }

        if (update) {
          h = hnew;
          s = snew;
          v = vnew;
          hueChange();
        } else {
          return { h: hnew, s: snew, v: vnew };
        }
      }

      function updateHex(hexStr, isInitialCall = false) {
        let normalisedHex = hexStr;
        normalisedHex = normalisedHex.replace("#", "").toUpperCase();
        const isValidHex =
          (normalisedHex.length === 6 || normalisedHex.length === 3) &&
          !normalisedHex.match(/([^A-F0-9])/gi);

        if (isValidHex) {
          $$invalidate('hexValue', hexValue = "#" + normalisedHex);
          $$invalidate('warnMessage', warnMessage = null);
          const rgb = hexToRgb(hexStr);
          $$invalidate('r', r = rgb.r);
          $$invalidate('g', g = rgb.g);
          $$invalidate('b', b = rgb.b);
          rgbToHSV(r, g, b, true);
          updateCsPicker();
          updateHuePicker();
        } else {
          if (isInitialCall) {
            $$invalidate('warnMessage', warnMessage = `That hex code doesn't look right`); // TODO: i18n
            // TODO: Error: 'globals' is not exported by ../node_modules/svelte/internal/index.mjs
            // throw new Error(
            //   `Invalid prop [startColor=${hexStr}] - Expected a hex value`
            // );
          } else {
            $$invalidate('warnMessage', warnMessage = `That hex code doesn't look right`); // TODO: i18n
          }
        }
      }

    	const writable_props = ['startColor'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<HsvPicker> was created with unknown prop '${key}'`);
    	});

    	function change_handler(ev) {
    		return updateHex(ev.target.value);
    	}

    	function input1_input_handler() {
    		r = to_number(this.value);
    		$$invalidate('r', r);
    	}

    	function input2_input_handler() {
    		g = to_number(this.value);
    		$$invalidate('g', g);
    	}

    	function input3_input_handler() {
    		b = to_number(this.value);
    		$$invalidate('b', b);
    	}

    	$$self.$set = $$props => {
    		if ('startColor' in $$props) $$invalidate('startColor', startColor = $$props.startColor);
    	};

    	return {
    		startColor,
    		warnMessage,
    		r,
    		g,
    		b,
    		hexValue,
    		csDown,
    		csDownTouch,
    		hueDown,
    		hueDownTouch,
    		updateRgb,
    		alphaDown,
    		alphaDownTouch,
    		updateHex,
    		change_handler,
    		input1_input_handler,
    		input2_input_handler,
    		input3_input_handler
    	};
    }

    class HsvPicker extends SvelteComponentDev$1 {
    	constructor(options) {
    		super(options);
    		init$1(this, options, instance, create_fragment, safe_not_equal$1, ["startColor"]);
    	}

    	get startColor() {
    		throw new Error("<HsvPicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set startColor(value) {
    		throw new Error("<HsvPicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.6.4 */

    const file$1 = "src/App.svelte";

    function create_fragment$1(ctx) {
    	var head, script, t0, div2, div0, h3, t2, p, t4, a, t6, div1, current;

    	var hsvpicker = new HsvPicker({
    		props: { startColor: '#82EAEA' },
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
    			add_location(script, file$1, 44, 2, 907);
    			add_location(head, file$1, 43, 0, 898);
    			attr(h3, "class", "svelte-1oudbgl");
    			add_location(h3, file$1, 50, 4, 1041);
    			attr(p, "class", "svelte-1oudbgl");
    			add_location(p, file$1, 51, 4, 1074);
    			attr(a, "class", "github-button");
    			attr(a, "href", "https://github.com/qintarp/svelte-color-picker");
    			a.dataset.icon = "octicon-star";
    			a.dataset.size = "large";
    			a.dataset.showCount = "true";
    			attr(a, "aria-label", "Star qintarp/svelte-color-picker on GitHub");
    			add_location(a, file$1, 52, 4, 1122);
    			attr(div0, "class", "container svelte-1oudbgl");
    			add_location(div0, file$1, 49, 2, 1013);
    			attr(div1, "class", "container svelte-1oudbgl");
    			add_location(div1, file$1, 62, 2, 1391);
    			attr(div2, "class", "main svelte-1oudbgl");
    			add_location(div2, file$1, 48, 0, 992);
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

    function colorCallback(rgb) {
      let r = rgb.detail.r;
      let g = rgb.detail.g;
      let b = rgb.detail.b;
      let bw = 255 - (r + g + b) / 4;

      let main = document.querySelector(".main");
      main.style.background = `rgb(${r},${g},${b})`;
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
