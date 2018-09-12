import { escape } from './helper';
import inline from './inline';

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
    var inline = new InlineLexer(links, options);
    return inline.output(src);
};

/**
 * Lexing/Compiling
 */

InlineLexer.prototype.output = function(src) {
    var out = '',
        link,
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
                text = escape(this.mangle(cap[1]));
                href = 'mailto:' + text;
            } else {
                text = escape(cap[1]);
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
                text = escape(cap[0]);
                href = 'mailto:' + text;
            } else {
                text = escape(cap[0]);
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
                    : escape(cap[0])
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
}

/**
 * Compile Link
 */

InlineLexer.prototype.outputLink = function(cap, link) {
    var href = link.href,
        title = link.title ? escape(link.title) : null;

    return cap[0].charAt(0) !== '!'
        ? this.renderer.link(href, title, this.output(cap[1]))
        : this.renderer.image(href, title, escape(cap[1]));
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


export default InlineLexer;