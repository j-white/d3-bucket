var Bucket = function(args) {
    'use strict';
    this.initialize = function(args) {
        var defaultWidth = 500,
            defaultHeight = 350,
            defaultMargin = 40,
            defaultLevel = 50,
            defaultFillColor,
            defaultPhase = 0,
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
            this.phase(defaultPhase);
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

        if (args.timeShift !== undefined) {
            this.timeShift(args.timeShift);
        } else {
            this.timeShift(Math.random() * Math.PI);
        }

        // Append the SVG container to the HTML element
        this.svg = d3.select(this.element)
            .append('svg:svg')
            .attr('width', this._width)
            .attr('height', this._height);
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

    this.width = function(width) {
        if (width === undefined) {
            return this._width;
        }
        this._width = width;
        this._onDimensionChange();
        return this;
    };

    this.height = function(height) {
        if (height === undefined) {
            return this._height;
        }
        this._height = height;
        this._onDimensionChange();
        return this;
    };

    this.margin = function(margin) {
        if (margin === undefined) {
            return this._margin;
        }
        this._margin = margin;
        this._onDimensionChange();
        return this;
    };

    this.level = function(level) {
        if (level === undefined) {
            return this._level;
        } else {
            this._level = level;
        }
        return this;
    };

    this.phase = function(phase) {
        if (phase === undefined) {
            return this._phase;
        } else {
            this._phase = phase;
        }
        return this;
    };

    this.frequency = function(frequency) {
        if (frequency === undefined) {
            return this._frequency;
        } else {
            this._frequency = frequency;
        }
        return this;
    };

    this.amplitude = function(amplitude) {
        if (amplitude === undefined) {
            return this._amplitude;
        } else {
            this._amplitude = amplitude;
        }
        return this;
    };

    this.timeShift = function(timeShift) {
        if (timeShift === undefined) {
            return this._timeShift;
        } else {
            this._timeShift = timeShift;
        }
        return this;
    };

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
        var t0 = this._timeShift;
        var omega = this._frequency;
        var phi = this._phase;
        var waveFunction = function(x, t) {
            return Math.cos(t + t0) * Math.sin(omega * x + phi);
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
        // Use to draw the bucket's contour
        var bucketContour = [
            {x: 0, y: 100}, // top-left
            {x: 0, y: 0},  // bottom-left
            {x: 100, y: 0}, // bottom-right
            {x: 100, y: 100} //top-right
        ];

        // Redraw the contour over all of the other content
        this.svg.select('#bucketContour').remove();
        this.svg.append('path')
            .attr('id', 'bucketContour')
            .attr('fill', 'none')
            .attr('stroke', 'black')
            .attr('stroke-width', 4)
            .attr('d', this._line(bucketContour));
    };

    this._render = function(t) {
        this._renderFill(t);
        this._renderContour();
    };

    this.render = function(doNotLoop) {
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

        // Stop here if were told not to loop
        if (doNotLoop) {
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