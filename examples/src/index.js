import marked from '../../index';
const md = require('../md/cmd.md');

// document.getElementById('app').innerHTML = html;
const unified = require('unified');
const parse = require('rehype-parse');
const clean = require('./rehype-clean');
const rehype2react = require('rehype-react');
const h = React.createElement;

// console.time('parse');
const processor = unified()
    .use(parse, {fragment:true})
    .use(clean)
    .use(function () {
        return function (root) {
            console.log(root);
            return root;
        }
    })
    .use(rehype2react, {
        createElement: h
    });
// console.timeEnd('parse');

(async()=>{

    console.time('marked');

    const html = marked(md, {
        breaks: true
    });
    console.timeEnd('marked');

    console.time('vdom');
    const file = await processor.process(html);
    console.timeEnd('vdom');

    // const hast = processor.parse(html);
    // console.log(hast);

    const vdom = file.contents;
    console.log(vdom);

    console.time('render');
    ReactDOM.render(h('div',{className:['markdown-body']}, vdom), document.getElementById('app'));
    console.timeEnd('render');


})();


