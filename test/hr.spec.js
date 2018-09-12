'use strict';
const chai = require('chai');
const expect = chai.expect;
const vmarked = require('../dist/vmarked');

describe('hr', function() {

    it('* * *', function() {
        let vnodes = vmarked('* * *');

        expect(vnodes).to.have.lengthOf(1);

        expect(vnodes[0]).to.have.property('tag', 'hr');
    });

});
