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

export function parse(html, options) {
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

