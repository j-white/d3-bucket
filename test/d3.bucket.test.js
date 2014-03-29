/**
 * Created by jwhite on 3/29/14.
 */

describe('Bucket', function () {
    var div,
        bucket;
    beforeEach(function () {
        div = d3.select('body').append('div');
        bucket = new Bucket({
            element: div.node(),
            width: 350,
            height: 350,
            level: 50
        });
    });
    afterEach(function () {
        div.remove();
    });
    describe('.data', function () {
        it('should allow setting and retrieving the level',
            function () {
                expect(bucket.level(75).level()).toBe(75);
            });
    });
});
