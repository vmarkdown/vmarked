// import marked from '../index';
// console.log(marked('# h1'));

const marked = require('../dist/vmarked.js');

const fs = require('fs');

const md = fs.readFileSync('./maxiang.md', 'utf-8');

console.log(marked(md));
