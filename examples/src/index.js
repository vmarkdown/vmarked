import marked from '../../index';
const md = require('../md/demo.md');

// document.getElementById('app').innerHTML = html;
const unified = require('unified');
const clean = require('./rehype-clean');
const rehype2react = require('rehype-react');
const h = React.createElement;

const processor = unified()
    .use(require('rehype-parse'), {fragment:true})
    .use(clean)
    .use(function () {
        return function (root, file) {
            // console.log(file.contents);
            console.log(root);
            return root;
        }
    })
    .use(rehype2react, {
        createElement: h
    });

const MarkdownIt = require('markdown-it');
function compile_MarkdownIt(md) {
    // var md = new MarkdownIt();
    var parser = new MarkdownIt();
    console.time('markdown-it');
    var result = parser.render(md);
    console.timeEnd('markdown-it');
    return result;
}

function compile_marked(md) {
    // var md = new MarkdownIt();
    console.time('marked');
    const html = marked(md, {
        breaks: true
    });
    console.timeEnd('marked');
    return html;
}


function compile(md) {
    return compile_marked(md);
}

async function parse(html) {
    const file = await processor.process(html);
    const vdom = file.contents;
    return vdom;
}

function render(vdom) {
    console.time('render');
    ReactDOM.render(h('div',{className:['markdown-body']}, vdom), document.getElementById('app'));
    console.timeEnd('render');
}


async function process(md) {
    console.time('all');
    const html = compile(md);
    const vdom = await parse(html);
    render(vdom);
    console.timeEnd('all');
}
(async()=>{

    console.log(marked.lexer(md));
    await process(md);
    // setTimeout(async function () {
    //     await render(md.replace(/Markdown/g,'======='));
    // }, 3000);
})();


