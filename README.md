vmarked
========

create vdom by marked


First install the module into your project:

```
npm install vmarked --save
```

```javascript
const vmarked = require('vmarked');

const markdown = `# h1 Heading 8-)
## h2 Heading
### h3 Heading
#### h4 Heading
##### h5 Heading
###### h6 Heading`;

var vnodes = vmarked(markdown);

console.log(vnodes);
```

output:
```
[
    0: {nodeName: "h1", attributes: {…}, children: Array(1), key: undefined}
    1: {nodeName: "h2", attributes: {…}, children: Array(1), key: undefined}
    2: {nodeName: "h3", attributes: {…}, children: Array(1), key: undefined}
    3: {nodeName: "h4", attributes: {…}, children: Array(1), key: undefined}
    4: {nodeName: "h5", attributes: {…}, children: Array(1), key: undefined}
    5: {nodeName: "h6", attributes: {…}, children: Array(1), key: undefined}
]
```

# License

MIT
