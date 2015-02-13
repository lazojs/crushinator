var crushinator = require('../index');
var chai = require('chai');
var fs = require('fs');

describe('crushinator', function () {

    it('should get module data for lazo node modules', function (done) {
        crushinator('test/application/dist', { modulesDir: 'test/application/node_modules' }, function (err, results) {
            if (err) {
                throw err;
            }

            for (var k in results) {
                results[k].paths.forEach(function (p) {
                    chai.expect(fs.existsSync(p.dest)).to.be.true;
                });
            }
            done();
        });
    });

});