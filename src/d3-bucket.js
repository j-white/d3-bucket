/**
 * An animated bucket with a surface wave created with D3.
 *
 * @constructor
 * @param {object} args Initial configuration.
 * @param {string} [args.width] Width of the SVG container.
 * @param {string} [args.height] Height of the SVG container.
 * @param {string} [args.margin] Left, right, top and bottom margin used within SVG container.
 * @param {number} [args.level] Level of the bucket, where 0 <= level <= 100.
 * @param {function} [args.fillColor] Callback used to determine the fill's color from the current level.
 * @param {number} [args.phase] Phase shift of the surface wave, , 0 <= frequency <= 2 Pi.
 * @param {number} [args.frequency] Frequency of the surface wave, 0 <= frequency <= 2 Pi.
 * @param {number} [args.amplitude] Amplitude of the surface wave, 0 <= amplitude <= 100.
 */
var Bucket = function(args) {
    'use strict';
    this.initialize = function(args) {
        var defaultWidth = 500,
            defaultHeight = 350,
            defaultMargin = 40,
            defaultLevel = 50,
            defaultFillColor,
            defaultFrequency = 0.18,
            defaultAmplitude = 6,
            style,
            elementWidth = 0,
            elementHeight = 0;

        if (!args.element) {
            throw 'Bucket needs a reference to an element';
        }
        if (args.element.nodeType !== 1) {
            throw 'Bucket element was defined but not an HTML element';
        }
        this.element = args.element;

        // Determine the element's current size, if possible
        if (typeof window !== 'undefined') {
            style = window.getComputedStyle(this.element, null);
            elementWidth = parseInt(style.getPropertyValue('width'), 0);
            elementHeight = parseInt(style.getPropertyValue('height'), 0);
        }

        // Use the given dimensions, if specified, otherwise fallback to the element's dimensions.
        // If those are unavailable, use the defaults.
        this.width(args.width || elementWidth || defaultWidth);
        this.height(args.height || elementHeight || defaultHeight);

        if (args.margin !== undefined) {
            this.margin(args.margin);
        } else {
            this.margin(defaultMargin);
        }

        if (args.level !== undefined) {
            this.level(args.level);
        } else {
            this.level(defaultLevel);
        }

        defaultFillColor = function(level) {
            if (level < 75) {
                return 'green';
            } else if (level < 90) {
                return 'yellow';
            } else {
                return 'red';
            }
        };

        if (args.fillColor !== undefined) {
            this.fillColor(args.fillColor);
        } else {
            this.fillColor(defaultFillColor);
        }

        if (args.phase !== undefined) {
            this.phase(args.phase);
        } else {
            this.phase(Math.random() * Math.PI);
        }

        if (args.frequency !== undefined) {
            this.frequency(args.frequency);
        } else {
            this.frequency(defaultFrequency);
        }

        if (args.amplitude !== undefined) {
            this.amplitude(args.amplitude);
        } else {
            this.amplitude(defaultAmplitude);
        }

        // Append the SVG container to the HTML element
        this.svg = d3.select(this.element)
            .append('svg:svg')
            .attr('width', this._width)
            .attr('height', this._height);

        // Save the bucket's contour since it does not change
        this._bucketContour = [
            {x: 0, y: 100}, // top-left
            {x: 0, y: 0},  // bottom-left
            {x: 100, y: 0}, // bottom-right
            {x: 100, y: 100} //top-right
        ];
    };

    this._onDimensionChange = function() {
        // Do nothing if any of the dimensions are undefined.
        if (this._width === undefined ||
            this._height === undefined ||
            this._margin === undefined) {
            return;
        }

        if (this.svg !== undefined) {
            this.svg.attr('width', this._width).attr('height', this._height);
        }

        // Setup our scales. The other functions will assume the canvas has
        // a domain of { (x,y) | 0 <= x <= 100, 0 <= y <= 100 }
        var x = d3.scale.linear()
            .domain([0, 100])
            .range([this._margin, this._width - this._margin]);

        var y = d3.scale.linear()
            .domain([0, 100])
            .range([this._height - this._margin, this._margin]);

        // Our line generating function used when drawing paths
        this._line = d3.svg.line()
            .x(function(d){return x(d.x);})
            .y(function(d){return y(d.y);})
            .interpolate('linear');
    };

    /** Sets or retrieves the width of the SVG container.
     * @param {?string} width - The width of the SVG container.
     * @return {string|Bucket} The current width if none was specified, or a reference to the current bucket.
     * @example
     * bucket.width('100px')
     * bucket.width('100%')
     * var width = bucket.width()
     */
    this.width = function(width) {
        if (width === undefined) {
            return this._width;
        }
        this._width = width;
        this._onDimensionChange();
        return this;
    };

    /** Sets or retrieves the height of the SVG container.
     * @param {?string} height - The height of the SVG container.
     * @return {string|Bucket} The current height if none was specified, or a reference to the current bucket.
     * @example
     * bucket.height('100px')
     * bucket.height('100%')
     * var height = bucket.height()
     */
    this.height = function(height) {
        if (height === undefined) {
            return this._height;
        }
        this._height = height;
        this._onDimensionChange();
        return this;
    };

    /** Sets or retrieves the inner margin used when drawing the contents of the SVG container.
     * @param {?string} margin - The left,right,top and bottom margin used within SVG container.
     * @return {string|Bucket} The current margin if none was specified, or a reference to the current bucket.
     * @example
     * bucket.margin('30px')
     * bucket.margin('25%')
     * var margin = bucket.margin()
     */
    this.margin = function(margin) {
        if (margin === undefined) {
            return this._margin;
        }
        this._margin = margin;
        this._onDimensionChange();
        return this;
    };

    /** Sets or retrieves the level of the bucket's fill.
     * @param {?number} level - The level of the bucket, where 0 <= level <= 100.
     * @return {number|Bucket} The current level if none was specified, or a reference to the current bucket.
     * @example
     * bucket.level(10)
     * var level = bucket.level()
     */
    this.level = function(level) {
        if (level === undefined) {
            return this._level;
        } else {
            this._level = level;
        }
        return this;
    };

    /** Sets or retrieves the phase shift of the fill's surface wave.
     * This can be used to offset the wave if multiple buckets are drawn on the same page.
     * A random value is used by default.
     *
     * @param {?number} phase - The wave's phase shift, where 0 <= phase <= 2 Pi.
     * @return {number|Bucket} The current phase shift if none was specified, or a reference to the current bucket.
     * @example
     * bucket.phase(0.5 * Math.PI)
     * var phase = bucket.phase()
     */
    this.phase = function(phase) {
        if (phase === undefined) {
            return this._phase;
        } else {
            this._phase = phase;
        }
        return this;
    };

    /** Sets or retrieves the frequency of the fill's surface wave.
     * With a higher frequency there will be more narrower peeks on the fill's surface.
     *
     * @param {?number} frequency - The wave's frequency, where 0 <= frequency <= 2 Pi.
     * @return {number|Bucket} The current frequency if none was specified, or a reference to the current bucket.
     * @example
     * bucket.frequency(0.5 * Math.PI)
     * var frequency = bucket.frequency()
     */
    this.frequency = function(frequency) {
        if (frequency === undefined) {
            return this._frequency;
        } else {
            this._frequency = frequency;
        }
        return this;
    };

    /** Sets or retrieves the amplitude of the fill's surface wave.
     * The amplitude is made relative to the buckets height, where 100 denotes the full height of a bucket.
     * The amplitude is also scaled based on the bucket current level, only a fraction of the amplitude is used
     * when the level is low.
     *
     * @param {?number} amplitude - The wave's amplitude, where 0 <= amplitude <= 100.
     * @return {number|Bucket} The current amplitude if none was specified, or a reference to the current bucket.
     * @example
     * bucket.amplitude(50)
     * var amplitude = bucket.amplitude()
     */
    this.amplitude = function(amplitude) {
        if (amplitude === undefined) {
            return this._amplitude;
        } else {
            this._amplitude = amplitude;
        }
        return this;
    };

    /** Sets or retrieves the fill color generator function.
     * Given a 0 <= level <= 100, the function should return a color (string) suitable for setting
     * the fill's (an SVG path) 'fill' and 'stroke' attributes.
     *
     * @callback fillColor - The fill color generator function.
     * @return {function|Bucket} The fill color generator function if none was specified, or a reference to the current bucket.
     * @example
     * bucket.fillColor(function(level){ return "green"; })
     * var fillColor = bucket.fillColor()
     * fillColor(100)
     */
    this.fillColor = function(fillColor) {
        if (fillColor === undefined) {
            return this._fillColor;
        } else {
            this._fillColor = fillColor;
        }
        return this;
    };

    this._generateWaveVector = function(t) {
        var level = this._level;

        // Make the wave height proportional to the current level
        // - the higher the level, the higher the wave
        var waveHeight = this._amplitude * (level / 100);
        waveHeight = Math.max(waveHeight, 1);

        // Scale the range our wave function to the available
        // to the given height, using the available space over the fill
        var waveY = d3.scale.linear()
            .domain([-1, 1])
            .range([
                Math.max(0, level-1),
                Math.min(level + waveHeight - 1, 101)
            ]);

        // Our wave function
        var omega = this._frequency;
        var phi = this._phase;
        var waveFunction = function(x, t) {
            return Math.cos(t) * Math.sin(omega * x + phi);
        };

        // Generate the vector
        var vector = d3.range(100).map(function(x){
            return {
                'x': x,
                'y': waveY(waveFunction(x, t))
            };
        });

        // Add the lower portion of the bucket (bellow the wave)
        // to the path, and close the loop.
        var before = [
            {x: 0,y: 0},
            {x: 0,y: level}
        ];
        var after = [
            {x: 100, y: level},
            {x: 100, y: 0},
            {x: 0, y: 0}
        ];
        return before.concat(vector).concat(after);
    };

    this._renderFill = function(t) {
        var fill = this.svg.select('#fillPath');
        if (fill.empty()) {
            fill = this.svg.append('path')
                .attr('id', 'fillPath')
                .attr('class', 'line');
        }
        fill.attr('fill', this._fillColor(this.level()))
            .attr('stroke', this._fillColor(this.level()))
            .attr('d', this._line(this._generateWaveVector(t)));
    };

    this._renderContour = function() {
        this.svg.select('#bucketContour').remove();
        this.svg.append('path')
            .attr('id', 'bucketContour')
            .attr('fill', 'none')
            .attr('stroke', 'black')
            .attr('stroke-width', 4)
            .attr('d', this._line(this._bucketContour));
    };

    this._render = function(t) {
        this._renderFill(t);
        // Always draw the contour last
        this._renderContour();
    };


    /** Renders the bucket and animates the surface wave by redrawing the bucket
     * every 100ms.
     *
     * @param {?boolean} animate - If set the false, the bucket will be drawn but the surface wave will not be animated.
     * @return {Bucket} A reference to the current bucket.
     * @example
     * bucket.render()
     * bucket.render(false)
     */
    this.render = function(animate) {
        // Cancel any previous timers
        if (this._renderInterval !== undefined) {
            clearInterval(this._renderInterval);
            this._renderInterval = undefined;
        }

        // Clear the container
        this.svg.selectAll('*').remove();

        // Render the scene
        var bucket = this;
        var t = 0;
        bucket._render(t);

        // Stop here if were told not to animate
        if (animate === false) {
            return this;
        }

        // Otherwise re-draw the scene every 100ms to animate the wave
        this._renderInterval = setInterval(function () {
            bucket._render(t);
            t += 100;
        }, 100);

        return this;
    };

    this.initialize(args);
};