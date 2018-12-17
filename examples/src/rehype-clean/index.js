var remove = require('unist-util-remove');

module.exports = function () {
    return function (root) {
        remove(root, function (node) {
            return node.type === 'text'
                && node.value
                && node.value.length === 1
                && node.value.codePointAt(0) === 10;
        });
        return root;
    }
};