(function() {
  'use strict';

  var _ap = Array.prototype,
    _op = Object.prototype,
    _fp = Function.prototype,

    push = _ap.push,
    slice = _ap.slice,
    concat = _ap.concat,
    toString = _op.toString,
    hasOwn = _op.hasOwnProperty,

    isArray = Array.isArray,
    keys = Object.keys,

    //dom functions

    root = this;

  var browser = (function() {
    // body...
    var ret = Object.create(null),
      inBrowser = typeof window !== 'undefined' && toString.call(window) !== '[object Object]';

    if (inBrowser) {
      ret.version = ''
      ret.vendor = ''
    } else {
      ret.version = ''
      ret.vendor = 'node'
    }

    // os: windows | linux | mac | Android | iOS | WP ...
    ret.os = ''

    return ret
  })()

  function _extend(source, obj) {
    for (var prop in source) {
      obj[prop] = source[prop]
    }
    return obj
  }

  // backbone extend
  function extend(protoProps) {
    var parent = this
    var child;

    // The constructor function for the new subclass is either defined by you
    // (the "constructor" property in your `extend` definition), or defaulted
    // by us to simply call the parent's constructor.
    if (protoProps && _.has(protoProps, 'constructor')) {
      child = protoProps.constructor;
    } else {
      child = function() {
        return parent.apply(this, arguments);
      };
    }

    // Add static properties to the constructor function, if supplied.
    _extend(parent, child);

    // Set the prototype chain to inherit from `parent`, without calling
    // `parent`'s constructor function.
    var Surrogate = function() {
      this.constructor = child;
    };
    Surrogate.prototype = parent.prototype;
    child.prototype = new Surrogate;

    // Add prototype properties (instance properties) to the subclass,
    // if supplied.
    if (protoProps) _extend(protoProps, child.prototype);

    // Set a convenience property in case the parent's prototype is needed
    // later.
    child.__super__ = parent.prototype;

    return child;
  }

  var Event = {
    on: function(name, cb, ctx) {
      this.events || (this.events = {});
      (this.events[name] || (this.events[name] = [])).push({
        cb: cb,
        ctx: ctx
      })
      return this
    },
    off: function(name, fn, ctx) {
      if (!this.events) {
        return this
      }
      if (!arguments.length) {
        this.events = void 0
        return this
      }
      var events = this.events[name]
      if (!events) {
      	return this
      }
      if (arguments.length === 1){
      	delete this.events[name]
      	return this
      }
      var cb
      for (var i =0; i < events.length; i ++) {
      	cb = events[i]
      	if (cb.cb === fn && cb.ctx === ctx) {
      		events.splice(i, 1)
      		break
      	}
      }
      return this
    },
    fire: function(name, a, b, c) {
      if (!this.events) return this;
      var events = this.events[name],
        args = slice.call(arguments, 1);
      if (events) {
      	var event
      	for (var i = 0; i < events.length; i ++) {
      		event = events[i]
      		events.cb.call(event.ctx, a, b, c)
      	}
      }
      return this
    }
  }

  /**
   *	Button
   *
   *
   */
  var Button = function(argument) {
    // basic attributes
    this.name = ''
    this.title = ''
    this.icon = ''
    this.tag = ''
    this.command = ''
    this.status = ''
    // typ:
    // basic: no menu, just call execCommand
    // custom: no menu, custon function to deal
    // menu: menu show up
    this.typ = 'basic'

    // when this button is active, the exclue buttons should be disabled
    this.exclueButtons = []
    // on init, set the $button element
    this.$el = null
    this.$exclueButtons = []
  }

  Button.prototype = {
    render: function() {
      // render button
    },
    onclick: function() {

    },
    exec: function() {

    },
    // render the button, 
    // bind events
    init: function() {

    }
  }

  // button's menu
  var Menu = function() {

  }
  Menu.prototype = {
    show: function(argument) {
      // body...
    },
    hide: function() {

    }
  }

  // popover
  var PopOver = function() {

  }

  /**
   *	JustEditor
   *
   *
   */
  var JustEditor = function(selector, options) {
    this.$buttons = []
    this.$body = typeof selector === 'String' ? document.getElementById(selector) : selector

    // the cursor point element
    this.$currentEl = null
  }

  JustEditor.prototype = {
    init: function() {

    }
  }

  function justeditor(selector, options) {
    var editor = new JustEditor(selector, options)
    editor.init()
  }

  this.justeditor = justeditor
}).call(this);
