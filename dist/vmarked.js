(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global.vmarked = factory());
}(this, (function () { 'use strict';

    /**
     * Helpers
     */

    function escape$1(html, encode) {
        return html
            .replace(!encode ? /&(?!#?\w+;)/g : /&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function edit(regex, opt) {
        regex = regex.source || regex;
        opt = opt || '';
        return {
            replace: function(name, val) {
                val = val.source || val;
                val = val.replace(/(^|[^\[])\^/g, '$1');
                regex = regex.replace(name, val);
                return this;
            },
            getRegex: function() {
                return new RegExp(regex, opt);
            }
        };
    }

    function noop() {}
    noop.exec = noop;

    function merge(obj) {
        var i = 1,
            target,
            key;

        for (; i < arguments.length; i++) {
            target = arguments[i];
            for (key in target) {
                if (Object.prototype.hasOwnProperty.call(target, key)) {
                    obj[key] = target[key];
                }
            }
        }

        return obj;
    }

    function splitCells(tableRow, count) {
        // ensure that every cell-delimiting pipe has a space
        // before it to distinguish it from an escaped pipe
        var row = tableRow.replace(/\|/g, function (match, offset, str) {
                var escaped = false,
                    curr = offset;
                while (--curr >= 0 && str[curr] === '\\') escaped = !escaped;
                if (escaped) {
                    // odd number of slashes means | is escaped
                    // so we leave it alone
                    return '|';
                } else {
                    // add space before unescaped |
                    return ' |';
                }
            }),
            cells = row.split(/ \|/),
            i = 0;

        if (cells.length > count) {
            cells.splice(count);
        } else {
            while (cells.length < count) cells.push('');
        }

        for (; i < cells.length; i++) {
            // leading or trailing whitespace is ignored per the gfm spec
            cells[i] = cells[i].trim().replace(/\\\|/g, '|');
        }
        return cells;
    }

    // Remove trailing 'c's. Equivalent to str.replace(/c*$/, '').
    // /c*$/ is vulnerable to REDOS.
    // invert: Remove suffix of non-c chars instead. Default falsey.
    function rtrim(str, c, invert) {
        if (str.length === 0) {
            return '';
        }

        // Length of suffix matching the invert condition.
        var suffLen = 0;

        // Step left until we fail to match the invert condition.
        while (suffLen < str.length) {
            var currChar = str.charAt(str.length - suffLen - 1);
            if (currChar === c && !invert) {
                suffLen++;
            } else if (currChar !== c && invert) {
                suffLen++;
            } else {
                break;
            }
        }

        return str.substr(0, str.length - suffLen);
    }


    var isArray = Array.isArray || function (val) {
        return !! val && '[object Array]' === Object.prototype.toString.call(val);
    };

    /**
     * Block-Level Grammar
     */

    var block = {
        newline: /^\n+/,
        code: /^( {4}[^\n]+\n*)+/,
        fences: noop,
        hr: /^ {0,3}((?:- *){3,}|(?:_ *){3,}|(?:\* *){3,})(?:\n+|$)/,
        heading: /^ *(#{1,6}) *([^\n]+?) *(?:#+ *)?(?:\n+|$)/,
        nptable: noop,
        blockquote: /^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/,
        list: /^( *)(bull) [\s\S]+?(?:hr|def|\n{2,}(?! )(?!\1bull )\n*|\s*$)/,
        html: '^ {0,3}(?:' // optional indentation
            + '<(script|pre|style)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)' // (1)
            + '|comment[^\\n]*(\\n+|$)' // (2)
            + '|<\\?[\\s\\S]*?\\?>\\n*' // (3)
            + '|<![A-Z][\\s\\S]*?>\\n*' // (4)
            + '|<!\\[CDATA\\[[\\s\\S]*?\\]\\]>\\n*' // (5)
            + '|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:\\n{2,}|$)' // (6)
            + '|<(?!script|pre|style)([a-z][\\w-]*)(?:attribute)*? */?>(?=\\h*\\n)[\\s\\S]*?(?:\\n{2,}|$)' // (7) open tag
            + '|</(?!script|pre|style)[a-z][\\w-]*\\s*>(?=\\h*\\n)[\\s\\S]*?(?:\\n{2,}|$)' // (7) closing tag
            + ')',
        def: /^ {0,3}\[(label)\]: *\n? *<?([^\s>]+)>?(?:(?: +\n? *| *\n *)(title))? *(?:\n+|$)/,
        table: noop,
        lheading: /^([^\n]+)\n *(=|-){2,} *(?:\n+|$)/,
        paragraph: /^([^\n]+(?:\n(?!hr|heading|lheading| {0,3}>|<\/?(?:tag)(?: +|\n|\/?>)|<(?:script|pre|style|!--))[^\n]+)*)/,
        text: /^[^\n]+/
    };

    block._label = /(?!\s*\])(?:\\[\[\]]|[^\[\]])+/;
    block._title = /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/;
    block.def = edit(block.def)
        .replace('label', block._label)
        .replace('title', block._title)
        .getRegex();

    block.bullet = /(?:[*+-]|\d+\.)/;
    block.item = /^( *)(bull) [^\n]*(?:\n(?!\1bull )[^\n]*)*/;
    block.item = edit(block.item, 'gm')
        .replace(/bull/g, block.bullet)
        .getRegex();

    block.list = edit(block.list)
        .replace(/bull/g, block.bullet)
        .replace('hr', '\\n+(?=\\1?(?:(?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$))')
        .replace('def', '\\n+(?=' + block.def.source + ')')
        .getRegex();

    block._tag = 'address|article|aside|base|basefont|blockquote|body|caption'
        + '|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption'
        + '|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe'
        + '|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option'
        + '|p|param|section|source|summary|table|tbody|td|tfoot|th|thead|title|tr'
        + '|track|ul';
    block._comment = /<!--(?!-?>)[\s\S]*?-->/;
    block.html = edit(block.html, 'i')
        .replace('comment', block._comment)
        .replace('tag', block._tag)
        .replace('attribute', / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/)
        .getRegex();

    block.paragraph = edit(block.paragraph)
        .replace('hr', block.hr)
        .replace('heading', block.heading)
        .replace('lheading', block.lheading)
        .replace('tag', block._tag) // pars can be interrupted by type (6) html blocks
        .getRegex();

    block.blockquote = edit(block.blockquote)
        .replace('paragraph', block.paragraph)
        .getRegex();

    /**
     * Normal Block Grammar
     */

    block.normal = merge({}, block);

    /**
     * GFM Block Grammar
     */

    block.gfm = merge({}, block.normal, {
        fences: /^ *(`{3,}|~{3,})[ \.]*(\S+)? *\n([\s\S]*?)\n? *\1 *(?:\n+|$)/,
        paragraph: /^/,
        heading: /^ *(#{1,6}) +([^\n]+?) *#* *(?:\n+|$)/
    });

    block.gfm.paragraph = edit(block.paragraph)
        .replace('(?!', '(?!'
            + block.gfm.fences.source.replace('\\1', '\\2') + '|'
            + block.list.source.replace('\\1', '\\3') + '|')
        .getRegex();

    /**
     * GFM + Tables Block Grammar
     */

    block.tables = merge({}, block.gfm, {
        nptable: /^ *([^|\n ].*\|.*)\n *([-:]+ *\|[-| :]*)(?:\n((?:.*[^>\n ].*(?:\n|$))*)\n*|$)/,
        table: /^ *\|(.+)\n *\|?( *[-:]+[-| :]*)(?:\n((?: *[^>\n ].*(?:\n|$))*)\n*|$)/
    });

    /**
     * Pedantic grammar
     */

    block.pedantic = merge({}, block.normal, {
        html: edit(
            '^ *(?:comment *(?:\\n|\\s*$)'
            + '|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)' // closed tag
            + '|<tag(?:"[^"]*"|\'[^\']*\'|\\s[^\'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))')
            .replace('comment', block._comment)
            .replace(/tag/g, '(?!(?:'
                + 'a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub'
                + '|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)'
                + '\\b)\\w+(?!:|[^\\w\\s@]*@)\\b')
            .getRegex(),
        def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/
    });

    function vnode(sel, data, children, text, elm) {
        var key = data === undefined ? undefined : data.key;
        return {
            tag: sel,
            children: children,
            key: key,
            text: text,
            data: data,
        };
    }

    function primitive(s) {
        return typeof s === 'string' || typeof s === 'number';
    }

    var is = {
        primitive: primitive,
        array: Array.isArray
    };

    function addNS(data, children, sel) {
        data.ns = 'http://www.w3.org/2000/svg';
        if (sel !== 'foreignObject' && children !== undefined) {
            for (var i = 0; i < children.length; ++i) {
                var childData = children[i].data;
                if (childData !== undefined) {
                    addNS(childData, children[i].children, children[i].sel);
                }
            }
        }
    }

    function h(sel, b, c) {
        var data = {}, children, text, i;
        if (c !== undefined) {
            data = b;
            if (is.array(c)) {
                children = c;
            }
            else if (is.primitive(c)) {
                text = c;
            }
            else if (c && c.sel) {
                children = [c];
            }
        }
        else if (b !== undefined) {
            if (is.array(b)) {
                children = b;
            }
            else if (is.primitive(b)) {
                text = b;
            }
            else if (b && b.sel) {
                children = [b];
            }
            else {
                data = b;
            }
        }
        if (is.array(children)) {
            for (i = 0; i < children.length; ++i) {
                if (is.primitive(children[i]))
                    children[i] = vnode(undefined, undefined, undefined, children[i]);
            }
        }
        if (sel[0] === 's' && sel[1] === 'v' && sel[2] === 'g' &&
            (sel.length === 3 || sel[3] === '.' || sel[3] === '#')) {
            addNS(data, children, sel);
        }
        return vnode(sel, data, children, text, undefined);
    }

    var defaults = {
        baseUrl: null,
        breaks: false,
        gfm: true,
        headerIds: true,
        headerPrefix: '',
        highlight: null,
        langPrefix: 'language-',
        mangle: true,
        pedantic: false,
        sanitize: false,
        sanitizer: null,
        silent: false,
        smartLists: false,
        smartypants: false,
        tables: true,
        xhtml: false,
        h: h
    };

    /**
     * Block Lexer
     */

    function Lexer(options) {
        this.tokens = [];
        this.tokens.links = Object.create(null);
        this.options = options || defaults;
        this.rules = block.normal;

        if (this.options.pedantic) {
            this.rules = block.pedantic;
        } else if (this.options.gfm) {
            if (this.options.tables) {
                this.rules = block.tables;
            } else {
                this.rules = block.gfm;
            }
        }
    }

    /**
     * Expose Block Rules
     */

    Lexer.rules = block;

    /**
     * Static Lex Method
     */

    Lexer.lex = function(src, options) {
        var lexer = new Lexer(options);
        return lexer.lex(src);
    };

    /**
     * Preprocessing
     */

    Lexer.prototype.lex = function(src) {
        src = src
            .replace(/\r\n|\r/g, '\n')
            .replace(/\t/g, '    ')
            .replace(/\u00a0/g, ' ')
            .replace(/\u2424/g, '\n');

        return this.token(src, true);
    };

    /**
     * Lexing
     */

    Lexer.prototype.token = function(src, top) {
        src = src.replace(/^ +$/gm, '');
        var next,
            loose,
            cap,
            bull,
            b,
            item,
            listStart,
            listItems,
            t,
            space,
            i,
            tag,
            l,
            isordered,
            istask,
            ischecked;

        while (src) {
            // debugger

            // newline
            if (cap = this.rules.newline.exec(src)) {
                src = src.substring(cap[0].length);
                if (cap[0].length > 1) {
                    this.tokens.push({
                        type: 'space'
                    });
                }
            }

            // code
            if (cap = this.rules.code.exec(src)) {
                src = src.substring(cap[0].length);
                cap = cap[0].replace(/^ {4}/gm, '');
                this.tokens.push({
                    type: 'code',
                    text: !this.options.pedantic
                        ? rtrim(cap, '\n')
                        : cap
                });
                continue;
            }

            // fences (gfm)
            if (cap = this.rules.fences.exec(src)) {
                src = src.substring(cap[0].length);
                this.tokens.push({
                    type: 'code',
                    lang: cap[2],
                    text: cap[3] || ''
                });
                continue;
            }

            // heading
            if (cap = this.rules.heading.exec(src)) {
                src = src.substring(cap[0].length);
                this.tokens.push({
                    type: 'heading',
                    depth: cap[1].length,
                    text: cap[2]
                });
                continue;
            }

            // table no leading pipe (gfm)
            if (top && (cap = this.rules.nptable.exec(src))) {
                item = {
                    type: 'table',
                    header: splitCells(cap[1].replace(/^ *| *\| *$/g, '')),
                    align: cap[2].replace(/^ *|\| *$/g, '').split(/ *\| */),
                    cells: cap[3] ? cap[3].replace(/\n$/, '').split('\n') : []
                };

                if (item.header.length === item.align.length) {
                    src = src.substring(cap[0].length);

                    for (i = 0; i < item.align.length; i++) {
                        if (/^ *-+: *$/.test(item.align[i])) {
                            item.align[i] = 'right';
                        } else if (/^ *:-+: *$/.test(item.align[i])) {
                            item.align[i] = 'center';
                        } else if (/^ *:-+ *$/.test(item.align[i])) {
                            item.align[i] = 'left';
                        } else {
                            item.align[i] = null;
                        }
                    }

                    for (i = 0; i < item.cells.length; i++) {
                        item.cells[i] = splitCells(item.cells[i], item.header.length);
                    }

                    this.tokens.push(item);

                    continue;
                }
            }

            // hr
            if (cap = this.rules.hr.exec(src)) {
                src = src.substring(cap[0].length);
                this.tokens.push({
                    type: 'hr'
                });
                continue;
            }

            // blockquote
            if (cap = this.rules.blockquote.exec(src)) {
                src = src.substring(cap[0].length);

                this.tokens.push({
                    type: 'blockquote_start'
                });

                cap = cap[0].replace(/^ *> ?/gm, '');

                // Pass `top` to keep the current
                // "toplevel" state. This is exactly
                // how markdown.pl works.
                this.token(cap, top);

                this.tokens.push({
                    type: 'blockquote_end'
                });

                continue;
            }

            // list
            if (cap = this.rules.list.exec(src)) {
                src = src.substring(cap[0].length);
                bull = cap[2];
                isordered = bull.length > 1;

                listStart = {
                    type: 'list_start',
                    ordered: isordered,
                    start: isordered ? +bull : '',
                    loose: false
                };

                this.tokens.push(listStart);

                // Get each top-level item.
                cap = cap[0].match(this.rules.item);

                listItems = [];
                next = false;
                l = cap.length;
                i = 0;

                for (; i < l; i++) {
                    item = cap[i];

                    // Remove the list item's bullet
                    // so it is seen as the next token.
                    space = item.length;
                    item = item.replace(/^ *([*+-]|\d+\.) +/, '');

                    // Outdent whatever the
                    // list item contains. Hacky.
                    if (~item.indexOf('\n ')) {
                        space -= item.length;
                        item = !this.options.pedantic
                            ? item.replace(new RegExp('^ {1,' + space + '}', 'gm'), '')
                            : item.replace(/^ {1,4}/gm, '');
                    }

                    // Determine whether the next list item belongs here.
                    // Backpedal if it does not belong in this list.
                    if (this.options.smartLists && i !== l - 1) {
                        b = block.bullet.exec(cap[i + 1])[0];
                        if (bull !== b && !(bull.length > 1 && b.length > 1)) {
                            src = cap.slice(i + 1).join('\n') + src;
                            i = l - 1;
                        }
                    }

                    // Determine whether item is loose or not.
                    // Use: /(^|\n)(?! )[^\n]+\n\n(?!\s*$)/
                    // for discount behavior.
                    loose = next || /\n\n(?!\s*$)/.test(item);
                    if (i !== l - 1) {
                        next = item.charAt(item.length - 1) === '\n';
                        if (!loose) loose = next;
                    }

                    if (loose) {
                        listStart.loose = true;
                    }

                    // Check for task list items
                    istask = /^\[[ xX]\] /.test(item);
                    ischecked = undefined;
                    if (istask) {
                        ischecked = item[1] !== ' ';
                        item = item.replace(/^\[[ xX]\] +/, '');
                    }

                    t = {
                        type: 'list_item_start',
                        task: istask,
                        checked: ischecked,
                        loose: loose
                    };

                    listItems.push(t);
                    this.tokens.push(t);

                    // Recurse.
                    this.token(item, false);

                    this.tokens.push({
                        type: 'list_item_end'
                    });
                }

                if (listStart.loose) {
                    l = listItems.length;
                    i = 0;
                    for (; i < l; i++) {
                        listItems[i].loose = true;
                    }
                }

                this.tokens.push({
                    type: 'list_end'
                });

                continue;
            }

            // html
            if (cap = this.rules.html.exec(src)) {
                src = src.substring(cap[0].length);
                this.tokens.push({
                    type: this.options.sanitize
                        ? 'paragraph'
                        : 'html',
                    pre: !this.options.sanitizer
                    && (cap[1] === 'pre' || cap[1] === 'script' || cap[1] === 'style'),
                    text: cap[0]
                });
                continue;
            }

            // def
            if (top && (cap = this.rules.def.exec(src))) {
                src = src.substring(cap[0].length);
                if (cap[3]) cap[3] = cap[3].substring(1, cap[3].length - 1);
                tag = cap[1].toLowerCase().replace(/\s+/g, ' ');
                if (!this.tokens.links[tag]) {
                    this.tokens.links[tag] = {
                        href: cap[2],
                        title: cap[3]
                    };
                }
                continue;
            }

            // table (gfm)
            if (top && (cap = this.rules.table.exec(src))) {
                item = {
                    type: 'table',
                    header: splitCells(cap[1].replace(/^ *| *\| *$/g, '')),
                    align: cap[2].replace(/^ *|\| *$/g, '').split(/ *\| */),
                    cells: cap[3] ? cap[3].replace(/(?: *\| *)?\n$/, '').split('\n') : []
                };

                if (item.header.length === item.align.length) {
                    src = src.substring(cap[0].length);

                    for (i = 0; i < item.align.length; i++) {
                        if (/^ *-+: *$/.test(item.align[i])) {
                            item.align[i] = 'right';
                        } else if (/^ *:-+: *$/.test(item.align[i])) {
                            item.align[i] = 'center';
                        } else if (/^ *:-+ *$/.test(item.align[i])) {
                            item.align[i] = 'left';
                        } else {
                            item.align[i] = null;
                        }
                    }

                    for (i = 0; i < item.cells.length; i++) {
                        item.cells[i] = splitCells(
                            item.cells[i].replace(/^ *\| *| *\| *$/g, ''),
                            item.header.length);
                    }

                    this.tokens.push(item);

                    continue;
                }
            }

            // lheading
            if (cap = this.rules.lheading.exec(src)) {
                src = src.substring(cap[0].length);
                this.tokens.push({
                    type: 'heading',
                    depth: cap[2] === '=' ? 1 : 2,
                    text: cap[1]
                });
                continue;
            }

            // top-level paragraph
            if (top && (cap = this.rules.paragraph.exec(src))) {
                src = src.substring(cap[0].length);
                this.tokens.push({
                    type: 'paragraph',
                    text: cap[1].charAt(cap[1].length - 1) === '\n'
                        ? cap[1].slice(0, -1)
                        : cap[1]
                });
                continue;
            }

            // text
            if (cap = this.rules.text.exec(src)) {
                // Top-level should never reach here.
                src = src.substring(cap[0].length);
                this.tokens.push({
                    type: 'text',
                    text: cap[0]
                });
                continue;
            }

            if (src) {
                throw new Error('Infinite loop on byte: ' + src.charCodeAt(0));
            }
        }

        return this.tokens;
    };

    /*jshint -W030 */
    var parseTag = (function () {

        var attrRE = /([\w-]+)|['"]{1}([^'"]*)['"]{1}/g;

    // create optimized lookup object for
    // void elements as listed here:
    // http://www.w3.org/html/wg/drafts/html/master/syntax.html#void-elements
        var lookup = (Object.create) ? Object.create(null) : {};
        lookup.area = true;
        lookup.base = true;
        lookup.br = true;
        lookup.col = true;
        lookup.embed = true;
        lookup.hr = true;
        lookup.img = true;
        lookup.input = true;
        lookup.keygen = true;
        lookup.link = true;
        lookup.menuitem = true;
        lookup.meta = true;
        lookup.param = true;
        lookup.source = true;
        lookup.track = true;
        lookup.wbr = true;

        return function (tag) {
            var i = 0;
            var key;
            var res = {
                tag: '',
                type: 'tag',
                name: '',
                voidElement: false,
                attrs: {},
                data: {
                    attrs: {}
                },
                children: []
            };
            res.data.attrs = res.attrs;

            tag.replace(attrRE, function (match) {
                if (i % 2) {
                    key = match;
                } else {
                    if (i === 0) {
                        if (lookup[match] || tag.charAt(tag.length - 2) === '/') {
                            res.voidElement = true;
                        }
                        res.name = match;
                        res.tag = match;
                    } else {
                        res.attrs[key] = match.replace(/['"]/g, '');
                        // res.data.attrs[key] = match.replace(/['"]/g, '');
                    }
                }
                i++;
            });

            return res;
        };

    })();

    var tagRE = /<(?:"[^"]*"['"]*|'[^']*'['"]*|[^'">])+>/g;
    // re-used obj for quick lookups of components
    var empty = Object.create ? Object.create(null) : {};

    function parse(html, options) {
        options || (options = {});
        options.components || (options.components = empty);
        var result = [];
        var current;
        var level = -1;
        var arr = [];
        var byTag = {};
        var inComponent = false;

        html.replace(tagRE, function (tag, index) {
            if (inComponent) {
                if (tag !== ('</' + current.name + '>')) {
                    return;
                } else {
                    inComponent = false;
                }
            }
            var isOpen = tag.charAt(1) !== '/';
            var start = index + tag.length;
            var nextChar = html.charAt(start);
            var parent;

            if (isOpen) {
                level++;

                current = parseTag(tag);
                if (current.type === 'tag' && options.components[current.name]) {
                    current.type = 'component';
                    inComponent = true;
                }

                if (!current.voidElement && !inComponent && nextChar && nextChar !== '<') {
                    current.children.push({
                        type: 'text',
                        content: html.slice(start, html.indexOf('<', start)),
                        text: html.slice(start, html.indexOf('<', start))
                    });
                }

                byTag[current.tagName] = current;

                // if we're at root, push new base node
                if (level === 0) {
                    result.push(current);
                }

                parent = arr[level - 1];

                if (parent) {
                    parent.children.push(current);
                }

                arr[level] = current;
            }

            if (!isOpen || current.voidElement) {
                level--;
                if (!inComponent && nextChar !== '<' && nextChar) {

                    if(level>=0) {
                        // trailing text node
                        arr[level].children.push({
                            type: 'text',
                            content: html.slice(start, html.indexOf('<', start)),
                            text: html.slice(start, html.indexOf('<', start))
                        });
                    }

                }
            }
        });

        return result;
    }

    /**
     * Renderer
     */

    function Renderer$1(options) {
        this.options = options || defaults;
    }

    Renderer$1.prototype.code = function(code, lang, escaped) {
        // if (this.options.highlight) {
        //     var out = this.options.highlight(code, lang);
        //     if (out != null && out !== code) {
        //         escaped = true;
        //         code = out;
        //     }
        // }
        //
        // if (!lang) {
        //     return '<pre><code>'
        //         + (escaped ? code : escape(code, true))
        //         + '</code></pre>';
        // }
        //
        // return '<pre><code class="'
        //     + this.options.langPrefix
        //     + escape(lang, true)
        //     + '">'
        //     + (escaped ? code : escape(code, true))
        //     + '</code></pre>\n';

        var h = this.options.h;


        var data = {
            'class': {}
        };

        if (lang) {
            var langClassName = this.options.langPrefix + escape$1(lang, true);
            data['class'][langClassName] = true;
        }

        return h('pre', {}, [
            h('code', data , code)
        ]);

    };

    Renderer$1.prototype.blockquote = function(quote) {
        // return '<blockquote>\n' + quote + '</blockquote>\n';

        var h = this.options.h;
        return h('blockquote', {}, quote);
    };

    Renderer$1.prototype.html = function(html) {
        var h = this.options.h;
        // if(Vue){
        //     return Vue.compile(html);
        // }

        // debugger
        // var ast = parse(html);
        // return ast[0];

        // debugger

        // return html;
        // return h('div', {}, ast);

        var ast = parse(html);
        return ast;
    };

    Renderer$1.prototype.heading = function(text, level, raw) {
        // if (this.options.headerIds) {
        //     return '<h'
        //         + level
        //         + ' id="'
        //         + this.options.headerPrefix
        //         + raw.toLowerCase().replace(/[^\w]+/g, '-')
        //         + '">'
        //         + text
        //         + '</h'
        //         + level
        //         + '>\n';
        // }
        // // ignore IDs
        // return '<h' + level + '>' + text + '</h' + level + '>\n';

        var h = this.options.h;
        return h('h'+level, {}, text);
    };

    Renderer$1.prototype.hr = function() {
        // return this.options.xhtml ? '<hr/>\n' : '<hr>\n';
        var h = this.options.h;
        return h('hr', {});
    };

    Renderer$1.prototype.list = function(body, ordered, start) {
        // var type = ordered ? 'ol' : 'ul',
        //     startatt = (ordered && start !== 1) ? (' start="' + start + '"') : '';
        // return '<' + type + startatt + '>\n' + body + '</' + type + '>\n';


        var h = this.options.h;

        var type = ordered ? 'ol' : 'ul';


        return h(type, {

        }, body);

    };

    // Renderer.prototype.listitem = function(text) {
    //     // return '<li>' + text + '</li>\n';
    //     var h = this.options.h;
    //
    //     // debugger
    //     // if(Object.prototype.toString.call(text) === "[object Array]"){
    //     //     text = text[0]
    //     // }
    //
    //     return h('li', {
    //     }, text);
    //
    //
    // };

    Renderer$1.prototype.listitem = function(vnodes) {

        var h = this.options.h;
        return h('li', {
        }, vnodes);
    };

    Renderer$1.prototype.checkbox = function(checked) {
        // return '<input '
        //     + (checked ? 'checked="" ' : '')
        //     + 'disabled="" type="checkbox"'
        //     + (this.options.xhtml ? ' /' : '')
        //     + '> ';




        var h = this.options.h;

        return h('input', {
            attrs: {
                checked: checked,
                disabled: true,
                type: 'checkbox'
            }
        });

    };

    // Renderer.prototype.paragraph = function(text) {
    //     // return '<p>' + text + '</p>\n';
    //     var h = this.options.h;
    //     return h('p', {}, text);
    // };

    Renderer$1.prototype.paragraph = function(vnodes) {
        // return '<p>' + text + '</p>\n';
        // var h = this.options.h;
        // return h('p', {}, text);

        // debugger
        // return vnodes;
        var h = this.options.h;
        return h('p', {}, vnodes);
    };

    Renderer$1.prototype.table = function(header, body) {
        // if (body) body = '<tbody>' + body + '</tbody>';
        //
        // return '<table>\n'
        //     + '<thead>\n'
        //     + header
        //     + '</thead>\n'
        //     + body
        //     + '</table>\n';

        var h = this.options.h;
        // if (body) body = h('tbody',{}, body);

        return h('table', {}, [
            h('thead', {}, header),
            h('tbody',{}, body)
        ]);

    };

    Renderer$1.prototype.tablerow = function(content) {
        // return '<tr>\n' + content + '</tr>\n';

        var h = this.options.h;
        return h('tr', {}, content);
    };

    Renderer$1.prototype.tablecell = function(content, flags) {
        // var type = flags.header ? 'th' : 'td';
        // var tag = flags.align
        //     ? '<' + type + ' align="' + flags.align + '">'
        //     : '<' + type + '>';
        // return tag + content + '</' + type + '>\n';

        var h = this.options.h;
        var type = flags.header ? 'th' : 'td';
        return h(type, {
            attrs:{
                align: flags.align
            }
        }, content);
    };

    // span level renderer
    Renderer$1.prototype.strong = function(text) {
        // return '<strong>' + text + '</strong>';

        var h = this.options.h;
        return h('strong', {}, text);

    };

    Renderer$1.prototype.em = function(text) {
        // return '<em>' + text + '</em>';

        var h = this.options.h;
        return h('em', {}, text);
    };

    Renderer$1.prototype.codespan = function(text) {
        // return '<code>' + text + '</code>';
        var h = this.options.h;
        return h('code', {}, text);
    };

    Renderer$1.prototype.br = function() {
        // return this.options.xhtml ? '<br/>' : '<br>';
        var h = this.options.h;
        return h('br');
    };

    Renderer$1.prototype.del = function(text) {
        // return '<del>' + text + '</del>';

        var h = this.options.h;
        return h('del', {}, text);

    };

    Renderer$1.prototype.link = function(href, title, text) {
        // if (this.options.sanitize) {
        //     try {
        //         var prot = decodeURIComponent(unescape(href))
        //             .replace(/[^\w:]/g, '')
        //             .toLowerCase();
        //     } catch (e) {
        //         return text;
        //     }
        //     if (prot.indexOf('javascript:') === 0 || prot.indexOf('vbscript:') === 0 || prot.indexOf('data:') === 0) {
        //         return text;
        //     }
        // }
        // if (this.options.baseUrl && !originIndependentUrl.test(href)) {
        //     href = resolveUrl(this.options.baseUrl, href);
        // }
        // try {
        //     href = encodeURI(href).replace(/%25/g, '%');
        // } catch (e) {
        //     return text;
        // }
        // var out = '<a href="' + escape(href) + '"';
        // if (title) {
        //     out += ' title="' + title + '"';
        // }
        // out += '>' + text + '</a>';
        // return out;

        var h = this.options.h;
        return h('a', {
            attrs: {
                href: escape$1(href),
                title: title?title:undefined
            },
            props: {

            }
        }, text);

        // return h('a', {props: {href: '/foo'}}, 'I\'ll take you places!')
    };

    Renderer$1.prototype.image = function(href, title, text) {
        // if (this.options.baseUrl && !originIndependentUrl.test(href)) {
        //     href = resolveUrl(this.options.baseUrl, href);
        // }
        // var out = '<img src="' + href + '" alt="' + text + '"';
        // if (title) {
        //     out += ' title="' + title + '"';
        // }
        // out += this.options.xhtml ? '/>' : '>';
        // return out;

        var h = this.options.h;
        return h('img', {
            attrs: {
                src: href,
                title: title?title:undefined,
                alt: text?text:undefined,
            }
        }, text);
    };

    Renderer$1.prototype.text = function(text) {
        // return text;
        var h = this.options.h;
        return h('span', {}, text);
    };

    /**
     * Inline-Level Grammar
     */

    var inline = {
        escape: /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/,
        autolink: /^<(scheme:[^\s\x00-\x1f<>]*|email)>/,
        url: noop,
        tag: '^comment'
            + '|^</[a-zA-Z][\\w:-]*\\s*>' // self-closing tag
            + '|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>' // open tag
            + '|^<\\?[\\s\\S]*?\\?>' // processing instruction, e.g. <?php ?>
            + '|^<![a-zA-Z]+\\s[\\s\\S]*?>' // declaration, e.g. <!DOCTYPE html>
            + '|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>', // CDATA section
        link: /^!?\[(label)\]\(href(?:\s+(title))?\s*\)/,
        reflink: /^!?\[(label)\]\[(?!\s*\])((?:\\[\[\]]?|[^\[\]\\])+)\]/,
        nolink: /^!?\[(?!\s*\])((?:\[[^\[\]]*\]|\\[\[\]]|[^\[\]])*)\](?:\[\])?/,
        strong: /^__([^\s])__(?!_)|^\*\*([^\s])\*\*(?!\*)|^__([^\s][\s\S]*?[^\s])__(?!_)|^\*\*([^\s][\s\S]*?[^\s])\*\*(?!\*)/,
        em: /^_([^\s_])_(?!_)|^\*([^\s*"<\[])\*(?!\*)|^_([^\s][\s\S]*?[^\s_])_(?!_)|^_([^\s_][\s\S]*?[^\s])_(?!_)|^\*([^\s"<\[][\s\S]*?[^\s*])\*(?!\*)|^\*([^\s*"<\[][\s\S]*?[^\s])\*(?!\*)/,
        code: /^(`+)\s*([\s\S]*?[^`]?)\s*\1(?!`)/,
        br: /^( {2,}|\\)\n(?!\s*$)/,
        del: noop,
        text: /^[\s\S]+?(?=[\\<!\[`*]|\b_| {2,}\n|$)/
    };

    inline._escapes = /\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/g;

    inline._scheme = /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/;
    inline._email = /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/;
    inline.autolink = edit(inline.autolink)
        .replace('scheme', inline._scheme)
        .replace('email', inline._email)
        .getRegex();

    inline._attribute = /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/;

    inline.tag = edit(inline.tag)
        .replace('comment', block._comment)
        .replace('attribute', inline._attribute)
        .getRegex();

    inline._label = /(?:\[[^\[\]]*\]|\\[\[\]]?|`[^`]*`|[^\[\]\\])*?/;
    inline._href = /\s*(<(?:\\[<>]?|[^\s<>\\])*>|(?:\\[()]?|\([^\s\x00-\x1f\\]*\)|[^\s\x00-\x1f()\\])*?)/;
    inline._title = /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/;

    inline.link = edit(inline.link)
        .replace('label', inline._label)
        .replace('href', inline._href)
        .replace('title', inline._title)
        .getRegex();

    inline.reflink = edit(inline.reflink)
        .replace('label', inline._label)
        .getRegex();

    /**
     * Normal Inline Grammar
     */

    inline.normal = merge({}, inline);

    /**
     * Pedantic Inline Grammar
     */

    inline.pedantic = merge({}, inline.normal, {
        strong: /^__(?=\S)([\s\S]*?\S)__(?!_)|^\*\*(?=\S)([\s\S]*?\S)\*\*(?!\*)/,
        em: /^_(?=\S)([\s\S]*?\S)_(?!_)|^\*(?=\S)([\s\S]*?\S)\*(?!\*)/,
        link: edit(/^!?\[(label)\]\((.*?)\)/)
            .replace('label', inline._label)
            .getRegex(),
        reflink: edit(/^!?\[(label)\]\s*\[([^\]]*)\]/)
            .replace('label', inline._label)
            .getRegex()
    });

    /**
     * GFM Inline Grammar
     */

    inline.gfm = merge({}, inline.normal, {
        escape: edit(inline.escape).replace('])', '~|])').getRegex(),
        url: edit(/^((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/)
            .replace('email', inline._email)
            .getRegex(),
        _backpedal: /(?:[^?!.,:;*_~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_~)]+(?!$))+/,
        del: /^~+(?=\S)([\s\S]*?\S)~+/,
        text: edit(inline.text)
            .replace(']|', '~]|')
            .replace('|', '|https?://|ftp://|www\\.|[a-zA-Z0-9.!#$%&\'*+/=?^_`{\\|}~-]+@|')
            .getRegex()
    });

    /**
     * GFM + Line Breaks Inline Grammar
     */

    inline.breaks = merge({}, inline.gfm, {
        br: edit(inline.br).replace('{2,}', '*').getRegex(),
        text: edit(inline.gfm.text).replace('{2,}', '*').getRegex()
    });

    /**
     * Inline Lexer & Compiler
     */

    function InlineLexer(links, options) {
        this.options = options || marked.defaults;
        this.links = links;
        this.rules = inline.normal;
        this.renderer = this.options.renderer || new Renderer();
        this.renderer.options = this.options;

        if (!this.links) {
            throw new Error('Tokens array requires a `links` property.');
        }

        if (this.options.pedantic) {
            this.rules = inline.pedantic;
        } else if (this.options.gfm) {
            if (this.options.breaks) {
                this.rules = inline.breaks;
            } else {
                this.rules = inline.gfm;
            }
        }
    }

    /**
     * Expose Inline Rules
     */

    InlineLexer.rules = inline;

    /**
     * Static Lexing/Compiling Method
     */

    InlineLexer.output = function(src, links, options) {
        var inline$$1 = new InlineLexer(links, options);
        return inline$$1.output(src);
    };

    /**
     * Lexing/Compiling
     */

    InlineLexer.prototype.output = function(src) {
        var link,
            text,
            href,
            title,
            cap,
            prevCapZero;

        var vnodes = [];

        while (src) {

            // escape
            if (cap = this.rules.escape.exec(src)) {
                // src = src.substring(cap[0].length);
                // out += cap[1];
                // continue;


                src = src.substring(cap[0].length);
                vnodes.push(
                    this.renderer.text(cap[1])
                );
                continue;
            }

            // autolink
            if (cap = this.rules.autolink.exec(src)) {
                // src = src.substring(cap[0].length);
                // if (cap[2] === '@') {
                //     text = escape(this.mangle(cap[1]));
                //     href = 'mailto:' + text;
                // } else {
                //     text = escape(cap[1]);
                //     href = text;
                // }
                // out += this.renderer.link(href, null, text);
                // continue;

                src = src.substring(cap[0].length);
                if (cap[2] === '@') {
                    text = escape$1(this.mangle(cap[1]));
                    href = 'mailto:' + text;
                } else {
                    text = escape$1(cap[1]);
                    href = text;
                }
                vnodes.push(
                    this.renderer.link(href, null, text)
                );
                continue;
            }

            // url (gfm)
            if (!this.inLink && (cap = this.rules.url.exec(src))) {
                do {
                    prevCapZero = cap[0];
                    cap[0] = this.rules._backpedal.exec(cap[0])[0];
                } while (prevCapZero !== cap[0]);
                src = src.substring(cap[0].length);
                if (cap[2] === '@') {
                    text = escape$1(cap[0]);
                    href = 'mailto:' + text;
                } else {
                    text = escape$1(cap[0]);
                    if (cap[1] === 'www.') {
                        href = 'http://' + text;
                    } else {
                        href = text;
                    }
                }
                // out += this.renderer.link(href, null, text);

                vnodes.push(
                    this.renderer.link(href, null, text)
                );

                continue;
            }

            // tag
            if (cap = this.rules.tag.exec(src)) {
                // if (!this.inLink && /^<a /i.test(cap[0])) {
                //     this.inLink = true;
                // } else if (this.inLink && /^<\/a>/i.test(cap[0])) {
                //     this.inLink = false;
                // }
                // src = src.substring(cap[0].length);
                // out += this.options.sanitize
                //     ? this.options.sanitizer
                //         ? this.options.sanitizer(cap[0])
                //         : escape(cap[0])
                //     : cap[0]
                // continue;


                if (!this.inLink && /^<a /i.test(cap[0])) {
                    this.inLink = true;
                } else if (this.inLink && /^<\/a>/i.test(cap[0])) {
                    this.inLink = false;
                }
                src = src.substring(cap[0].length);
                vnodes.push(
                    this.options.sanitize
                        ? this.options.sanitizer
                        ? this.options.sanitizer(cap[0])
                        : escape$1(cap[0])
                        : cap[0]
                );
                continue;
            }

            // link
            if (cap = this.rules.link.exec(src)) {
                src = src.substring(cap[0].length);
                this.inLink = true;
                href = cap[2];
                if (this.options.pedantic) {
                    link = /^([^'"]*[^\s])\s+(['"])(.*)\2/.exec(href);

                    if (link) {
                        href = link[1];
                        title = link[3];
                    } else {
                        title = '';
                    }
                } else {
                    title = cap[3] ? cap[3].slice(1, -1) : '';
                }
                href = href.trim().replace(/^<([\s\S]*)>$/, '$1');
                // out += this.outputLink(cap, {
                //     href: InlineLexer.escapes(href),
                //     title: InlineLexer.escapes(title)
                // });
                vnodes.push(
                    this.outputLink(cap, {
                        href: InlineLexer.escapes(href),
                        title: InlineLexer.escapes(title)
                    })
                );

                this.inLink = false;
                continue;
            }

            // reflink, nolink
            if ((cap = this.rules.reflink.exec(src))
                || (cap = this.rules.nolink.exec(src))) {
                // src = src.substring(cap[0].length);
                // link = (cap[2] || cap[1]).replace(/\s+/g, ' ');
                // link = this.links[link.toLowerCase()];
                // if (!link || !link.href) {
                //     out += cap[0].charAt(0);
                //     src = cap[0].substring(1) + src;
                //     continue;
                // }
                // this.inLink = true;
                // out += this.outputLink(cap, link);
                // this.inLink = false;
                // continue;

                src = src.substring(cap[0].length);
                link = (cap[2] || cap[1]).replace(/\s+/g, ' ');
                link = this.links[link.toLowerCase()];
                if (!link || !link.href) {
                    // out += cap[0].charAt(0);
                    vnodes.push(
                        this.renderer.text(cap[0].charAt(0))
                    );

                    src = cap[0].substring(1) + src;
                    continue;
                }
                this.inLink = true;
                vnodes.push(
                    this.outputLink(cap, link)
                );
                this.inLink = false;
                continue;

            }

            // strong
            if (cap = this.rules.strong.exec(src)) {
                // src = src.substring(cap[0].length);
                // out += this.renderer.strong(this.output(cap[4] || cap[3] || cap[2] || cap[1]));
                // continue;

                src = src.substring(cap[0].length);
                var vnode = this.output(cap[4] || cap[3] || cap[2] || cap[1]);
                vnodes.push(
                    this.renderer.strong(vnode)
                );
                continue;
            }

            // em
            if (cap = this.rules.em.exec(src)) {
                // src = src.substring(cap[0].length);
                // out += this.renderer.em(this.output(cap[6] || cap[5] || cap[4] || cap[3] || cap[2] || cap[1]));
                // continue;

                src = src.substring(cap[0].length);
                vnodes.push(
                    this.renderer.em(this.output(cap[6] || cap[5] || cap[4] || cap[3] || cap[2] || cap[1]))
                );
                continue;
            }

            // code
            if (cap = this.rules.code.exec(src)) {
                // src = src.substring(cap[0].length);
                // out += this.renderer.codespan(escape(cap[2].trim(), true));
                // continue;

                src = src.substring(cap[0].length);
                vnodes.push(
                    this.renderer.codespan(cap[2].trim(), true)
                );
                continue;
            }

            // br
            if (cap = this.rules.br.exec(src)) {
                // src = src.substring(cap[0].length);
                // out += this.renderer.br();
                // continue;

                src = src.substring(cap[0].length);
                vnodes.push(
                    this.renderer.br()
                );
                continue;
            }

            // del (gfm)
            if (cap = this.rules.del.exec(src)) {
                // src = src.substring(cap[0].length);
                // out += this.renderer.del(this.output(cap[1]));
                // continue;


                src = src.substring(cap[0].length);
                vnodes.push(
                    this.renderer.del(this.output(cap[1]))
                );
                continue;
            }

            // text
            if (cap = this.rules.text.exec(src)) {
                src = src.substring(cap[0].length);
                // out += this.renderer.text(escape(this.smartypants(cap[0])));
                vnodes.push(
                    this.renderer.text(this.smartypants(cap[0]))
                );
                continue;
            }

            if (src) {
                throw new Error('Infinite loop on byte: ' + src.charCodeAt(0));
            }
        }

        // return out;
        // return (vnodes && vnodes.length>0)?vnodes[0]:{
        //     text: ''
        // };
        return vnodes;
    };

    InlineLexer.escapes = function(text) {
        return text ? text.replace(InlineLexer.rules._escapes, '$1') : text;
    };

    /**
     * Compile Link
     */

    InlineLexer.prototype.outputLink = function(cap, link) {
        var href = link.href,
            title = link.title ? escape$1(link.title) : null;

        return cap[0].charAt(0) !== '!'
            ? this.renderer.link(href, title, this.output(cap[1]))
            : this.renderer.image(href, title, escape$1(cap[1]));
    };

    /**
     * Smartypants Transformations
     */

    InlineLexer.prototype.smartypants = function(text) {
        if (!this.options.smartypants) return text;
        return text
        // em-dashes
            .replace(/---/g, '\u2014')
            // en-dashes
            .replace(/--/g, '\u2013')
            // opening singles
            .replace(/(^|[-\u2014/(\[{"\s])'/g, '$1\u2018')
            // closing singles & apostrophes
            .replace(/'/g, '\u2019')
            // opening doubles
            .replace(/(^|[-\u2014/(\[{\u2018\s])"/g, '$1\u201c')
            // closing doubles
            .replace(/"/g, '\u201d')
            // ellipses
            .replace(/\.{3}/g, '\u2026');
    };

    /**
     * Mangle Links
     */

    InlineLexer.prototype.mangle = function(text) {
        if (!this.options.mangle) return text;
        var out = '',
            l = text.length,
            i = 0,
            ch;

        for (; i < l; i++) {
            ch = text.charCodeAt(i);
            if (Math.random() > 0.5) {
                ch = 'x' + ch.toString(16);
            }
            out += '&#' + ch + ';';
        }

        return out;
    };

    /**
     * TextRenderer
     * returns only the textual part of the token
     */

    function TextRenderer() {}

    // no need for block level renderers

    TextRenderer.prototype.strong =
        TextRenderer.prototype.em =
            TextRenderer.prototype.codespan =
                TextRenderer.prototype.del =
                    TextRenderer.prototype.text = function (text) {
                        return text;
                    };

    TextRenderer.prototype.link =
        TextRenderer.prototype.image = function(href, title, text) {
            return '' + text;
        };

    TextRenderer.prototype.br = function() {
        return '';
    };

    /**
     * Parsing & Compiling
     */

    function Parser(options) {
        this.tokens = [];
        this.token = null;
        // this.options = options || marked.defaults;
        this.options = options || defaults;
        this.options.renderer = this.options.renderer || new Renderer$1();
        this.renderer = this.options.renderer;
        this.renderer.options = this.options;
    }

    /**
     * Static Parse Method
     */

    Parser.parse = function(src, options) {
        var parser = new Parser(options);
        return parser.parse(src);
    };

    /**
     * Parse Loop
     */

    Parser.prototype.parse = function(src) {
        this.inline = new InlineLexer(src.links, this.options);
        // use an InlineLexer with a TextRenderer to extract pure text
        this.inlineText = new InlineLexer(
            src.links,
            merge({}, this.options, {renderer: new TextRenderer()})
        );
        this.tokens = src.reverse();

        var out = [];
        while (this.next()) {
            out.push(this.tok());
        }

        return out;
    };

    /**
     * Next Token
     */

    Parser.prototype.next = function() {
        return this.token = this.tokens.pop();
    };

    /**
     * Preview Next Token
     */

    Parser.prototype.peek = function() {
        return this.tokens[this.tokens.length - 1] || 0;
    };

    /**
     * Parse Text Tokens
     */

    Parser.prototype.parseText = function() {
        var body = this.token.text;

        while (this.peek().type === 'text') {
            body += '\n' + this.next().text;
        }

        // return this.inline.output(body);

        // const vnode = this.inline.output(body);
        // return vnode.text;
        // return vnodes.map(function (vnode) {
        //     return vnode.text
        // }).reduce(function (a, b) {
        //     return a + b;
        // });

        return this.inline.output(body);
    };

    /**
     * Parse Current Token
     */

    Parser.prototype.tok = function() {
        switch (this.token.type) {
            case 'space': {
                return '';
            }
            case 'hr': {
                return this.renderer.hr();
            }
            case 'heading': {
                // return this.renderer.heading(
                //     this.inline.output(this.token.text),
                //     this.token.depth,
                //     unescape(this.inlineText.output(this.token.text)));

                // var vnode = this.inline.output(this.token.text);
                // return this.renderer.heading(
                //     vnode.text,
                //     this.token.depth,
                //     unescape(this.inlineText.output(this.token.text)));

                return this.renderer.heading(
                    this.inline.output(this.token.text),
                    this.token.depth,
                    (this.inlineText.output(this.token.text)));
            }
            case 'code': {
                return this.renderer.code(this.token.text,
                    this.token.lang,
                    this.token.escaped);
            }
            case 'table': {
                // var header = '',
                //     body = '',
                //     i,
                //     row,
                //     cell,
                //     j;
                //
                // // header
                // cell = '';
                // for (i = 0; i < this.token.header.length; i++) {
                //     cell += this.renderer.tablecell(
                //         this.inline.output(this.token.header[i]),
                //         { header: true, align: this.token.align[i] }
                //     );
                // }
                // header += this.renderer.tablerow(cell);
                //
                // for (i = 0; i < this.token.cells.length; i++) {
                //     row = this.token.cells[i];
                //
                //     cell = '';
                //     for (j = 0; j < row.length; j++) {
                //         cell += this.renderer.tablecell(
                //             this.inline.output(row[j]),
                //             { header: false, align: this.token.align[j] }
                //         );
                //     }
                //
                //     body += this.renderer.tablerow(cell);
                // }
                // return this.renderer.table(header, body);

                var header = [],
                    body = [],
                    i,
                    row,
                    cell = [],
                    j;

                // header
                // cell = '';
                for (i = 0; i < this.token.header.length; i++) {
                    cell.push(
                        this.renderer.tablecell(
                            this.inline.output(this.token.header[i]),
                            { header: true, align: this.token.align[i] }
                        )
                    );
                }

                header.push( this.renderer.tablerow(cell) );

                for (i = 0; i < this.token.cells.length; i++) {
                    row = this.token.cells[i];

                    cell = [];
                    for (j = 0; j < row.length; j++) {
                        cell.push(
                            this.renderer.tablecell(
                                this.inline.output(row[j]),
                                { header: false, align: this.token.align[j] }
                            )
                        );
                    }

                    body.push(
                        this.renderer.tablerow(cell)
                    );
                }
                return this.renderer.table(header, body);

            }
            case 'blockquote_start': {
                // body = '';
                //
                // while (this.next().type !== 'blockquote_end') {
                //     body += this.tok();
                // }
                //
                // return this.renderer.blockquote(body);

                let body = [];
                while (this.next().type !== 'blockquote_end') {
                    body.push( this.tok() );
                }

                return this.renderer.blockquote(body);

            }
            case 'list_start': {
                // body = '';
                // var ordered = this.token.ordered,
                //     start = this.token.start;
                //
                // while (this.next().type !== 'list_end') {
                //     body += this.tok();
                // }
                //
                // return this.renderer.list(body, ordered, start);

                let body = [];
                var ordered = this.token.ordered,
                    start = this.token.start;

                while (this.next().type !== 'list_end') {
                    body.push(this.tok());
                }

                return this.renderer.list(body, ordered, start);

            }
            case 'list_item_start': {
                // body = '';
                // var loose = this.token.loose;
                //
                // if (this.token.task) {
                //     body += this.renderer.checkbox(this.token.checked);
                // }
                //
                // while (this.next().type !== 'list_item_end') {
                //     body += !loose && this.token.type === 'text'
                //         ? this.parseText()
                //         : this.tok();
                // }
                //
                // return this.renderer.listitem(body);

                let body = [];
                var loose = this.token.loose;

                if (this.token.task) {
                    // body += this.renderer.checkbox(this.token.checked);
                    body.push(
                        this.renderer.checkbox(this.token.checked)
                    );

                    body.push(
                        this.renderer.text(' ')
                    );
                }

                while (this.next().type !== 'list_item_end') {
                    body.push(
                        !loose && this.token.type === 'text'
                        ? this.parseText()
                        : this.tok()
                    );
                }

                // body = body.map(function (t) {
                //     return t[0];
                // }).filter(function (t) {
                //     return !!t;
                // });
                var vnodes = [];
                for(var i=0;i<body.length;i++) {
                    if(!body[i]) {
                        continue;
                    }
                    if(!isArray(body[i])){
                        vnodes.push(body[i]);
                        continue;
                    }
                    for(var j=0;j<body[i].length;j++) {
                        body[i][j] && vnodes.push(body[i][j]);
                    }
                }

                return this.renderer.listitem(vnodes);
            }
            case 'html': {
                // TODO parse inline content if parameter markdown=1
                return this.renderer.html(this.token.text);
            }
            case 'paragraph': {
                // return this.renderer.paragraph(this.inline.output(this.token.text));

                // var vnodes = this.inline.output(this.token.text);
                // return this.renderer.paragraph(vnode.text);

                var vnodes = this.inline.output(this.token.text);
                return this.renderer.paragraph(vnodes);
            }
            case 'text': {
                return this.renderer.paragraph(this.parseText());
            }
        }
    };

    /**
     * Marked
     */

    function marked$1(src, opt, callback) {
        // throw error in case of non string input
        if (typeof src === 'undefined' || src === null) {
            throw new Error('marked(): input parameter is undefined or null');
        }
        if (typeof src !== 'string') {
            throw new Error('marked(): input parameter is of type '
                + Object.prototype.toString.call(src) + ', string expected');
        }

        if (callback || typeof opt === 'function') {
            if (!callback) {
                callback = opt;
                opt = null;
            }

            opt = merge({}, marked$1.defaults, opt || {});

            var highlight = opt.highlight,
                tokens,
                pending,
                i = 0;

            try {
                tokens = Lexer.lex(src, opt);
            } catch (e) {
                return callback(e);
            }

            pending = tokens.length;

            var done = function(err) {
                if (err) {
                    opt.highlight = highlight;
                    return callback(err);
                }

                var out;

                try {
                    out = Parser.parse(tokens, opt);
                } catch (e) {
                    err = e;
                }

                opt.highlight = highlight;

                return err
                    ? callback(err)
                    : callback(null, out);
            };

            if (!highlight || highlight.length < 3) {
                return done();
            }

            delete opt.highlight;

            if (!pending) return done();

            for (; i < tokens.length; i++) {
                (function(token) {
                    if (token.type !== 'code') {
                        return --pending || done();
                    }
                    return highlight(token.text, token.lang, function(err, code) {
                        if (err) return done(err);
                        if (code == null || code === token.text) {
                            return --pending || done();
                        }
                        token.text = code;
                        token.escaped = true;
                        --pending || done();
                    });
                })(tokens[i]);
            }

            return;
        }
        try {
            if (opt) opt = merge({}, marked$1.defaults, opt);
            return Parser.parse(Lexer.lex(src, opt), opt);
        } catch (e) {
            e.message += '\nPlease report this to https://github.com/markedjs/marked.';
            if ((opt || marked$1.defaults).silent) {
                return '<p>An error occurred:</p><pre>'
                    + escape(e.message + '', true)
                    + '</pre>';
            }
            throw e;
        }
    }

    /**
     * Options
     */

    marked$1.options =
        marked$1.setOptions = function(opt) {
            merge(marked$1.defaults, opt);
            return marked$1;
        };

    marked$1.getDefaults = function () {
        return merge(defaults, {
            renderer: new Renderer$1()
        });
    };

    marked$1.defaults = marked$1.getDefaults();

    /**
     * Expose
     */

    marked$1.Parser = Parser;
    marked$1.parser = Parser.parse;

    marked$1.Renderer = Renderer$1;
    marked$1.TextRenderer = TextRenderer;

    marked$1.Lexer = Lexer;
    marked$1.lexer = Lexer.lex;

    marked$1.InlineLexer = InlineLexer;
    marked$1.inlineLexer = InlineLexer.output;

    marked$1.parse = marked$1;

    /**
     * marked - a markdown parser
     * Copyright (c) 2011-2018, Christopher Jeffrey. (MIT Licensed)
     * https://github.com/markedjs/marked
     */

    return marked$1;

})));
