import block from './block';
import defaults from './defaults';
import { splitCells, rtrim, escapeScript } from './helper';
const marked = {defaults};

/**
 * Block Lexer
 */

function Lexer(options) {
    this.tokens = [];
    this.tokens.links = Object.create(null);
    this.options = options || marked.defaults;
    this.rules = block.normal;

    this.line = 1;

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

function lines(src) {

    if(!src) return;

    for(var i=src.length -1;i>=0;--i){
        var ch = src[i];
        if(ch === '\n'){
            this.tokens.push({
                type: 'space'
            });
        }
    }


}

function createPosition(src) {
    if(!src) return;
    // debugger

    var startLine = this.line;
    // var startColumn = 1;
    var endLine = this.line;
    // var endColumn = src.length;

    var isEnd = true;
    for(var i=src.length -1;i>=0;--i){
        var ch = src[i];
        if(ch === '\n'){

            // endColumn--;
            this.line++;

            if(!isEnd){
                endLine++;
            }
        }
        else{
            isEnd = false;
        }
    }

    var position = {
        start: {
            line: startLine,
            // column: startColumn
        },
        end: {
            line: endLine,
            // column: endColumn
        }
    };

    return position;
}

// function createTablePosition(src) {
//     if(!src || src.length === 0) return;
//
//     var startLine = this.line;
//
//     // var endLine = this.line;
//
//     this.line += src.length;
//
//     var endLine = this.line;
//
//     var position = {
//         start: {
//             line: startLine,
//             // column: startColumn
//         },
//         end: {
//             line: endLine,
//             // column: endColumn
//         }
//     };
//
//     return position;
// }

function createListItemPosition(tokens, change) {
    if(!tokens || tokens.length === 0) {
        return;
    }

    var startLine = this.line;
    var endLine = this.line;

    // change && (this.line += 1);

    if(change) {
        // debugger
        this.line ++;
        // for(var i=src.length -1;i>=0;--i){
        //     var ch = src[i];
        //     if(ch === '\n'){
        //         this.line++;
        //         break;
        //     }
        // }
    }
    else{

        startLine = -1;
        endLine = -1;
        var list_item_num = 0;

        for(var i=tokens.length -1;i>=0;--i){
            var token = tokens[i];

            if(token.type === 'list_item_start'){
                if(list_item_num === 0){
                    break;
                }
                list_item_num--;
                // break;
            }

            if(token.type === 'list_item_end'){
                list_item_num++;
            }

            if(token.position) {
                if(startLine<0){
                    startLine = token.position.start.line;
                }
                else if(token.position.start.line < startLine) {
                    startLine = token.position.start.line;
                }

                if(endLine<0){
                    endLine = token.position.end.line;
                }
                else if(token.position.start.line > endLine) {
                    endLine = token.position.end.line;
                }
            }


        }


    }


    var position = {
        start: {
            line: startLine,
            // column: startColumn
        },
        end: {
            line: endLine,
            // column: endColumn
        }
    };

    return position;
}

function createListPosition(tokens) {

    if(!tokens || tokens.length === 0) {
        return;
    }

    var startLine = -1;
    var endLine = -1;

    var list_start = null;
    var list_num = 0;
    for(var i=tokens.length -1;i>=0;--i){
        var token = tokens[i];

        if(token.type === 'list_start'){
            if(list_num === 0){
                list_start = token;
                break;
            }
            list_num--;
        }

        if(token.type === 'list_end'){
            list_num++;
        }

        // if(token.type === 'list_item_end'){
        if(token.position){
            if(startLine<0){
                startLine = token.position.start.line;
            }
            else if(token.position.start.line < startLine) {
                startLine = token.position.start.line;
            }

            if(endLine<0){
                endLine = token.position.end.line;
            }
            else if(token.position.start.line > endLine) {
                endLine = token.position.end.line;
            }
        }
    }

    var position = {
        start: {
            line: startLine,
        },
        end: {
            line: endLine,
        }
    };

    if(list_start){
        list_start.position = position;
    }

    return position;

}

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
            if (cap[0].length >= 1) {
                createPosition.call(this, cap[0]);
            }

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
                position: createPosition.call(this, cap),
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
                position: createPosition.call(this, cap[0]),
                type: 'code',
                lang: cap[2] ? cap[2].trim() : cap[2],
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
                text: cap[2],
                position: createPosition.call(this, cap[0])
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
            // debugger
            this.tokens.push({
                position: createPosition.call(this, cap[0]),
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
                // position: createPosition.call(this, cap[0]),

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
                if (i !== l - 1) {
                    b = block.bullet.exec(cap[i + 1])[0];
                    if (bull.length > 1 ? b.length === 1
                            : (b.length > 1 || (this.options.smartLists && b !== bull))) {
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

                //escapeScript
                item = escapeScript(item);

                // var position = createListItemPosition.call(this, item);
                t = {
                    // position: position,
                    type: 'list_item_start',
                    task: istask,
                    checked: ischecked,
                    loose: loose
                };

                listItems.push(t);
                this.tokens.push(t);

                // debugger
                // Recurse.
                this.token(item, false);

                var position = createListItemPosition.call(this, this.tokens);

                this.tokens.push({
                    position: position,
                    type: 'list_item_end'
                });

                // debugger

                createListItemPosition.call(this, cap[i], i < l-1);
            }

            if (listStart.loose) {
                l = listItems.length;
                i = 0;
                for (; i < l; i++) {
                    listItems[i].loose = true;
                }
            }

            this.tokens.push({
                position: createListPosition.call(this, this.tokens),
                type: 'list_end'
            });

            // debugger

            continue;
        }

        // html
        if (cap = this.rules.html.exec(src)) {
            // debugger
            src = src.substring(cap[0].length);
            this.tokens.push({
                position: createPosition.call(this, cap[0]),
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

            createPosition.call(this, cap[0]);

            continue;
        }

        // table (gfm)
        if (top && (cap = this.rules.table.exec(src))) {


            item = {
                // position: createTablePosition.call(this, cap),
                position: createPosition.call(this, cap[0]),
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
                position: createPosition.call(this, cap[0]),
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
                position: createPosition.call(this, cap[0]),
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
                position: createPosition.call(this, cap[0]),
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

export default Lexer;