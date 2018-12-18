import { cleanUrl, escape } from './helper';
import defaults from './options';
const marked = { defaults };

function createPostionAttrs(position) {
    var attrs = '';
    if(position) {
        // attrs = ' data-start-line="'+position.start.line+'" '+'data-end-line="'+position.end.line+'"';
        attrs = ' data-line="'+position.start.line+'-'+position.end.line+'" ';
    }
    return attrs;
}

function Renderer(options) {
    this.options = options || marked.defaults;
}

Renderer.prototype.code = function(code, infostring, escaped, position) {
    var lang = (infostring || '').match(/\S*/)[0];
    if (this.options.highlight) {
        var out = this.options.highlight(code, lang);
        if (out != null && out !== code) {
            escaped = true;
            code = out;
        }
    }
    
    var attrs = createPostionAttrs(position);

    if (!lang) {
        return '<pre'+attrs+'><code>'
            + (escaped ? code : escape(code, true))
            + '</code></pre>';
    }

    return '<pre'+attrs+'><code class="'
        + this.options.langPrefix
        + escape(lang, true)
        + '">'
        + (escaped ? code : escape(code, true))
        + '</code></pre>\n';
};

Renderer.prototype.blockquote = function(quote) {
    return '<blockquote>\n' + quote + '</blockquote>\n';
};

Renderer.prototype.html = function(html) {
    return html;
};

Renderer.prototype.heading = function(text, level, raw, position) {

    var attrs = createPostionAttrs(position);

    if (this.options.headerIds) {
        return '<h'
            + level
            + ' id="'
            + this.options.headerPrefix
            + raw.toLowerCase().replace(/[^\w]+/g, '-')
            + '"'+attrs+'>'
            + text
            + '</h'
            + level
            + '>\n';
    }
    // ignore IDs
    return '<h' + level + attrs+ '>' + text + '</h' + level + '>\n';
};

Renderer.prototype.hr = function() {
    return this.options.xhtml ? '<hr/>\n' : '<hr>\n';
};

Renderer.prototype.list = function(body, ordered, start) {
    var type = ordered ? 'ol' : 'ul',
        startatt = (ordered && start !== 1) ? (' start="' + start + '"') : '';
    return '<' + type + startatt + '>\n' + body + '</' + type + '>\n';
};

Renderer.prototype.listitem = function(text, position) {
    var attrs = createPostionAttrs(position);
    return '<li'+attrs+'>' + text + '</li>\n';
};

Renderer.prototype.checkbox = function(checked) {
    return '<input '
        + (checked ? 'checked="" ' : '')
        + 'disabled="" type="checkbox"'
        + (this.options.xhtml ? ' /' : '')
        + '> ';
};

Renderer.prototype.paragraph = function(text, position) {
    var attrs = createPostionAttrs(position);
    return '<p'+attrs+'>' + text + '</p>\n';
};

Renderer.prototype.table = function(header, body, position) {
    var attrs = createPostionAttrs(position);

    if (body) body = '<tbody>' + body + '</tbody>';

    return '<table'+attrs+'>\n'
        + '<thead>\n'
        + header
        + '</thead>\n'
        + body
        + '</table>\n';
};

Renderer.prototype.tablerow = function(content) {
    return '<tr>\n' + content + '</tr>\n';
};

Renderer.prototype.tablecell = function(content, flags) {
    var type = flags.header ? 'th' : 'td';
    var tag = flags.align
        ? '<' + type + ' align="' + flags.align + '">'
        : '<' + type + '>';
    return tag + content + '</' + type + '>\n';
};

// span level renderer
Renderer.prototype.strong = function(text) {
    return '<strong>' + text + '</strong>';
};

Renderer.prototype.em = function(text) {
    return '<em>' + text + '</em>';
};

Renderer.prototype.codespan = function(text) {
    return '<code>' + text + '</code>';
};

Renderer.prototype.br = function() {
    return this.options.xhtml ? '<br/>' : '<br>';
};

Renderer.prototype.del = function(text) {
    return '<del>' + text + '</del>';
};

Renderer.prototype.link = function(href, title, text) {
    href = cleanUrl(this.options.sanitize, this.options.baseUrl, href);
    if (href === null) {
        return text;
    }
    var out = '<a href="' + escape(href) + '"';
    if (title) {
        out += ' title="' + title + '"';
    }
    out += '>' + text + '</a>';
    return out;
};

Renderer.prototype.image = function(href, title, text) {
    href = cleanUrl(this.options.sanitize, this.options.baseUrl, href);
    if (href === null) {
        return text;
    }

    var out = '<img src="' + href + '" alt="' + text + '"';
    if (title) {
        out += ' title="' + title + '"';
    }
    out += this.options.xhtml ? '/>' : '>';
    return out;
};

Renderer.prototype.text = function(text, position) {
    return '<span>'+text+'</span>';
};

export default Renderer;
