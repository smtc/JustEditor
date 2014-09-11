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

  browser.createEmptyP = function($parent, $beforeEl, active) {
      var cursor = true,
        args = slice.call(arguments, 1),
        $p = document.createElement("p");

      if (args.length === 1) {
          if (args[0] === true || args[0] === false) {
              cursor = args[0]
          }
      } else if (args.length === 2){
          cursor = args[1]
      }

      // chrome浏览器中, p元素至少要有一个元素, range才能setStart成功
      $p.innerHTML = browser.pbr

      if ($beforeEl) {
          $parent.insertBefore($p, $beforeEl)
      } else {
          $parent.appendChild($p)
      }
      if (cursor) {
          var sel = window.getSelection(),
              range = sel.getRangeAt(0)
          if (!sel || !sel.rangeCount) {
              console.log('selection is null or no range!', sel)
              return
          }
          // range设置为$p的第一个节点
          range.setStart($p, 0)
          // range collapse在开头位置
          range.collapse(true);
          // range加入到sel中
          sel.removeAllRanges();
          sel.addRange(range);
      }

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

        //console.log("tranformTo:", $parent, $oel, $oel.parentNode)
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
      // range.collapsed should not handle in this function
      // root 应该是editor.$body.parentNode
      // 返回所有的叶子节点
      getRangeAllNodes: function(root, filterFn) {
          if (!this.range) return null;

          var start = this.range.startContainer,
              end = this.range.endContainer,
              result = {
                  start: null, // 开始的不完整节点
                  nodes: [],   // 中间的完整节点
                  end: null    // 末尾的不完整节点
              }

          console.log("getRangeAllNodes: ", this.range, this.range.startContainer, start, end)

          // 找到最左边的叶子节点
          function leafNode(_ele) {
              var _child = _ele.firstChild
              while(_child) {
                  _ele = _child
                  _child = _ele.firstChild
              }
              return _ele
          }
          // 查找下一个节点
          // 首先，取该节点的nextSibling，如果不为空，取其最左边的叶子节点
          // 如果为空, 取其父节点的nextSibling的第一个叶子节点, 如此递归向上,
          // 直到到达根节点
          function nextNode(_ele) {
              while(_ele.parentNode !== root) {
                  if(_ele.nextSibling) {
                      var _res = _ele.nextSibling, _child = _res.firstChild
                      while(_child) {
                          _res = _child
                          _child = _child.firstChild
                      }
                      return _res
                  }
                  _ele = _ele.parentNode
              }
              // 到达根节点
              console.log("Warning: nextNode return null!!!")
              return null
          }

          // start节点和end节点都是叶子节点
          //
          // 数组中的顺序为：先叶子节点，然后父节点....
          function travsel(_start, _end) {
              console.log("travsel start:", _start)
              console.log("travsel end: ", _end)
              //if ((result.end && _start !== result.end.endContainer) || !result.end)
              //  result.nodes.push(_start)
              var _node
              for(_node = _start; _node && _node != _end; _node = nextNode(_node)) {
                  result.nodes.push(_node)
              }
          }

          if (this.range.startContainer === this.range.endContainer ) {
              if (!this.range.startContainer.hasChildNodes()) {
                  result.start = {}
                  result.start.startContainer = this.range.startContainer
                  result.start.startOffset = this.range.startOffset
                  result.start.endContainer = this.range.endContainer
                  result.start.endOffset = this.range.endOffset
              } else {
                  // 将所有的子节点push到nodes中去
                  start = leafNode(this.range.startContainer[this.range.startOffset])
                  end = nextNode(this.range.endContainer[this.range.endOffset - 1])
                  travsel(start, end)
              }
              return result
          }

          // 开始节点与结束节点不同的情况

          // 定位开始节点
          start = this.range.startContainer
          console.log("before compute start node: ", start, this.range.startOffset)
          if (start.hasChildNodes()) {
              start = leafNode(start.childNodes[this.range.startOffset])
          } else {
              if (this.range.startOffset !== 0) {
                  // 开始节点应该不完整的textNode
                  result.start = {}
                  result.start.startContainer = result.start.endContainer = start
                  result.start.startOffset = this.range.startOffset
                  result.start.endOffset = start.length
                  // 重新设置开始节点
                  start = nextNode(this.range.startContainer)
              }
          }
          console.log("compute start node: ", start)

          // 定位结束节点
          end = this.range.endContainer
          console.log("before compute end node: ", end, this.range.endOffset)
          if (end.hasChildNodes()) {
              end = nextNode(end.childNodes[this.range.endOffset === 0 ? 0 : this.range.endOffset - 1])
          } else {
              if (this.range.endOffset !== end.length) {
                  // 结束节点不完整
                  result.end = {}
                  result.end.startContainer = result.end.endContainer = end
                  result.end.startOffset = 0
                  result.end.endOffset = this.range.endOffset
                  //end = nextNode(end)
              } else {
              // 重新设置结束节点
                end = nextNode(end)
              }
              console.log("end node: ", end)
          }
          console.log("compute end node: ", end)
          travsel(start, end)

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
          console.log(nodes)
          for (var i = 0; i < nodes.length; i++) {
             nd = nodes[i];
             (nodetag === 'p' && this.editor.$currentEl === nd) ? (this.editor.$currentEl = fn.call(this, nd)) : fn.call(this, nd)
          }
      },

      breakList: function($list, $li, tag) {
          var $p,
              $el,
              $ntagList,
              $nList,
              $start,
              $next,
              $insertPos = $list.nextSibling,
              liPrev = 0,
              liAfter = 0,
              converted = false;

          if (tag) $ntagList = document.createElement(tag)
          for ($start = $list.firstChild; $start; ) {
              $next = $start.nextSibling
              if ($li === $start) {
                  if (!tag) {
                      $p = transformTo($li, 'p')
                      this.removeChild($list, $li, $p)
                      $el = $p
                  } else {
                      $ntagList.appendChild($li)
                      $el = $ntagList
                  }

                  if (liPrev > 0) {
                      $list.parentNode.insertBefore($el, $insertPos)
                  } else {
                      // 这是第一个li
                      $list.parentNode.insertBefore($el, $list)
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
                  this.breakList($first.parentNode, $first, tag === ntag ? null : ntag)
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
          if ((tag === 'ul' || tag === 'ol') && $first.parentNode === $last.parentNode
               && $first === $parent.firstChild && $last === $parent.lastChild) {
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
      // call this function, the range.save() should be called before
      // after range.save
      removeChild: function(parent, child, nchild, startOffset, endOffset) {
          if (this._start && this._start === child) {
              this._start = nchild;
              (startOffset !== undefined) && (this._startOffset = startOffset);
              console.log("reset startContainer to ", nchild, " , startOffset to ", startOffset)
          }
          if (this._end && this._end === child) {
              this._end = nchild;
              endOffset && (this._endOffset = endOffset);
              console.log("reset endContainer to ", nchild, " , endOffset to ", endOffset)

          }
          parent.removeChild(child)
      },
      setStart: function (_start, _offset) {
        _start && (this._start = _start);
        _offset && (this._startOffset = _offset);
      },
      setEnd: function(_end, _offset) {
        _end && (this._end = _end)
        _offset && (this._endOffset = _offset)
      },
      save: function() {
          if (!this.range) {
              throw "range.save: this.range is null!!!"
              return
          };
          if (this._start) return;
          this._start = this.range.startContainer
          this._startOffset = this.range.startOffset
          this._end = this.range.endContainer
          this._endOffset = this.range.endOffset
          console.log("range save: ", this._startOffset, this._endOffset)
          return this
      },
      restore: function(or) {
          var rg = or ? or : this
          console.log("restore: ", rg._start,rg._startOffset, rg._end, rg._endOffset)
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
        this.editor.resetStatus()
        if (this.typ === 'menu') {
            var $el = this.liClicked(event)
            if ($el === this.$el) {
                this.$el.classList.toggle('menu-on')
            } else {
                // hide menu
                this.$el.classList.remove('menu-on')
                // exec the command
                if (this.execMenuCmd) {
                  var cmd = $el.getAttribute('data-param')
                  this.range = new Range(this.editor)
                  this.range.save()
                  this.execMenuCmd(event, cmd)
                  this.range.restore()
                }
            }
        } else if (this.typ === 'basic') {
            this.command && document.execCommand(this.command, false)
            this.editor.fire('statusChange')
            this.updateStatus(event)
        } else {
            this.exec(event)
            this.editor.fire('statusChange')
        }
        this.editor.$body.focus()
        event.preventDefault()
        event.stopPropagation()
        return false
    },
    exec: function(event) { },
    // if active, set exclude button to disable
    // if not active, remove exclude button's disable.
    toggleExclude: function(active) {
        var i, exButton
        for (i = 0; i < this.editor.$buttons.length; i ++) {
            exButton = this.editor.$buttons[i]
            if (exButton.typ === 'basic') {
                document.queryCommandState(exButton.command) ? exButton.$a.classList.add('active') : exButton.$a.classList.remove('active');
            } else {
                exButton.$a.classList.contains('disabled') && exButton.$a.classList.remove('disabled')
            }
        }
        if (!this.$exclueBtns) return;
        console.log('toggle exclude: ', this.name, this.$exclueBtns)
        for (i = 0; i < this.$exclueBtns.length; i ++) {
            exButton = this.$exclueBtns[i]
            if (active) {
                exButton.$a.classList.add('disabled')
            } else {
                exButton.$a.classList.remove('disabled')
            }
        }
    },
    updateStatus: function(event) {
        if (this.typ === 'basic') {
            if (document.queryCommandState(this.command)) {
                this.$a.classList.add('active')
                this.toggleExclude(true)
            }
        } else {
            console.log(this.name, ' update status ', this.editor.$currentEl, nodename(this.editor.$currentEl))
            if (nodename(this.editor.$currentEl) === this.name) {
                this.$a.classList.add('active')
                this.toggleExclude(true)
            } else {
                this.$a.classList.remove('active')
                this.toggleExclude(false)
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
      var range = this.range
      range.save()
      range.doCommand('p', function($el) {
        var tag = $el.nodeName
          if (tag === cmd) return $el;
          return transformTo($el, cmd, true)
      })
      range.restore()
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
    var ColorTextButton = Button.extend(Button(), {
        name: 'color',
        icon: 'fa fa-font',
        title: '文字颜色',
        tag: '',
        typ: 'menu',
        exec: function() {},
        colorClick: function(event) {
            var rg = new Range(this.editor),
                color,
                $node;

            event.preventDefault();
            if (rg.collapsed) {
                // 进入color模式
                return;
            }
            color = event.target.getAttribute('data-color')
            console.log(rg.range.startContainer, rg.range.startOffset, rg.range.endContainer, rg.range.endOffset)
            //return document.execCommand('foreColor', false, color);

            function partialColor(_ele, clr) {
                var el = _ele.startContainer,
                    parent = el.parentNode,
                    ancient = parent.parentNode,
                    startPos = _ele.startOffset,
                    endPos = _ele.endOffset,
                    text,
                    span,
                    headText,
                    midText,
                    midSpan,
                    tailText

                if (el.nodeType !== 3) {
                    return;
                }

                console.log(el, typeof el)
                console.log(el.textContent, typeof el.textContent)
                text = el.textContent.split('')
                if (startPos !== 0) {
                    headText = text.slice(0, startPos).join('')
                }
                if (endPos !== el.length) {
                    tailText = text.slice(endPos, el.length).join('')
                }
                midText = text.slice(startPos, endPos).join('')

                if (nodename(parent) === 'span') {
                    if (clr) {
                        midSpan = document.createElement('span')
                        midSpan.setAttribute('style', 'color:' + clr + ';')
                        midSpan.innerText = midText
                    }
                    // break span
                    if (headText) {
                        parent.innerText = headText
                        ancient.insertBefore(clr ? midSpan : midText, parent.nextSibling)
                        if (tailText) {
                            span = document.createElement('span')
                            span.setAttribute('style', parent.setAttribute('style'))
                            span.innerText = tailText
                            ancient.insertBefore(span, clr ? midSpan.nextSibling : midText.nextSibling)
                        }
                    } else {
                        ancient.insertBefore(clr ? midSpan : midText, parent)
                        if (tailText) {
                            parent.innerText = tailText
                        } else {
                            rg.removeChild(ancient, parent, clr ? midSpan : midText, 0, clr ? 1 : midText.length)
                        }
                    }
                } else {
                    if (clr) {
                        // 增加span元素来实现color
                        span = document.createElement('span')
                        span.setAttribute('style', 'color:' + clr + ';')
                        span.innerText = midText
                        console.log(span.innerText)
                        headText && parent.insertBefore(document.createTextNode(headText), el);
                        parent.insertBefore(span, el)
                        tailText && parent.insertBefore(document.createTextNode(tailText), el);
                        rg.removeChild(parent, el, span, 0, 1)
                    }
                }
                return
            }
            function addColor($el, clr) {
                // 不需要break元素
                var parent = $el.parentNode,
                    ancient = parent.parentNode,
                    span = document.createElement('span')

                if (nodename(parent) === 'span') {
                    if (clr) {
                        parent.setAttribute('style', 'color:' + clr + ';')
                    } else {
                        // 移除span
                        ancient.insertBefore($el, parent)
                        rg.removeChild(ancient, parent, $el, 0, $el.length)
                    }
                } else {
                    // 增加颜色<span>
                    if (clr) {
                        span.setAttribute('style', 'color:' + clr + ';')
                        parent.insertBefore(span, $el)
                        span.appendChild($el)
                    }
                }
            }
            rg.save()
            var result = rg.getRangeAllNodes(this.editor.$body.parentNode)
            console.log("colro elements:", result)
            if (result.start) {
                partialColor(result.start, color)
            }

             for (var i = 0; i < result.nodes.length; i ++) {
                 $node = result.nodes[i]
                 addColor($node, color)
             }

            if (result.end) {
                partialColor(result.end, color)
            }
            rg.restore()
        },
        excludeButtons: []
    })

    var frontTextColors = ['#ef6559', '#e28b41', '#c8a732', '#209361', '#418caf', '#7071ac', '#aa8773', '#777777' ],
        backgroundColors = []
    ColorTextButton.prototype.renderMenu = function() {
        var $menuDiv = document.createElement('div'),
            $ul = document.createElement('ul'),
            $li, $a,
            self = this;
        $menuDiv.setAttribute('class', "toolbar-menu toolbar-menu-color")
        $ul.setAttribute('class', 'color-list')
        for( var i = 0; i <= frontTextColors.length; i ++) {
            $li = document.createElement('li')
            if (i !== frontTextColors.length) {
                $li.innerHTML = '<a href="javascript:;" class="font-color font-color-' +
                    i +
                    ' " data-color="' +
                    frontTextColors[i] +
                    '"></a>';
            } else {
                $li.innerHTML = '<li class="remove-color"><a href="javascript:;" class="link-remove-color">去掉颜色</a></li>';
            }
            $a = $li.firstChild
            $a.addEventListener('click', function(event) {
                self.colorClick.call(self, event)
            })
            $ul.appendChild($li)
        }

        $menuDiv.appendChild($ul)
        this.$el.appendChild($menuDiv)
    }

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
        excludeButtons: ["table"],
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
            this.editor.ensureTail()
            //this.updateStatus(active)
        },
        updateStatus: function(active) {
            if (active === true || active === false) {
                active ? this.$a.classList.add('active') : this.$a.classList.remove('active');
                this.toggleExclude(active)
                return
            }
            var range = new Range(this.editor)
            if (range.collapsed === false || !range.range) return;
            var $start = this.editor.travelUntilTop(range.range, 0);
            if ($start.nodeName.toLowerCase() === 'blockquote') {
                this.$a.classList.add('active')
                this.toggleExclude(true)
            } else {
                this.$a.classList.remove('active')
                this.toggleExclude(false)
            }
        }
    })

    // this should be ol or ul
    function execList() {
        var range = new Range(this.editor)
        console.log("execList: range start:", range.range.startContainer, range.range.startOffset)
        console.log("execList: range end:", range.range.endContainer, range.range.endOffset)

        range.convertToList(this.tag)
    }
    var OlButton = Button.extend(Button(), {
        name: 'ol',
        icon: 'fa fa-list-ol',
        title: '有序列表',
        tag: 'ol',
        typ: 'custom',
        excludeButtons: ["table"],
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
        excludeButtons: ["table"],
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

            var $tbody = document.createElement('tbody'),
                $tr,
                $td,
                $firstEl
            for(var i = 0; i < rows; i ++) {
                $tr = document.createElement('tr')
                for (var j = 0; j < cols; j++) {
                    $td = document.createElement('td')
                    $td.innerHTML = this.editor._browser.pbr
                    if (i === 0 && j === 0) $firstEl = $td;
                    $tr.appendChild($td)
                }
                $tbody.appendChild($tr)
            }
            $table.appendChild($tbody)
            vm.$body.insertBefore($table, vm.$currentEl.nextSibling)
            vm.ensureTail()
            sel.removeAllRanges()
            range.setStart($firstEl, 0)
            range.setEnd($firstEl, 0)
            sel.addRange(range)
        }
    })
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
      toolbars: ['title', 'bold', 'italic', 'underline', 'strike', 'color', 'sp', 'ol', 'ul', 'indent', 'outdent', 'quote', 'hr', 'sp', 'table']
  }
  /**
   *	JustEditor
   *
   *
   */
  var _editors = []
  var JustEditor = function(selector, options) {
    this.$buttons = []
    this.$buttonMaps = Object.create(null)
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
        var name, $toolbar, btn, i;
        for(i = 0; i < this.options.toolbars.length; i ++) {
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
            if (btn.name === 'title') {
                this.$buttonMaps['h4'] = this.$buttonMaps['h1'] = this.$buttonMaps['h2'] = this.$buttonMaps['h3'] = btn
            }
            if(btn.tag) this.$buttonMaps[btn.tag] = btn;
            if (btn.typ === 'menu') {
                this.$menuButtons.push(btn)
            }
        }
        // build exclude buttons
        for (i = 0; i < this.$buttons.length; i ++) {
            this.buildExcludeBtns(this.$buttons[i])
        }
    },
      // build exclude button array for every button
      buildExcludeBtns: function(btn) {
          if (btn.excludeButtons === undefined || btn.excludeButtons === null) return;
          var name, exbtn, found
          for (var i = 0; i < btn.excludeButtons.length; i++) {
              name = btn.excludeButtons[i]
              if (!buttons[name]) continue;
              found = false
              for (var j = 0; j < this.$buttons.length; j ++) {
                  exbtn = this.$buttons[j]
                  if (exbtn.name === name) {
                      btn.$exclueBtns.push(exbtn)
                      found = true
                      break
                  }
              }
              (!found)  &&   console.log("buildExcludeBtns: NOT found exclude button " + name + " for button " +  btn.name);
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
        this.cursorPos()
        var range = new Range(this.editor),
            el,
            name

        if (!range.range || !range.range.collapsed) {
            if (range.range.startContainer !== range.range.endContainer) return
        }
        this.basicStatus()
        for (el = range.range.startContainer; el !== this.$body; el = el.parentNode) {
            name = nodename(el)
            console.log('updateStatus: button: ', name)
            if (this.$buttonMaps[name]) {
                console.log("call button ", name, " update status")
                this.$buttonMaps[name].updateStatus(event)
            }
        }
    },
    basicStatus: function() {
        var tag, cmds = {'bold': 'b', 'italic':'i', 'underline': 'u', 'strikethrough': 'strike'}
        for ( var key in cmds ) {
            if (hasOwn.call(cmds, key)) {
                tag = cmds[key]
                document.queryCommandState(key) ? this.$buttonMaps[tag].$a.classList.add('active') : this.$buttonMaps[tag].$a.classList.remove('active');
            }
        }
    },
    resetStatus: function() {
        var btn
        for (var i = 0; i < this.$buttons.length; i ++) {
            btn = this.$buttons[i]
            btn.$a.classList.remove('active')
            btn.$a.classList.remove('disabled')
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
        var range = new Range(this)

        if (this.$body.innerHTML.trim() === '') {
            this._browser.createEmptyP(this.$body)
        }
        // 更新toolbar status
        this.resetStatus()
        this.updateStatus(event, range)
    },
    onKeydown: function(event) {
        //console.log('onKeydown')
        if (this.downShortCuts[event.which]) {
            this.downShortCuts[event.which].call(this, event)
        }
    },
    onKeyup: function(event) {
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
      ensureTail: function() {
          var $el = this.$body.lastChild
          if (nodename($el) !== 'p') {
              this._browser.createEmptyP(this.$body, false)
          }
      },
      keydownEnter: function(event) {    },
      keyupEnter: function(event) {
          console.log("key up enter")
          var statusChanged = false, i,
              cmds = ['bold', 'italic', 'underline', 'strikethrough']
          for (i = 0; i < cmds.length; i ++) {
              if (document.queryCommandState(cmds[i])) {
                  document.execCommand(cmds[i])
                  statusChanged = true
              }
          }
          statusChanged && this.updateStatus()
      },
      keyupDel: function(event) {
      },
      keyupBackspace: function(event) {
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
              if (i === offset - 1 && $el.nodeName.toLowerCase() !== 'table' && $el.previousSibling &&
                   $el.previousSibling.nodeName.toLowerCase() === 'table') {
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
          for (var j = 0; j < e.$menuButtons.length; j ++) {
              $menu = e.$menuButtons[j]
              $menu.$el.classList.remove('menu-on')
          }
      }
  })
}).call(this);
