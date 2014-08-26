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

    buttons = {},
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

  buttons.register = function(btn) {
    if (!btn || !btn.prototype.name) {
        console.log("Warning: btn is null or btn.prototype.name is null", btn)
        return;
    }
    if (!buttons[btn.prototype.name]) {
        buttons[btn.prototype.name] = btn
        console.log("register "+btn.prototype.name+" :", btn)
    }
  }

  function _extend(source, obj) {
    for (var prop in source) {
      if(!obj[prop]) {
          obj[prop] = source[prop]
      }
    }
    return obj
  }

  // backbone extend
  function extend(child, props) {
    var parent = this

    // Add static properties to the constructor function, if supplied.
    _extend(parent, child);

    // Set the prototype chain to inherit from `parent`, without calling
    // `parent`'s constructor function.
    var Surrogate = function() {
      this.constructor = child;
    };
    Surrogate.prototype = parent.prototype;
    child.prototype = new Surrogate;

    if (props) {
        _extend(props, child.prototype)
    }

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
    var arg = argument || {}
    var btn = function() {
        this.status = arg.status || ''
        // on init, set the $button element
        this.$el = null
        this.$exclueButtons = []
    }
    return btn
  }

  Button.prototype = {
    init: function() {
      var $li = document.createElement('li')
      if (typeof this.command === 'string') {
         $li.setAttribute('data-cmd', this.command)
      }
      if (this.tag) {
         $li.setAttribute('data-tag', this.tag)
      }
      $li.addEventListener('click', this.onclick)
      // render button
      $li.innerHTML = '<a tabindex="-1" unselectable="on" class="toolbar-item toolbar-item-' +
        this.name + '" class="active: false" href="javascript:;" title="' +
        this.title +
        '"><span class="' +
        this.icon +
        '"></span></a>' +
        (typeof this.menu === 'string' ? this.menu :
            (this.menu ? (typeof this.menu.render === 'Function' ? this.menu.render() : '') : '')
            )
      this.$li = $li
    },
    onclick: function() {

    },
    exec: function() {

    }
  }

  Button.extend = function(fn, props) {
      var btn = extend.call(this, fn, props)
      console.log(btn, btn.prototype.name, btn.name)
      buttons.register(btn)
  }

  var TitleButton = Button.extend(Button(), {
    name: 'title',
    title: '标题文字',
    icon: 'fa fa-text',
    tag: 'title',
    command: '',
    status: '',
    typ: 'basic',
    exclueButtons: []
  })
    // bold button
    var BoldButton = Button.extend(Button(), {
        name: 'bold',
        icon: 'fa fa-bold',
        title: '加粗文字 ( Ctrl + b )',
        tag: 'b',
        command: 'bold',
        excludeButtons: []
    })
    // italic button
    var ItalicButton = Button.extend(Button(), {
        name: 'italic',
        icon: 'fa fa-italic',
        title: '斜体文字 ( Ctrl + i )',
        tagName: 'i',
        command: 'italic',
        menu: false,
        excludeButtons: []
    })
    // underline button
    var UnderlineButton = Button.extend(Button(), {
        name: 'underline',
        icon: 'fa fa-underline',
        title: '下划线文字 ( Ctrl + u )',
        tagName: 'u',
        command: 'underline',
        menu: false,
        excludeButtons: []
    })
    // strike button
    var StrikeButton = Button.extend(Button(), {
        name: 'strike',
        icon: 'fa fa-strikethrough',
        title: '下划线文字 ( Ctrl + u )',
        tag: 'strike',
        command: 'strikethrough',
        menu: false,
        excludeButtons: []
    })
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

  var defaultOptions = {
      toolbars: ['title', 'bold', 'italic', 'underline', 'strike', 'sp', 'ol', 'ul', 'indent', 'outdent', 'quote', 'hr', 'sp', 'table']
  }
  /**
   *	JustEditor
   *
   *
   */
  var JustEditor = function(selector, options) {
    this.$buttons = []
    this.options = _extend(defaultOptions, options || {})

    this.$editor = typeof selector === 'string' ? document.getElementById(selector) : selector

    // the cursor point element
    this.$currentEl = null
    console.log(this.$editor, typeof selector)
    this.init()
  }

  JustEditor.prototype = {
    init: function() {
        // create editor's element
        this.$toolbar = document.createElement('div')
        this.$toolbar.setAttribute('class', 'je-toolbar')
        this.$menuUl = document.createElement('ul')
        this.$toolbar.appendChild(this.$menuUl)

        // create contenteditable div as body
        this.$body = document.createElement('div')
        this.$body.setAttribute('contenteditable', true)
        this.$body.setAttribute('class', 'je-body')

        console.log(this.$editor)
        this.$editor.appendChild(this.$toolbar)
        this.$editor.appendChild(this.$body)

        this.buildToolbar()
    },
    buildToolbar: function() {
        var name, $toolbar, btn;
        for(var i = 0; i < this.options.toolbars.length; i ++) {
            name = this.options.toolbars[i]
            $toolbar = document.createElement('li')
            if (name === 'sp') {
                var $li = document.createElement('li')
                $li.innerHTML = '<span class="separator"></span>'
                this.$menuUl.appendChild($li)
                continue
            } else {
                if(!buttons[name]) {
                    console.log('Not found button with name ' + name)
                    continue
                }
                btn = new buttons[name]
                btn.init()
                this.$menuUl.appendChild(btn.$li)
            }
        }
    }
  }

  function justeditor(selector, options) {
    var editor = new JustEditor(selector, options)
  }

  this.JustEditor = JustEditor
  this.justeditor = justeditor
}).call(this);
