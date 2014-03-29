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
    describe('.initialize', function () {
        it('should generate svg', function () {
            expect(svg().empty()).toBeFalsy();
        });
        it('should use the given width and height', function () {
            expect(svg().attr('width')).toBe('350');
            expect(svg().attr('height')).toBe('350');
        });
    });
    describe('.width', function() {
       it('should allow setting and retrieving the width', function() {
           expect(bucket.width(400).width()).toBe(400);
           expect(svg().attr('width')).toBe('400');
       });
    });
    describe('.level', function () {
        it('should allow setting and retrieving the level', function () {
            expect(bucket.level(75).level()).toBe(75);
        });
    });
    function svg() {
        return div.select('svg');
    }
});
