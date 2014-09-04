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

    function nodename($el) {
        return $el.nodeName.toLowerCase()
    }
    // 将old element变成new tag, 返回new element
    // append: true: append the $nel to it's parent
    //         false: not append the $nel to it's parent
    function transformTo($oel, nTag, append) {
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

        if (append === true) {
            $parent.insertBefore($nel, $oel)
            $parent.removeChild($oel)
        }
        return $nel
    }
    // $s: start element
    // $e: end element
    // $c: the final container element: $body
    // fn: filter function
    // cond: complete condition
    function travelUp ($s, $e, $c, fn, cond) {
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
    // 尝试将list与前面的元素和后面的元素合并
    function _mergeList($first, $second) {
        for (var $p = $second.firstChild; $p; $p = $p.nextSibling) {
            $first.appendChild($p)
        }
        return $first
    }
    // 合并元素
    // dir: 合并反向
    //   "prev": 合并prev元素
    //   "next": 合并next元素
    //   "all" or undefined: 合并lnext，prev元素
    function mergeList($list, dir) {
        var tag = $list.nodeName
        if (!dir) dir = "all";
        if ($list.previousSibling && $list.previousSibling.nodeName === tag && (dir === 'all' || dir === 'prev')) {
            $list = _mergeList($list.previousSibling, $list)
        }
        if ($list.nextSibling && $list.nextSibling.nodeName === tag && (dir === 'all' || dir === 'next')) {
            _mergeList($list, $list.nextSibling)
        }
        return $list
    }
  var Range = function(editor) {
      this.sel = window.getSelection ? window.getSelection() : document.getSelection()
      this.range = (this.sel && this.sel.rangeCount) ? this.sel.getRangeAt(0) : null
      this.editor = editor
      this.range !== null ? (this.collapsed = this.range.collapsed) : undefined
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
      // call this function, the range.save() should be called before
      // after range.save
      removeChild: function(parent, child, nchild) {
          if (this._start && this._start === child) {
              this._start = nchild
          }
          if (this._end && this._end === child) {
              this._end = nchild
          }
          parent.removeChild(child)
      },

      breakList: function($list, $li) {
          var $p, $nList,
              $start,
              $next,
              $insertPos = $list.nextSibling,
              liPrev = 0,
              liAfter = 0,
              converted = false;
          for ($start = $list.firstChild; $start; ) {
              $next = $start.nextSibling
              if ($li === $start) {
                  $p = transformTo($li, 'p')
                  this.removeChild($list, $li, $p)
                  if (liPrev > 0) {
                      $list.parentNode.insertBefore($p, $insertPos)
                  } else {
                      // 这是第一个li
                      $list.parentNode.insertBefore($p, $list)
                      return
                  }
                  converted = true
              } else {
                  if (converted) {
                      if (liAfter === 0) {
                          $nList = document.createElement($list.nodeName)
                      }
                      $nList.appendChild($start)
                  } else {
                      liPrev ++;
                  }
              }
              $start = $next
          }
          if (liAfter) {
              $list.parentNode.insertBefore($nList, $insertPos)
          }
      },
      // list
      // 只有开始元素与结束元素的父节点相同时，才做进一步的处理
      //
      // 1 range不为collapsed的情况：
      //    从当前元素开始处理，直到该元素的同级元素处理完，向上处理，直到range的end元素及end branch元素
      //
      convertToList: function(ntag) {
          var $start,
              tag,
              $first,
              $last,
              $next,
              $insertPos,
              $nList,
              $li,
              $parent;
          if (!this.range) return;
          $first = this.editor.travelUntilTags(this.range.startContainer, ['p', 'li'])
          $last = this.editor.travelUntilTags(this.range.endContainer, ['p', 'li'])

          $parent = $first.parentNode
          if (this.collapsed) {
              tag = nodename($parent)
              $nList = document.createElement(ntag)
              this.save()
              if (tag === 'ol' || tag === 'ul') {
                  // break list
                  this.breakList($first.parentNode, $first)
              } else if (nodename($first) === 'p'){
                  $li = transformTo($first, 'li', false)
                  $nList.appendChild($li)
                  $parent.insertBefore($nList, $first)
                  this.removeChild($parent, $first, $li)
              }
              this.restore()
              return
          }

          // 如果选中的是一整个ul或ol, 将对整个这个元素进行变换
          tag = nodename($parent)
          if ((tag === 'ul' || tag === 'ol') && $first.parentNode === $last.parentNode && $first === $parent.firstChild && $last === $parent.lastChild) {
              var $p,
                  $ancient = $parent.parentNode
              this.save()
              if (tag === ntag) {
                  // 移除parent, 变成p
                  $insertPos = $parent.nextSibling
                  for ($start = $first; $start; ) {
                    $next = $start.nextSibling
                    $p = transformTo($start, 'p')
                    $ancient.insertBefore($p, $insertPos)
                    $start = $next
                  }
                  $ancient.removeChild($parent)
              } else {
                  // 变成ntag
                  $nList = transformTo($parent, ntag, true)
              }
              this.restore()
              return
          }

          // 将所有选中的元素，尽最大的可能合并为一个list

          // 如果选中开始元素是父元素的第一个元素，且选中元素为li，或父元素为blockquote，则选中区域上升为其父节点
          if ( $first === $parent.firstChild ) {
              (nodename($first) === 'li' || nodename($parent) === 'blockquote') && ($first = $parent);
          }
          $parent = $last.parentNode
          if ($last === $parent.lastChild) {
              (nodename($last) === 'li' || nodename($parent) === 'blockquote') && ($last = $parent);
          }
          if ($first.parentNode !== $last.parentNode) {
              console.log("start node position not same with end node position, not handle it.", $first, $last)
              return
          }
          $nList = document.createElement(ntag)
          $parent = $first.parentNode
          $insertPos = $last.nextSibling
          var childCount = 0
          this.save()
          for ($start = $first; $start != $insertPos; ) {
              tag = nodename($start)
              $next = $start.nextSibling
              if (tag === 'p') {
                  $li = transformTo($start, 'li', false)
                  $nList.appendChild($li)
                  this.removeChild($parent, $start, $li)
                  childCount ++
              } else if (tag === 'ol' || tag === 'ul') {
                  var $child,
                      $nextChild
                  for ($child = $start.firstChild; $child; ) {
                      $nextChild = $child.nextSibling
                      $nList.appendChild($child)
                      childCount ++
                      $child = $child.nextSibling
                  }
                  this.removeChild($parent, $start, $li)
              } else {
                  if (childCount > 0) {
                      // close the list, create a new list
                      $parent.insertBefore($nList, $start)
                      $nList = document.createElement(ntag)
                      childCount = 0
                  }
              }
              $start = $next
          }
          if (childCount) {
              $parent.insertBefore($nList, $insertPos)
          } else {
              //document.removeChild($nList)
          }
          this.restore()
      },
      // 将blockquote的子元素元素变为list
      convertQuoteToList: function($quote, ntag) {
          var $nList = document.createElement(ntag)
          // quote下的元素为已经是ntag，且只有这一个元素，移除该list
          if (nodename($quote.firstChild) === ntag && $quote.firstChild === $quote.lastChild) {
              var $list = $quote.firstChild,
                  $el,
                  $next
              for ($el = $list.firstChild; $el; ) {
                  $next = $el.nextSibling
                  $nList.appendChild($el)
                  $el = $next
              }
              $quote.removeChild($quote.firstChild)
              $quote.appendChild($nList)
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
      range.save()
      range.doCommand('p', function($el) {
        console.log('text button docommand:', $el, cmd)
        var tag = $el.nodeName
          if (tag === cmd) return $el;
          return transformTo($el, cmd, true)
      })
      range.restore()
      this.editor.cursorPos()
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
            editor.$body.insertBefore($hr, editor.$currentEl.nextSibling)

            editor.$body.focus()}
    })
    Button.extend(Button(), {
        name: 'indent',
        icon: 'fa fa-indent',
        title: '向右缩进 ( Tab ) ',
        tag: 'indent',
        typ: 'custom',
        exec: function() {
            var $el, $start, $end,
                tag,
                indent,
                range = new Range(this.editor)
            if (!range.range) return;
            $start = this.editor.travelUntilTop(range.range, 0)
            $end = this.editor.travelUntilTop(range.range, 1)
            for ($el = $start; $el !== $end.nextSibling; $el = $el.nextSibling) {
                tag = nodename($el)
                if (tag === 'p') {
                    indent = $el.getAttribute("data-indent")
                    if (indent === 0 || indent === '0' || !indent) {
                        $el.setAttribute('data-indent', 1)
                    } else {
                        $el.setAttribute('data-indent', (+indent) + 1)
                    }
                } else if (tag === 'ul' || tag === 'ol') {
                    var $startLi,
                        $endLi,
                        $parentList,
                        tag,
                        $nList,
                        $el,
                        $next,
                        $last;

                    $startLi = this.editor.travelUntilTag(range.range.startContainer, 'li')
                    $endLi = this.editor.travelUntilTag(range.range.endContainer, 'li')
                    // 简化操作，只有当开始节点月结束节点的父节点相同时，才处理
                    if ($startLi.parentNode !== $endLi.parentNode) {
                        return
                    }
                    $parentList = $startLi.parentNode
                    if ($startLi === $parentList.firstChild) {
                        // 第一个元素
                        return
                    }
                    // 保存光标
                    tag = nodename($parentList)
                    $nList = document.createElement(tag)
                    range.save()
                    for ($el = $startLi, $last = $endLi.nextSibling; $el !== $last; ) {
                        $next = $el.nextSibling
                        $nList.appendChild($el)
                        $el = $next
                    }
                    $parentList.insertBefore($nList, $last)
                    // 恢复光标
                    range.restore()
                }
            }
        }
    })
    Button.extend(Button(), {
        name: 'outdent',
        icon: 'fa fa-outdent',
        title: '向左缩进 ( Shift + Tab ) ',
        tag: 'outdent',
        typ: 'custom',
        exec: function() {
            var $el, $start, $end,
                tag,
                indent,
                range = new Range(this.editor)
            if (!range.range) return;
            $start = this.editor.travelUntilTop(range.range, 0)
            $end = this.editor.travelUntilTop(range.range, 1)
            for ($el = $start; $el !== $end.nextSibling; $el = $el.nextSibling) {
                tag = nodename($el)
                if (tag === 'p') {
                    indent = $el.getAttribute("data-indent")
                    if (indent === 0 || indent === '0' || !indent) {
                        return
                    } else {
                        $el.setAttribute('data-indent', (+indent) - 1)
                    }
                } else if (tag === 'ul' || tag === 'ol') {
                }
            }
        }
    })

    Button.extend(Button(), {
        name: 'quote',
        icon: 'fa fa-quote-left',
        title: '引用',
        tag: 'blockquote',
        typ: 'custom',
        exec: function() {
            var $quote, $start, $end, range = new Range(this.editor),
                $el, $tmpEle, $insertEl,
                active = false,
                children = 0;
            range.save()
            $start = this.editor.travelUntilTop(range.range, 0)
            $end = this.editor.travelUntilTop(range.range, 1)
            $insertEl = $end.nextSibling
            $quote = document.createElement('blockquote')
            for ($el = $start; $el !== $insertEl; ) {
                $tmpEle = $el.nextSibling
                if ($el.nodeName.toLowerCase() === 'blockquote') {
                    var child, nextChild;
                    for (child = $el.firstChild; child; ) {
                        nextChild = child.nextSibling
                        this.editor.$body.insertBefore(child, $tmpEle)
                        child = nextChild
                    }
                    this.editor.$body.removeChild($el)
                } else {
                    $quote.appendChild($el)
                    active = true
                    children ++
                }
                $el = $tmpEle
            }
            if (children) {
                this.editor.$body.insertBefore($quote, $insertEl)
            }
            range.restore()
            this.updateStatus(active)
        },
        updateStatus: function(active) {
            if (active === true || active === false) {
                active ? this.$a.classList.add('active') : this.$a.classList.remove('active')
                return
            }
            var range = new Range(this.editor)
            if (range.collapsed === false || !range.range) return;
            var $start = this.editor.travelUntilTop(range.range, 0);
            ($start.nodeName.toLowerCase() === 'blockquote') ? this.$a.classList.add('active') : this.$a.classList.remove('active')
        }
    })

    // this should be ol or ul
    function execList() {
        var range = new Range(this.editor)
        console.log("range start:", range.range.startContainer, range.range.startOffset)
        console.log("range end:", range.range.endContainer, range.range.endOffset)

        range.convertToList(this.tag)
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
     travelUntil: function($start, cb) {
         while($start !== this.$body.parentNode) {
             if (cb($start) === true) {
                 return $start;
             }
             $start = $start.parentNode
         }
         return null
    },
      travelUntilTag: function($start, tag) {
          return this.travelUntil($start, function($el) {
              if ($el.nodeName.toLowerCase() === tag) return true
          })
      },
      travelUntilTags: function($start, tagArray) {
          return this.travelUntil($start, function($el) {
              var tag = $el.nodeName.toLowerCase()
              if (tagArray.indexOf(tag) !== -1) return true
          })
      },
      // isEnd === 0: start
      // isEnd === 1: end
      travelUntilTop: function(range, isEnd) {
          var self = this,
              $node,
              offset;
          isEnd ? $node = range.endContainer : $node = range.startContainer;
          isEnd ? offset = range.endOffset : offset = range.startOffset;
          if ($node === this.$body) {
              return this.topLevelEle($node, offset)
          }
          return this.travelUntil($node, function($el) {
              if ($el.parentNode === self.$body) return true
          })
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
        this.cursorPos(event)
        if (this.upShortCuts[event.which]) {
            this.upShortCuts[event.which].call(this, event)
        }
    },
      // 移除末尾的空p
      removeTail: function() {
          var $p = this.$body.lastChild
          if ($p.nodeName.toLowerCase() === 'p' && $p.innerText === '') {
              this.$body.removeChild($p)
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
      topLevelEle: function($node, offset) {
          var $el;

          if (offset === this.$body.children.length) {
              this.$currentEl = this.$body.lastChild
              console.log(this.$currentEl)
              return this.$body.lastChild
          }
          $el = this.$body.firstChild
          for (var i = 0; i < this.$body.children.length; i ++, $el = $el.nextSibling){
              // 用于光标在table结尾的情况, 此时如果下一个元素也是table，则无法判别当前光标在上一个table还是下一个table
              // guotie 2014-09-03
              if (i === offset - 1 && $el.nodeName.toLowerCase() !== 'table' && $el.previousSibling && $el.previousSibling.nodeName.toLowerCase() === 'table') {
                  this.$currentEl = $el.previousSibling
              }
              if (i === offset) {
                  this.$currentEl = $el;
                  console.log($el)
                  return $el
              }
          }
          throw "Not found cursor position over range."
          return null
      },
      // 获得输入光标的当前位置
      cursorPos: function(event) {
          var sel = window.getSelection(),
              range = sel.getRangeAt(0),
              $el = range.startContainer,
              offset = range.startOffset,
              $parent;

          // mostly, this will at a table div or hr
          if ($el === this.$body) {
              return this.topLevelEle($el, offset)
          }
          $parent = $el.parentNode
          console.log("cursorPos: ", range.startContainer, range.startOffset)
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
