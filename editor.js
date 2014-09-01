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
      var chrome, firefox, ie, safari, ua;
      ua = navigator.userAgent;
      ie = /(msie|trident)/i.test(ua);
      chrome = /chrome|crios/i.test(ua);
      safari = /safari/i.test(ua) && !chrome;
      firefox = /firefox/i.test(ua);
      if (ie) {
          return {
              msie: true,
              pbr: '',
              version: ua.match(/(msie |rv:)(\d+(\.\d+)?)/i)[2] * 1
          };
      } else if (chrome) {
          return {
              webkit: true,
              chrome: true,
              pbr: '<br>',
              version: ua.match(/(?:chrome|crios)\/(\d+(\.\d+)?)/i)[1] * 1
          };
      } else if (safari) {
          return {
              webkit: true,
              safari: true,
              pbr: '',
              version: ua.match(/version\/(\d+(\.\d+)?)/i)[1] * 1
          };
      } else if (firefox) {
          return {
              mozilla: true,
              firefox: true,
              pbr: '',
              version: ua.match(/firefox\/(\d+(\.\d+)?)/i)[1] * 1
          };
      } else {
          return {};
      }
  })()

  browser.createEmptyP = function($parent, $beforeEl) {
      var sel = window.getSelection()
      if (!sel || !sel.rangeCount) {
          console.log('selection is null or no range!', sel)
          return
      }
      var range = sel.getRangeAt(0),
          $p = document.createElement("p");

      // chrome浏览器中, p元素至少要有一个元素, range才能setStart成功
      $p.innerHTML = browser.pbr

      if ($beforeEl) {
          $parent.insertBefore($p, $beforeEl)
      } else {
          $parent.appendChild($p)
      }
      // range设置为$p的第一个节点
      range.setStart($p, 0)
      // range collapse在开头位置
      range.collapse(true);
      // range加入到sel中
      sel.removeAllRanges();
      sel.addRange(range);

      return $p
  }

  buttons.register = function(btn) {
    if (!btn || !btn.prototype.name) {
        console.log("Warning: btn is null or btn.prototype.name is null", btn)
        return;
    }
    if (!buttons[btn.prototype.name]) {
        buttons[btn.prototype.name] = btn
    }
  }

  function _extend(source, obj, notReplace) {
    for (var prop in source) {
        if ((!notReplace) || (notReplace === true && !obj[prop]))
            obj[prop] = source[prop]
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

    // 将old element变成new tag, 返回new element
    function transformTo($oel, nTag, range) {
        var $child,
            $tmp,
            $parent = $oel.parentNode,
            $nel = document.createElement(nTag)

        console.log($parent, $oel, $oel.parentNode)
        for ($child = $oel.firstChild; $child !== $oel.lastChild;) {
            $tmp = $child.nextSibling
            $nel.appendChild($child)
            $child = $tmp
        }
        if ($child) {
            $nel.appendChild($child)
        }

        if (range) {
            console.log('transformTo will modify range ........', range._start, range._end);
            (range._start === $oel) && (range._start = $nel);
            (range._end === $oel) && (range._end = $nel);
        }
        $parent.insertBefore($nel, $oel)
        $parent.removeChild($oel)
        return $nel
    }
    // $s: start element
    // $e: end element
    // $c: the final container element: $body
    // fn: filter function
    // cond: complete condition
    var travelUp = function($s, $e, $c, fn, cond) {
        var $p;

        console.log('travelUp: ', $s, $e, $s===$e, $s.nodeType)
        for($p = $s.parentNode; $s !== $e && $s !== $c;) {
            if (fn($s, $p) === cond) {
                console.log('  travel match at:', $s, $p, cond)
                return cond
            }
            $s = $p, $p = $p.parentNode
        }

        console.log('  travel default:', !cond)
        return !cond
    }
  var Range = function(editor) {
      this.sel = window.getSelection ? window.getSelection() : document.getSelection()
      this.range = (this.sel && this.sel.rangeCount) ? this.sel.getRangeAt(0) : null
      this.editor = editor
  }
  Range.prototype = {
      rangeAtEnd: function(editor) {
          if ((!this.range) || (!this.range.collapsed)) {
              return false
          }
          var self = this
          return travelUp(self.range.endContainer, editor.$currentEl.parentNode, editor.$body, function($s, $p) {
              if ($p) {
                  if ($s !== $p.lastChild) {
                      console.log('not last child: ', $s)
                      return false
                  }
              }
              if ($s.nodeType === 3) {
                  if ($s.length !== self.range.endOffset) {
                      console.log('not at text end: ', $s)
                      return false
                  }
              }
              return true
          }, false)
      },
      rangeAtStart: function(editor) {
          if ((!this.range) || (!this.range.collapsed)) {
              return false
          }
          var self = this
          return travelUp(self.range.endContainer, editor.$currentEl.parentNode, editor.$body, function($s, $p) {
              if ($p) {
                  if($s !== $p.firstChild) {
                      return false
                  }
              }
              if ($s.nodeType === 3) {
                  if (self.range.endOffset !== 0) {
                      return false
                  }
              }
              return true
          }, false)
      },
    clear: function() {
        var e;
        try {
            return this.sel.removeAllRanges();
        } catch (_error) {
            e = _error;
        }
    },
      // root 应该是editor.$body.parentNode
      getRangeAllNodes: function(root, filterFn) {
          if (!this.range) return [];
          if (this.range.collapsed) return [this.range.endContainer];

          var start = this.range.startContainer,
              end = this.range.endContainer,
              result = [],
              startLine = []

          // 遍历parent节点, child右边的所有元素，深度优先
          // return true will stop the travel iteration
          function travelPartial(parent, child) {
              if (child === end) {
                  return true
              }

              if(child.hasChildNodes()) {
                  if(travelPartial(child, child.firstChild) === true) {
                      return true
                  }
              }

              filterFn ? (filterFn(child) && result.push(child)) :  result.push(child);

              var next = child.nextSibling
              if (!next) {
                  return
              }

              travelPartial(parent, next)
          }

          if(start.hasChildNodes()) {
              travelPartial(start, start.firstChild)
          }
          filterFn ? (filterFn(child) && result.push(child)) :  result.push(child);
          var child = start.nextSibling,
              parent

          for (var tmp = start.parentNode; tmp && tmp !== root && tmp !== end; tmp = tmp.parentNode) {
              startLine.push(tmp)
          }

          for (var i = 0; i < startLine.length; i ++) {
              parent = startLine[i]
              while(child) {
                  if(travelPartial(parent, child) === true) {
                      return result
                  }
                  child = child.nextSibling
              }
              filterFn ? (filterFn(child) && result.push(child)) :  result.push(child);
              child = parent.nextSibling
          }

          return result
      },
      getBodyChild: function($ele) {
          var $body = this.editor.$body,
              $p
          for($p = $ele; $p.parentNode !== $body && $p.parentNode !== document.body; $p = $p.parentNode);
          return $p.parentNode === $body ?  $p :  null
      },
      getBodyChildren: function() {
          var start = this.getBodyChild(this.range.startContainer),
              end = this.getBodyChild(this.range.endContainer)
          if (start === end) return [start];
          var children = []
          for (var ele = start; ele !== end; ele = ele.nextSibling) {
              children.push(ele)
          }
          children.push(end)
          return children
      },
      getNodeP: function() {
          if (!this.range) return [];
          if (this.range.collapsed) {
              return this.editor.$currentEl ? [ this.editor.$currentEl ] : []
          }
          var start = this.getBodyChild(this.range.startContainer),
              end = this.getBodyChild(this.range.endContainer);
          if (start === null || end === null ) {
              throw "start or end is null";
              return []
          }
          if (start === end) return [start];
          var children = start.parentNode.childNodes;
              var indexStart = _ap.indexOf.call(children, start),
              indexEnd = _ap.indexOf.call(children, end)
          if (indexStart === -1 || indexEnd === -1) {
              throw "start or end is not child of editor body"
          }
          if (indexStart < indexEnd) {
              var tmp = indexEnd
              indexStart = tmp
              indexEnd = indexStart
          }
          return _ap.slice.call(children, indexStart, indexEnd+1)
      },
      doCommand: function(nodetag, fn) {
          var nodes,
              nd;
          if (nodetag === 'p') {
              nodes = this.getNodeP()
          } else if (nodetag === 'all') {
              nodes = this.getRangeAllNodes(this.editor.$body.parentNode)
          }
          for (var i = 0; i < nodes.length; i++) {
             nd = nodes[i];
             (nodetag === 'p' && this.editor.$currentEl === nd) ? (this.editor.$currentEl = fn(nd)) : fn(nd)
          }
      },
      save: function() {
          if (!this.range) {
              console.log("range.save: this.range is null!!!")
              return
          };
          if (this._start) return;
          this._start = this.range.startContainer
          this._startOffset = this.range.startOffset
          this._end = this.range.endContainer
          this._endOffset = this.range.endOffset
          return this
      },
      restore: function(or) {
          var rg = or ? or : this
          this.clear()
          var range = document.createRange();
          range.setStart(rg._start, rg._startOffset);
          range.setEnd(rg._end, rg._endOffset);
          this.sel.addRange(range);
          return this
      }
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
      var events = this.events[name]
      if (events) {
      	var event
      	for (var i = 0; i < events.length; i ++) {
      		event = events[i]
      		event.cb.call(event.ctx, name, a, b, c)
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
        this.$a = null
        this.$exclueBtns = []
    }
    return btn
  }

  Button.prototype = {
    init: function(editor) {
      var self = this,
          $li = document.createElement('li')
      if (typeof this.command === 'string' && this.command) {
         $li.setAttribute('data-cmd', this.command)
      }
      if (this.tag) {
         $li.setAttribute('data-tag', this.tag)
      }
      $li.addEventListener('click', function(event) {self.onclick.call(self, event)})
      // render button
      $li.innerHTML = '<a tabindex="-1" unselectable="on" class="toolbar-item toolbar-item-' +
        this.name + '" class="active: false" href="javascript:;" title="' +
        this.title +
        '"><span class="' +
        this.icon +
        '"></span></a>'
      this.$el = $li
      this.$a = $li.firstChild
      // set editor
      this.editor = editor

      if(this.typ === 'menu') {
          this.renderMenu()
      }
    },
    renderMenu: function() {
        if (! isArray(this.menus)) {
            console.log('this.menus is NOT Array!')
            return
        }
        var menu,
            $menuWrapper = document.createElement('div'),
            $ul = document.createElement('ul'),
            $menuItem,
            $a,
            $span;
        $menuWrapper.setAttribute('class', 'toolbar-menu')
        $menuWrapper.classList.add('toolbar-menu'+this.name)
        for (var i = 0; i < this.menus.length; i ++) {
            menu = this.menus[i]
            $menuItem = document.createElement('li')
            if (menu === '|') {
                $menuItem.innerHTML = '<span class="separator"></span>'
                $ul.appendChild($menuItem)
                continue
            }
            $span = document.createElement('span')
            $a = document.createElement('a')
            $span.innerText = menu.text || ''
            $a.appendChild($span)
            $a.classList.add('menu-item')
            $a.classList.add("menu-item"+ (menu.param||''))
            $a.setAttribute('tabindex', -1)
            $a.setAttribute('title', menu.text || '')
            $a.href = "javascript:;"
            $menuItem.setAttribute('data-param', menu.param || '')
            $menuItem.appendChild($a)
            $ul.appendChild($menuItem)
        }
        $menuWrapper.appendChild($ul)
        this.$el.appendChild($menuWrapper)
    },
    liClicked: function (event) {
        var $el
        for ($el = event.target; $el !== this.$li; $el = $el.parentNode ) {
            if ($el.nodeName.toLowerCase() === 'li') {
                break
            }
        }
        return $el
    },
    onclick: function(event) {
        if (this.typ === 'menu') {
            var $el = this.liClicked(event)
            if ($el === this.$el) {
                this.$el.classList.toggle('menu-on')
            } else {
                // hide menu
                this.$el.classList.remove('menu-on')
                // exec the command
                var cmd = $el.getAttribute('data-param')
                this.range = new Range(this.editor)
                this.range.save()
                this.execMenuCmd && this.execMenuCmd(event, cmd)
                this.range.restore()
            }
        } else if (this.typ === 'basic') {
            console.log('exec command: ', this.command)
            this.command && document.execCommand(this.command, false)
        } else {
            this.exec(event)
        }
        this.editor.$body.focus()
        this.editor.fire('statusChange')
        event.preventDefault()
        event.stopPropagation()
        return false
    },
    exec: function(event) {
    },
    updateStatus: function(event) {
        if (this.typ === 'basic') {
            if ( document.queryCommandState(this.command) === true ) {
                this.$a.classList.add('active')
            } else {
                this.$a.classList.remove('active')
            }
        }
    }
  }
    _extend(Event, Button.prototype)

  Button.extend = function(fn, props) {
      var btn = extend.call(this, fn, props)
      buttons.register(btn)
      return btn
  }

  var TextButton = Button.extend(Button(), {
    name: 'title',
    title: '标题文字',
    icon: 'fa fa-text',
    tag: 'title',
    command: '',
    status: '',
    typ: 'menu',
    menus:[{
        name: 'normal',
        text: '普通文本',
        param: 'p'
    }, '|', {
        name: 'h1',
        text: '标题 1',
        param: 'h1'
    }, {
        name: 'h2',
        text: '标题 2',
        param: 'h2'
    }, {
        name: 'h3',
        text: '标题 3',
        param: 'h3'
    }],
    exclueButtons: []
  })

  TextButton.prototype.execMenuCmd = function(event, cmd) {
    console.log('execMenuCmd: ', cmd)
      var range = this.range
      range.doCommand('p', function($el) {
        console.log('text button docommand:', $el, cmd)
        var tag = $el.nodeName
          if (tag === cmd) return $el;
          return transformTo($el, cmd, range)
      })
      this.updateStatus()
  }

  TextButton.prototype.setActive = function(cls) {
      if (cls === '') {
          this.$a.classList.remove('active')
          this.$a.classList.remove('active-h1')
          this.$a.classList.remove('active-h2')
          this.$a.classList.remove('active-h3')
          return
      }
      this.$a.classList.add('active')
      if (cls === 'h1') {
          this.$a.classList.remove('active-h2')
          this.$a.classList.remove('active-h3')
          this.$a.classList.add('active-h1')
      } else if (cls === 'h2'){
          this.$a.classList.remove('active-h1')
          this.$a.classList.remove('active-h3')
          this.$a.classList.add('active-h2')
      } else if (cls === 'h3'){
          this.$a.classList.remove('active-h1')
          this.$a.classList.remove('active-h2')
          this.$a.classList.add('active-h3')
      }
  }

  TextButton.prototype.updateStatus = function(event) {
      var editor = this.editor,
          tagName
      if (!editor.$currentEl) return;
      tagName = editor.$currentEl.nodeName.toLowerCase()
      console.log('text button update status: ',editor.$currentEl, tagName)

      if (tagName === 'h1') {
          this.setActive('h1')
      } else if (tagName === 'h2') {
          this.setActive('h2')
      } else if (tagName === 'h3') {
          this.setActive('h3')
      } else {
          this.setActive('')
      }
  }
    // bold button
    var BoldButton = Button.extend(Button(), {
        name: 'bold',
        icon: 'fa fa-bold',
        title: '加粗文字 ( Ctrl + b )',
        tag: 'b',
        typ: 'basic',
        command: 'bold',
        excludeButtons: []
    })
    // italic button
    var ItalicButton = Button.extend(Button(), {
        name: 'italic',
        icon: 'fa fa-italic',
        title: '斜体文字 ( Ctrl + i )',
        tag: 'i',
        typ: 'basic',
        command: 'italic',
        menu: false,
        excludeButtons: []
    })
    // underline button
    var UnderlineButton = Button.extend(Button(), {
        name: 'underline',
        icon: 'fa fa-underline',
        title: '下划线文字 ( Ctrl + u )',
        tag: 'u',
        typ: 'basic',
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
        typ: 'basic',
        command: 'strikethrough',
        menu: false,
        excludeButtons: []
    })
    Button.extend(Button(), {
        name: 'hr',
        icon: 'fa fa-minus',
        title: '分割线',
        tag: 'hr',
        typ: 'custom',
        exec: function() {
            var editor = this.editor
            if (!editor.$currentEl) {
                return
            }
            var $hr = document.createElement('hr')
            editor.$body.insertBefore($hr, this.$currentEl.nextSibling)

            editor.$body.focus()}
    })
    Button.extend(Button(), {
        name: 'indent',
        icon: 'fa fa-indent',
        title: '向右缩进 ( Tab ) ',
        tag: 'indent',
        typ: 'custom',
        exec: function() {
        }
    })
    Button.extend(Button(), {
        name: 'outdent',
        icon: 'fa fa-outdent',
        title: '向左缩进 ( Shift + Tab ) ',
        tag: 'outdent',
        typ: 'custom',
        exec: function() {}
    })
    Button.extend(Button(), {
        name: 'quote',
        icon: 'fa fa-quote-left',
        title: '引用',
        tag: 'blockquote',
        typ: 'custom',
        exec: function() {}
    })
    /**
     *  list
     */
    // 将ul或ol下的li元素修改为ol或ul下的li元素, 将当前的ul或ol元素break为多个元素
    // $body 为 $jeBody
    // $list为当前的list元素: ul or ol
    // $li为当前的li元素
    // to为变成的tagName: ul or ol
    function convertLi($list, to) {
        var $p = $list.parentNode,
            $li,
            tagname = $list.nodeName,
            $nlist = document.createElement(to);   // new list
        var $headList,
            $tailList,
            $el, $tmp;
        var sel = window.getSelection(),
            range = sel.getRangeAt(0),
            $ec = range.endContainer,
            eo = range.endOffset

        for ($li = $ec; $li !== $list && $li.nodeName.toLowerCase() !== 'li'; ) {
            $li = $li.parentNode
        }
        if ($li.nodeName.toLowerCase() !== 'li') {
            throw new Error('Not found li element in converLi');
        }

        // $li不是$list的第一个元素时, 将break出一个headList
        if ($list.firstChild !== $li) {
            $headList = document.createElement(tagname)
            console.log($list, $list.firstChild)
            for ($el = $list.firstChild; $el !== $li; ) {
                $tmp = $el.nextSibling
                $headList.appendChild($el)
                $el = $tmp
            }
            $p.insertBefore($headList, $list)
        }

        // $li不是list的最后一个元素, break出一个tailList
        if ($list.lastChild !== $li) {
            $tailList = document.createElement(tagname)
            for ($el = $li.nextSibling; $el !== $list.lastChild; ) {
                $tmp = $el.nextSibling
                $tailList.appendChild($el)
                $el = $tmp
            }
            $tailList.appendChild($list.lastChild)
        }

        // 新的节点
        if (to === 'p') {
            for (var $child = $li.firstChild; $child !== $li.lastChild; ) {
                $tmp = $child.nextSibling
                $nlist.appendChild($child)
                $child = $tmp
            }
            if ($child) {
                $nlist.appendChild($child)
            }
        } else {
            $nlist.appendChild($li)
        }

        $p.insertBefore($nlist, $list)
        if($tailList) {
            $p.insertBefore($tailList, $list)
        }

        // 光标
        var ecName = $ec.nodeName.toLowerCase()
        if (ecName === 'li' || ecName === 'ul' || ecName === 'ol') {
            range.setEnd($nlist, 0)
            range.collapse(true)
        } else {
            range.setEnd($ec, eo)
        }
        sel.removeAllRanges()
        sel.addRange(range);

        // 移除原来的list
        $p.removeChild($list)
    }
    // 将当前非list元素convert为list元素
    function convertToList($cu, to) {
        var $nlist = document.createElement(to),
            $li = document.createElement('li'),
            $p = $cu.parentNode,
            sel = window.getSelection(),
            range = sel.getRangeAt(0),
            $ec = range.endContainer,
            eo = range.endOffset

        console.log('b0: convertToList:', $ec, eo)
        //$li.innerHTML = $cu.innerHTML
        for (var $el = $cu.firstChild; $el !== $cu.lastChild; $el = $el.nextSibling) {
            $li.appendChild($el)
        }
        if ($el) {
            $li.appendChild($el)
        }

        $nlist.appendChild($li)
        $p.insertBefore($nlist, $cu)
        if ($ec === $cu) {
            console.log('b1 convert to list, set range: ', range.endContainer, range.endOffset)
            range.setEnd($li, eo)
            range.collapse(true)
        } else {
            console.log('b2 convert to list, set range: ', range.endContainer, range.endOffset)
            range.setEnd($ec, eo)
            range.collapse(true)
        }
        sel.removeAllRanges();
        sel.addRange(range);

        $p.removeChild($cu)
        // 光标位置？
    }

    // break list
    // 将olist的子元素移动到新的list中
    // $olist: old list
    // $nlist: new list
    // $li:    start or end li element, depend on fromHead
    function breakList($olist, $nlist, $li, fromHead) {
        var $el,
            $tmp,
            $end

        if (fromHead) {
            $el = $olist.firstChild
            $end = $li
        } else {
            $el = $li
            $end = $olist.lastChild
        }

        for(; $el && $el !== $end; ) {
            $tmp = $el.nextSibling
            $nlist.appendChild($el)
            $el = $tmp
        }
        if ($el) {
            $nlist.appendChild($el)
        }
    }

    // 获取range中的所有元素
    function getRangeElements(range) {
        var $start = range.startContainer,
            $end = range.endContainer,
            $el,
            $tmp,
            $first,
            $last,
            ret = []

        if (range.collapsed) {
            return [this.$currentEl]
        }

        for($first = $start; $first !== this.$body && $first.parentNode !== this.$body;) {
            $tmp = $first
            $first = $first.parentNode
        }

        if ($first === this.$body) {
            return []
        }

        if ($first.nodeName.toLowerCase() === 'ul' || $first.nodeName.toLowerCase() === 'ol') {
            ret.push([$first, $tmp])
        } else {
            ret.push($first)
        }

        for ($last = $end; $last !== this.$body && $last.parentNode !== this.$body;) {
            $tmp = $last
            $last = $last.parentNode
        }

        if ($last === this.$body) {
            return []
        }

        // 将每个element加入到ret中
        for ($el = $first.nextSibling; $el && $el !== $last; $el = $el.nextSibling) {
            ret.push($el)
        }

        if ($last !== $first) {
            if ($last.nodeName.toLowerCase() === 'ul' || $last.nodeName.toLowerCase() === 'ol') {
                ret.push([$last, $tmp])
            } else {
                ret.push($last)
            }
        }

        return ret
    }

    // 将选中的区域变成一个list
    // this should be editor
    function mergeToList(sel, range, btn) {
        var $list,
            $el,
            $first,
            $li,
            $elements = getRangeElements.call(this, range),
            tag = btn.tag,
            emptyList = true,
            name;

        if($elements === []) {
            console.log('range return empty array, something wrong')
            return
        }

        $first = $elements[0]
        $list = document.createElement(tag)
        if (isArray($first)) {
            // ul or ol
            breakList($first[0], $list, $first[1], false)
            emptyList = false
            this.$body.insertBefore($list, $first[0].nextSibling)
        } else {
            name = $first.nodeName.toLowerCase()
            if (name === 'p') {
                $li = transformTo($first, 'li')
                $list.appendChild($li)
                emptyList = false
                this.$body.insertBefore($list, $first.nextSibling)
                this.$body.removeChild($first)
            }
        }

        for (var i = 1; i < $elements.length; i ++) {
            $el = $elements[i]

            if (i === $elements.length - 1) {
                if (isArray($el)) {
                    // 最后一个
                    breakList($el[0], $list, $el[1], true)
                    this.$body.insertBefore($list, $el[0])
                } else {
                    name = $el.nodeName.toLowerCase()
                    if (name === 'p') {
                        $li = transformTo($el, 'li')
                        $list.appendChild($li)
                    } else {
                        // 不对这些元素做任何处理, $list完成
                    }
                    if(emptyList === true) {
                        this.$body.insertBefore($list, $el)
                    }
                    this.$body.removeChild($el)
                }
            } else {
                name = $el.nodeName.toLowerCase()
                if (name === 'p' || name === 'ul' || name === 'ol') {
                    $li = transformTo($el, 'li')
                    $list.appendChild($li)
                    if (emptyList === true) {
                        this.$body.insertBefore($list, $el.nextSibling)
                        emptyList = false
                    }
                    this.$body.removeChild($el)
                } else {
                    if (emptyList === false) {
                        $list = document.createElement(tag)
                        emptyList = true
                    }
                }
            }
        }
    }
    // this should be ol or ul
    function execList() {

    }
    var OlButton = Button.extend(Button(), {
        name: 'ol',
        icon: 'fa fa-list-ol',
        title: '有序列表',
        tag: 'ol',
        typ: 'custom',
        exec: function() {
            execList.call(this)
        }
    })
    var UlButton = Button.extend(Button(), {
        name: 'ul',
        icon: 'fa fa-list-ul',
        title: '无序列表',
        tag: 'ul',
        typ: 'custom',
        exec: function() {
            execList.call(this)
        }
    })
    var TableButton = Button.extend(Button(), {
        name: 'table',
        icon: 'fa fa-table',
        title: '插入表格',
        tag: 'table',
        typ: 'menu',
        exec: function() {
        },
        tdHover: function(event) {
            var $target = event.currentTarget,
                param = $target.getAttribute("data-param")
                ,cols, rows;

            if (!param) {
                return
            }
            cols = parseInt(param.split(',')[1])
            rows = parseInt(param.split(',')[0])

            for(var i = 0; i < 6; i ++) {
                for( var j = 0; j < 6; j ++) {
                    if(i < rows && j < cols) {
                        this.$createMenu[i][j].classList.add("selected")
                    } else {
                        this.$createMenu[i][j].classList.remove("selected")
                    }
                }
            }
        },
        tdClick: function(event) {
            console.log('click on create table menu')
            var sel = window.getSelection(),
                range = sel.getRangeAt(0),
                $target = event.currentTarget,
                param = $target.getAttribute("data-param"),
                vm = this.editor,
                cols, rows;

            if (!range || !param) {
                console.log('range or param is nil')
                return
            }
            if (!vm.$currentEl) {
                console.log('current element is null')
                return
            }
            var $table = document.createElement('table')

            cols = parseInt(param.split(',')[1])
            rows = parseInt(param.split(',')[0])

            var $tbody = document.createElement('tbdoy'),
                $tr,
                $td
            for(var i = 0; i < rows; i ++) {
                $tr = document.createElement('tr')
                for (var j = 0; j < cols; j++) {
                    $td = document.createElement('td')
                    $tr.appendChild($td)
                }
                $tbody.appendChild($tr)
            }
            $table.appendChild($tbody)
            console.log(vm.$currentEl.nextSibling)
            vm.$body.insertBefore($table, vm.$currentEl.nextSibling)
        }
    })
    console.log('table button:', TableButton.prototype)
    TableButton.prototype.renderMenu = function() {
        var $menuDiv = document.createElement('div')
        $menuDiv.setAttribute('class', "toolbar-menu toolbar-menu-table")
        $menuDiv.innerHTML ='<div class="menu-create-table" style="display: block;">' +
            '<table><tbody>' +
            '<tr><td data-param="1,1"></td><td data-param="1,2"></td><td data-param="1,3"></td><td data-param="1,4"></td><td data-param="1,5"></td><td data-param="1,6"></td></tr>' +
            '<tr><td data-param="2,1"></td><td data-param="2,2"></td><td data-param="2,3"></td><td data-param="2,4"></td><td data-param="2,5"></td><td data-param="2,6"></td></tr>' +
            '<tr><td data-param="3,1"></td><td data-param="3,2"></td><td data-param="3,3"></td><td data-param="3,4"></td><td data-param="3,5"></td><td data-param="3,6"></td></tr>' +
            '<tr><td data-param="4,1"></td><td data-param="4,2"></td><td data-param="4,3"></td><td data-param="4,4"></td><td data-param="4,5"></td><td data-param="4,6"></td></tr>' +
            '<tr><td data-param="5,1"></td><td data-param="5,2"></td><td data-param="5,3"></td><td data-param="5,4"></td><td data-param="5,5"></td><td data-param="5,6"></td></tr>' +
            '<tr><td data-param="6,1"></td><td data-param="6,2"></td><td data-param="6,3"></td><td data-param="6,4"></td><td data-param="6,5"></td><td data-param="6,6"></td></tr>' +
            '</tbody></table></div>' +
            '<div class="menu-edit-table" style="display: none;">' +
            '<ul><li><a tabindex="-1" unselectable="on" class="menu-item" href="javascript:;" data-param="deleteRow"><span>删除行</span></a></li>' +
            '<li><a tabindex="-1" unselectable="on" class="menu-item" href="javascript:;" data-param="insertRowAbove"><span>在上面插入行</span></a></li>' +
            '<li><a tabindex="-1" unselectable="on" class="menu-item" href="javascript:;" data-param="insertRowBelow"><span>在下面插入行</span></a></li>' +
            '<li><span class="separator"></span></li>' +
            '<li><a tabindex="-1" unselectable="on" class="menu-item" href="javascript:;" data-param="deleteCol"><span>删除列</span></a></li>' +
            '<li><a tabindex="-1" unselectable="on" class="menu-item" href="javascript:;" data-param="insertColLeft"><span>在左边插入列</span></a></li>' +
            '<li><a tabindex="-1" unselectable="on" class="menu-item" href="javascript:;" data-param="insertColRight"><span>在右边插入列</span></a></li>' +
            '<li><span class="separator"></span></li>' +
            '<li><a tabindex="-1" unselectable="on" class="menu-item" href="javascript:;" data-param="deleteTable"><span>删除表格</span></a></li>' +
            '</ul></div>',
        this.$el.appendChild($menuDiv)

        var $div = this.$el.querySelector(".menu-create-table"),
            $tr = $div.firstChild.firstChild.firstChild,
            self = this
        this.$createMenu = []
        for (; $tr; $tr = $tr.nextSibling) {
            var $trs = []
            for (var $td = $tr.firstChild; $td; $td = $td.nextSibling) {
                $td.addEventListener('mouseover', function(event) {
                    self.tdHover.call(self, event)
                } )
                $td.addEventListener('click', function(event){
                    self.tdClick.call(self, event)
                })

                $trs.push($td)
            }
            this.$createMenu.push($trs)
        }
        console.log(this.$createMenu)
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
  var _editors = []
  var JustEditor = function(selector, options) {
    this.$buttons = []
    this.$menuButtons = []
    this.options = _extend(defaultOptions, options || {}, true)

    this.$editor = typeof selector === 'string' ? document.getElementById(selector) : selector

    // the cursor point element
    this.$currentEl = null
    this.saved = []
    this.savedIndex = 0
    this.init()

    _editors.push(this)
  }

  JustEditor.prototype = {
      upShortCuts: {},
      downShortCuts: {},
    init: function(content) {
        // create editor's element
        this.$toolbar = document.createElement('div')
        this.$toolbar.setAttribute('class', 'je-toolbar')
        this.$menuUl = document.createElement('ul')
        this.$toolbar.appendChild(this.$menuUl)

        // create contenteditable div as body
        this.$body = document.createElement('div')
        this.$body.setAttribute('contenteditable', true)
        this.$body.setAttribute('class', 'je-body')

        this.$editor.appendChild(this.$toolbar)
        this.$editor.appendChild(this.$body)

        this._browser = browser

        this.buildToolbar()
        this.bindEvents()
        this.$body.focus()

        if (!content) {
            this.$currentEl = this._browser.createEmptyP(this.$body)
        } else {
            this.$body.innerHTML = content
            this.$currentEl = this.$body.firstChild
        }
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
                btn.init(this)
                this.$menuUl.appendChild(btn.$el)
            }

            this.$buttons.push(btn)
            if (btn.typ === 'menu') {
                this.$menuButtons.push(btn)
            }
        }
    },
    bindEvents: function() {
        var keymap = {
            'backspace': 8,
            'enter': 13,
            'del': 46,

            'insert': 45,
            'left': 37,
            'up': 38,
            'right': 39,
            'down': 40,
            'pageup': 33,
            'pagedown': 34,
            'home': 36,
            'end': 35
            },
            method,
            code
        for (var eh in this) {
            if (typeof this[eh] === 'function') {
                if (/^on.+/.test(eh)) {
                    var name = eh.replace(/^on/, '').toLowerCase(),
                        self = this;
                    this.$body.addEventListener(name, (function() {
                        var fn = self[eh]
                        return function(event) { fn.call(self, event) }
                    })())
                } else if (/^key*/.test(eh)) {
                    if (/^keydown*/.test(eh)) {
                        method = 'down'
                        code = eh.replace(/^keydown/, '').toLowerCase()
                    } else if (/^keyup*/.test(eh)) {
                        method = 'up'
                        code = eh.replace(/^keyup/, '').toLowerCase()
                    } else {
                        console.log('method begin with key but neither keydown or keyup: ' + eh)
                        continue
                    }
                    if (keymap[code]) {
                        this.registerShortCut(method, keymap[code], this[eh])
                    } else {
                        console.log("Not found key in keymap:", code)
                    }
                }
            }
        }

        this.on('statusChange', this.updateStatus, this)
    },
    updateStatus: function(eventName) {
        console.log("updateStatus:", eventName)
        for (var i = 0; i < this.$buttons.length; i ++) {
            this.$buttons[i].updateStatus(eventName)
        }
    },
    onBlur: function(event) {
        //console.log('onBlur')
    },
    onFocus: function(event) {
        //console.log('onFocus')
    },
    onClick: function(event) {
        //console.log('onClick')
    },
    onMouseDown: function(event) {
        //console.log('onMouseDown')
    },
    onMouseUp: function(event) {
        //console.log('onMouseUp')
        var range = new Range(this)

        if (this.$body.innerHTML.trim() === '') {
            this._browser.createEmptyP(this.$body)
        }
        this.cursorPos()
        // 更新toolbar status
        this.updateStatus(event, range)
    },
    onKeydown: function(event) {
        //console.log('onKeydown')
        if (this.downShortCuts[event.which]) {
            this.downShortCuts[event.which].call(this, event)
        }
    },
    onKeyup: function(event) {
        //console.log('onKeyup', event, event.which, this.upShortCuts)
        if (this.upShortCuts[event.which]) {
            this.upShortCuts[event.which].call(this, event)
        }
    },
      keydownEnter: function(event) {
        console.log("key down enter")
      },
      keyupDel: function(event) {

      },
      keyBackspace: function(event) {

      },
      registerShortCut: function(method, key, handler) {
          var shortCuts = method === 'up' ? this.upShortCuts : this.downShortCuts
          if (!shortCuts[key]) {
              shortCuts[key] = handler
          }
      },
      // 获得输入光标的当前位置
      cursorPos: function(event) {
          var sel = window.getSelection(),
              range = sel.getRangeAt(0),
              $el = range.startContainer,
              $parent;

          $parent = $el.parentNode
          while ($parent !== this.$body && $el !== this.$body) {
              console.log('cursor pos travel:', $el, 'parent:', $parent)
              $el = $parent
              $parent = $parent.parentNode
          }
          console.log('cursor pos:', $el)
          this.$currentEl = $el
      },
      setCurrentEl: function($ele) {
          this.$currentEl = $ele
      },
      undo: function() {
          if (this.savedIndex <= 0) return
          this.savedIndex --
          this.$body.innerHTML = this.saved[this.savedIndex].html
          var range = new Range(this)
          range.restore(this.saved[this.savedIndex].range)
      },
      redo: function() {
          if (this.savedIndex >= this.saved.length) return;
          this.savedIndex ++
          this.$body.innerHTML = this.saved[this.savedIndex].html
          var range = new Range(this)
          range.restore(this.saved[this.savedIndex].range)
      },
      //.保存innerHTML和range
      saveDone: function() {
          var range = new Range(this)
          range.save()
          this.saved.push( {
            html: this.$body.innerHTML,
            range: range
          })
          this.savedIndex ++
      }
  }
    // inherits event
    _extend(Event, JustEditor.prototype)

  this.JustEditor = JustEditor

  // hide all menus
  document.addEventListener('click', function() {
      var e, $menu;
      for (var i = 0; i < _editors.length; i ++) {
          e = _editors[i]
          console.log("document onclick")
          for (var j = 0; j < e.$menuButtons.length; j ++) {
              $menu = e.$menuButtons[j]
              $menu.$el.classList.remove('menu-on')
          }
      }
  })
}).call(this);
