import { resolveUrl, escape, unescape } from './helper';
import defaults from './defaults';

/**
 * Renderer
 */

function Renderer(options) {
    this.options = options || defaults;
}

Renderer.prototype.code = function(code, lang, escaped) {
    if (this.options.highlight) {
        var out = this.options.highlight(code, lang);
        if (out != null && out !== code) {
            escaped = true;
            code = out;
        }
    }

    if (!lang) {
        return '<pre><code>'
            + (escaped ? code : escape(code, true))
            + '</code></pre>';
    }

    return '<pre><code class="'
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

Renderer.prototype.heading = function(text, level, raw) {
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

    const h = this.options.h;
    return h('h'+level, {}, text);
};

Renderer.prototype.hr = function() {
    return this.options.xhtml ? '<hr/>\n' : '<hr>\n';
};

Renderer.prototype.list = function(body, ordered, start) {
    var type = ordered ? 'ol' : 'ul',
        startatt = (ordered && start !== 1) ? (' start="' + start + '"') : '';
    return '<' + type + startatt + '>\n' + body + '</' + type + '>\n';
};

Renderer.prototype.listitem = function(text) {
    return '<li>' + text + '</li>\n';
};

Renderer.prototype.checkbox = function(checked) {
    return '<input '
        + (checked ? 'checked="" ' : '')
        + 'disabled="" type="checkbox"'
        + (this.options.xhtml ? ' /' : '')
        + '> ';
}

Renderer.prototype.paragraph = function(text) {
    return '<p>' + text + '</p>\n';
};

Renderer.prototype.table = function(header, body) {
    if (body) body = '<tbody>' + body + '</tbody>';

    return '<table>\n'
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
    if (this.options.sanitize) {
        try {
            var prot = decodeURIComponent(unescape(href))
                .replace(/[^\w:]/g, '')
                .toLowerCase();
        } catch (e) {
            return text;
        }
        if (prot.indexOf('javascript:') === 0 || prot.indexOf('vbscript:') === 0 || prot.indexOf('data:') === 0) {
            return text;
        }
    }
    if (this.options.baseUrl && !originIndependentUrl.test(href)) {
        href = resolveUrl(this.options.baseUrl, href);
    }
    try {
        href = encodeURI(href).replace(/%25/g, '%');
    } catch (e) {
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
    if (this.options.baseUrl && !originIndependentUrl.test(href)) {
        href = resolveUrl(this.options.baseUrl, href);
    }
    var out = '<img src="' + href + '" alt="' + text + '"';
    if (title) {
        out += ' title="' + title + '"';
    }
    out += this.options.xhtml ? '/>' : '>';
    return out;
};

Renderer.prototype.text = function(text) {
    return text;
};

export default Renderer;
