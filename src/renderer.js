import { resolveUrl, escape, unescape } from './helper';
import defaults from './defaults';

/**
 * Renderer
 */

function Renderer(options) {
    this.options = options || defaults;
}

Renderer.prototype.code = function(code, lang, escaped) {
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
        var langClassName = this.options.langPrefix + escape(lang, true);
        data['class'][langClassName] = true;
    }

    return h('pre', {}, [
        h('code', data , code)
    ]);

};

Renderer.prototype.blockquote = function(quote) {
    // return '<blockquote>\n' + quote + '</blockquote>\n';

    var h = this.options.h;
    return h('blockquote', {}, quote);
};

Renderer.prototype.html = function(html) {

    // if(Vue){
    //     return Vue.compile(html);
    // }
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

    var h = this.options.h;
    return h('h'+level, {}, text);
};

Renderer.prototype.hr = function() {
    // return this.options.xhtml ? '<hr/>\n' : '<hr>\n';
    var h = this.options.h;
    return h('hr', {});
};

Renderer.prototype.list = function(body, ordered, start) {
    // var type = ordered ? 'ol' : 'ul',
    //     startatt = (ordered && start !== 1) ? (' start="' + start + '"') : '';
    // return '<' + type + startatt + '>\n' + body + '</' + type + '>\n';


    var h = this.options.h;

    var type = ordered ? 'ol' : 'ul',
        startatt = (ordered && start !== 1) ? (' start="' + start + '"') : '';


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

Renderer.prototype.listitem = function(vnodes) {

    var h = this.options.h;
    return h('li', {
    }, vnodes);
};

Renderer.prototype.checkbox = function(checked) {
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

}

// Renderer.prototype.paragraph = function(text) {
//     // return '<p>' + text + '</p>\n';
//     var h = this.options.h;
//     return h('p', {}, text);
// };

Renderer.prototype.paragraph = function(vnodes) {
    // return '<p>' + text + '</p>\n';
    // var h = this.options.h;
    // return h('p', {}, text);

    // debugger
    // return vnodes;
    var h = this.options.h;
    return h('p', {}, vnodes);
};

Renderer.prototype.table = function(header, body) {
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

Renderer.prototype.tablerow = function(content) {
    // return '<tr>\n' + content + '</tr>\n';

    var h = this.options.h;
    return h('tr', {}, content);
};

Renderer.prototype.tablecell = function(content, flags) {
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
Renderer.prototype.strong = function(text) {
    // return '<strong>' + text + '</strong>';

    var h = this.options.h;
    return h('strong', {}, text);

};

Renderer.prototype.em = function(text) {
    // return '<em>' + text + '</em>';

    var h = this.options.h;
    return h('em', {}, text);
};

Renderer.prototype.codespan = function(text) {
    // return '<code>' + text + '</code>';
    var h = this.options.h;
    return h('code', {}, text);
};

Renderer.prototype.br = function() {
    // return this.options.xhtml ? '<br/>' : '<br>';
    var h = this.options.h;
    return h('br');
};

Renderer.prototype.del = function(text) {
    // return '<del>' + text + '</del>';

    var h = this.options.h;
    return h('del', {}, text);

};

Renderer.prototype.link = function(href, title, text) {
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
            href: escape(href),
            title: title?title:undefined
        },
        props: {

        }
    }, text);

    // return h('a', {props: {href: '/foo'}}, 'I\'ll take you places!')
};

Renderer.prototype.image = function(href, title, text) {
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

Renderer.prototype.text = function(text) {
    // return text;
    var h = this.options.h;
    return h('span', {}, text);
};

export default Renderer;
