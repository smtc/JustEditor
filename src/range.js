define(function() {
    var $startTop, $endTop,
        $startLi, $endLi,
        $startMg, $endMg,
        $allLi;
    if (!this.range) {
        throw "range is null"
        return
    }
    $startLi = this.editor.travelUntilTag(this.range.startContainer, 'li')
    if (this.range.collapsed) {
        // 只有一个元素的情况
        if (!$startLi) {
            $startTop = this.editor.$currentEl
            this.editor.$currentEl = $startTop = transformTo($startTop, ntag)
            mergeList($startTop)
        } else {
            var $parent = $startLi.parentNode
            if ($parent.nodeName.toLowerCase() === ntag) return;
            if ($parent === this.editor.$currentEl) {
                this.editor.$currentEl = convertLi($parent, $startLi, $startLi.nextSibling, ntag)
            } else {
                convertLi($parent, $startLi, $startLi.nextSibling, ntag)
            }
        }
        return
    }
    var $nList = document.createElement(ntag),
        $start = this.editor.travelUntilTags(this.range.startContainer, ['li', 'p']),
        $end = this.editor.travelUntilTags(this.range.endContainer, ['li', 'p']),
        $endBranch = [],
        tag,
        inList,
        liCount = 0,
        shouldMerge = false,
        closeList = false,
        $parentEle,
        $nextEle,
        $li,
        $el;

    // 把end元素到end元素的所有父元素都加入数组中
    for($el = $end; $el !== this.editor.$body; $el = $el.nextSibling) {
        $endBranch.push($el)
    }
    if( $start.previousSibling.nodeName.toLowerCase() === ntag) {
        shouldMerge = true;
    }
    // dir === 0: ele = ele.previousSibling
    // dir === 1: ele = ele.nextSibling
    function nextElement(el, root, dir) {
        var next;
        dir === 0 ? next = el.previousSibling : next = el.nextSibling;
        if (next) return next;
        for (next = el; (next.parentNode !== root) && (
            (dir === 0 && !next.previousNode) ||
            (dir === 1 && !next.nextSibling)
            ) ; ) {
            next = next.parentNode
        }
        dir === 0 ? next = next.previousSibling : next = next.nextSibling;
        return next
    }
    // 将一个不完整的$body的child变为list
    function toListFromLeaf($leaf, $root, dir) {
        var node, $nList, $li, $sibling,
            parent, nextEle, tag,
            liCnt;
        $nList = document.createElement(ntag)
        for (node = $leaf; node && node !== $root; ) {
            nextEle = nextElement(node, $root, dir)
            $sibling = dir === 0 ? node.previousSibling : node.nextSibling;
            parent = node.parentNode

            tag = node.nodeName.toLowerCase()
            if (tag === 'li') {
                dir === 0 ? $nList.insertBefore(node, $nList.firstChild) : $nList.appendChild(node);
                liCnt ++
                inList = true
            } else if (tag === 'p') {
                $li = transformTo(node, 'li')
                dir === 0 ? $nList.insertBefore(node, $nList.firstChild) : $nList.appendChild(node);
                liCount ++
            } else if (tag === 'ul' || tag === 'ol') {
                if (tag === ntag) {
                    // todo: remove ul or ol tag
                }
                var child, tmpChild
                for ( var child = $el.firstChild; child; ) {
                    tmpChild = child.nextSibling
                    $nList.appendChild(child)
                    liCount ++
                    child = tmpChild
                }
            } else if (tag === 'blockquote') {// 将 $nList 插入到blockquote元素之前
                if (liCount) {
                    $parent.insertBefore($nList, $el)
                    if (shouldMerge) {
                        mergeList($nList, 'prev')
                        shouldMerge = false
                    }
                }
            }
            if (!$sibling) {
                inList ? parent.parentNode.insertBefore($nList, parent.parentNode.nextSibling) :
                    (dir === 0 ? parent.insertBefore($nList, parent.firstChild) : parent.appendChild($nList));
            }
        }
    }
    $parentEle = $el.parentNode
    for ($el = $start; $el && ($endBranch.indexOf($el) === -1); ) {
        // 查找下一个元素
        $nextEle = $el.nextSibling
        if (!$nextEle) {
            // list需要闭合
            closeList = true
            $nextEle = $el
            for (; ($nextEle.parentNode != this.editor.$body) && (!$nextEle.nextSibling); ) {
                $nextEle = $nextEle.parentNode
            }
            $nextEle = $nextEle.nextSibling
        }
        tag = $el.nodeName.toLowerCase()
        if (tag === 'li') {
            $nList.appendChild($el)
            liCount ++
            inList = true
        } else if (tag === 'p') {
            $li = transformTo($el, 'li')
            $nList.appendChild($li)
            liCount ++
        } else if (tag === 'ul' || tag === 'ol') {
            var child, tmpChild
            for ( var child = $el.firstChild; child; ) {
                tmpChild = child.nextSibling
                $nList.appendChild(child)
                liCount ++
                child = tmpChild
            }
        } else if (tag === 'blockquote') {
            // 将 $nList 插入到blockquote元素之前
            if (liCount) {
                $parent.insertBefore($nList, $el)
                if (shouldMerge) {
                    mergeList($nList, 'prev')
                    shouldMerge = false
                }
            }
            // 将引用里面的所有数据加入到一个独立的list中
            convertLi($el, $el.firstChild, null, ntag)
            // 新建一个list
            if (liCount) {
                $nList = document.createElement(ntag)
                liCount = 0
            }
        }

        // 如果list需要关闭的话
        if (closeList && liCount) {
            inList ? $parentEle.parentNode.insertBefore($nList, $parentEle.nextSibling) : $parentEle.insertBefore($nList, $nextEle)
            if (shouldMerge) {
                mergeList($nList, 'prev')
                shouldMerge = false
            }
            $nList = document.createElement(ntag)
            closeList = false
            liCount = 0
        }
        // 循环下一个元素或上层元素
        $el = $nextEle
    }
    // 剩余的element
    if ($el) {
        var index = $endBranch.indexOf($el)
        if (index === -1) {
            throw "element NOT in end branch elements"
            return
        }
    }

})
