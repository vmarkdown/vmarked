import { merge, unescape, isArray } from './helper';
import defaults from './defaults';
import Renderer from "./renderer";
import InlineLexer from "./inline-lexer";
import TextRenderer from "./text-renderer";
const marked = {defaults};

/**
 * Parsing & Compiling
 */

function Parser(options) {
    this.tokens = [];
    this.token = null;
    this.options = options || marked.defaults;
    this.options.renderer = this.options.renderer || new Renderer();
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

    var out = '';
    while (this.next()) {
        out += this.tok();
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
            return this.renderer.heading(
                this.inline.output(this.token.text),
                this.token.depth,
                unescape(this.inlineText.output(this.token.text))
                ,this.token.position);
        }
        case 'code': {
            return this.renderer.code(this.token.text,
                this.token.lang,
                this.token.escaped
                ,this.token.position);
        }
        case 'table': {
            var header = '',
                body = '',
                i,
                row,
                cell,
                j;

            // header
            cell = '';
            for (i = 0; i < this.token.header.length; i++) {
                cell += this.renderer.tablecell(
                    this.inline.output(this.token.header[i]),
                    { header: true, align: this.token.align[i] }
                );
            }
            header += this.renderer.tablerow(cell);

            for (i = 0; i < this.token.cells.length; i++) {
                row = this.token.cells[i];

                cell = '';
                for (j = 0; j < row.length; j++) {
                    cell += this.renderer.tablecell(
                        this.inline.output(row[j]),
                        { header: false, align: this.token.align[j] }
                    );
                }

                body += this.renderer.tablerow(cell);
            }
            return this.renderer.table(header, body, this.token.position);
        }
        case 'blockquote_start': {
            body = '';

            while (this.next().type !== 'blockquote_end') {
                body += this.tok();
            }

            return this.renderer.blockquote(body);
        }
        case 'list_start': {
            body = '';
            var ordered = this.token.ordered,
                start = this.token.start;

            while (this.next().type !== 'list_end') {
                body += this.tok();
            }

            return this.renderer.list(body, ordered, start);
        }
        case 'list_item_start': {
            body = '';
            var loose = this.token.loose;

            if (this.token.task) {
                body += this.renderer.checkbox(this.token.checked);
            }

            while (this.next().type !== 'list_item_end') {
                body += !loose && this.token.type === 'text'
                    ? this.parseText()
                    : this.tok();
            }

            return this.renderer.listitem(body, this.token.position);
        }
        case 'html': {
            // TODO parse inline content if parameter markdown=1
            return this.renderer.html(this.token.text);
        }
        case 'paragraph': {
            return this.renderer.paragraph(this.inline.output(this.token.text)
                ,this.token.position);
        }
        case 'text': {
            return this.renderer.paragraph(this.parseText());
        }
    }
};

export default Parser;