var Bucket = function(args) {
    this.initialize = function(args) {
        if (!args.element) throw "Bucket needs a reference to an element";
        if (args.element.nodeType !== 1) throw "Bucket element was defined but not an HTML element";
        this.element = args.element;

        this.margin = 40;

        if (args.wavePhase) {
            this.wavePhase = args.wavePhase;
        } else {
            this.wavePhase = 0;
        }

        if (args.waveFrequency) {
            this.waveFrequency = args.waveFrequency;
        } else {
            this.waveFrequency = 0.2;
        }

        if (args.waveHeight) {
            this.waveHeight = args.waveHeight;
        } else {
            this.waveHeight = 5;
        }

        this.timeShift = Math.random() * Math.PI;

        this.defaultLevel = 50;
        this.defaultWidth = 500;
        this.defaultHeight = 350;

        this.setLevel(args.level);
        this.setSize({ width: args.width, height: args.height });

        this.svg = d3.select(this.element)
            .append("svg:svg")
            .attr('width', this.width)
            .attr('height', this.height);

        var x = d3.scale.linear()
            .domain([0, 100])
            .range([this.margin, this.width - this.margin]);
        var y = d3.scale.linear()
            .domain([0, 100])
            .range([this.height - this.margin, this.margin]);
        this._line = d3.svg.line()
            .x(function(d){return x(d.x);})
            .y(function(d){return y(d.y);})
            .interpolate("linear");
    };

    this.fillColor = function() {
        if (this.level < 75) {
            return "green";
        } else if (this.level < 90) {
            return "yellow";
        } else {
            return "red";
        }
    };

    this.setLevel = function(level) {
        if (level === undefined) {
            this.level = this.defaultLevel;
        } else {
            this.level = level;
        }

        return this;
    };

    this.setSize = function(args) {
        var style,
            elementWidth,
            elementHeight;

        if (typeof window !== undefined) {
            style = window.getComputedStyle(this.element, null);
            elementWidth = parseInt(style.getPropertyValue('width'), 0);
            elementHeight = parseInt(style.getPropertyValue('height'), 0);
        }

        args = args || {};
        this.width = args.width || elementWidth || this.defaultWidth;
        this.height = args.height || elementHeight || this.defaultHeight;

        if (this.svg !== undefined) {
            this.svg.attr('width', this.width).attr('height', this.height);
        }

        return this;
    };

    this._renderFill = function() {
        var bucketFill = function(level){ return [
            {x: 0, y: level}, // top-left
            {x: 0, y: 0},  // bottom-left
            {x: 100, y: 0}, // bottom-right
            {x: 100, y: level} //top-right
        ]};
        if (this.fill === undefined) {
            this.fill = this.svg.append("path")
                .attr('id', 'bucketFill')
                .attr("class", "line");
        }
        if (this.fill.attr('level') !== this.level) {
            this.fill.attr('level', this.level)
                .attr('fill', this.fillColor())
                .attr("d", this._line(bucketFill(this.level)));
        }
    };

    this._generateWaveVector = function(t) {
        var level = this.level;

        // Make the wave height proportional to the current level
        // - the higher the level, the higher the wave
        var waveHeight = this.waveHeight * (level / 100);
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
        var t0 = this.timeShift;
        var omega = this.waveFrequency;
        var phi = this.wavePhase;
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

        /*
         Add extra points to close the loop.
         */
        var bufferLength = Math.min(5, level);
        var before = [
            {x: 0,y: level - bufferLength},
            {x: 0,y: level}
        ];
        var after = [
            {x: 100, y: level},
            {x: 100, y: level - bufferLength},
            {x: 0,y: level - bufferLength}
        ];
        return before.concat(vector).concat(after);
    };

    this._renderWave = function(t) {
        if (this.wave === undefined) {
            this.wave = this.svg.append("path")
                .attr('id', 'wavePath')
                .attr("class", "line");
        }
        this.wave.attr('fill', this.fillColor())
            .attr("stroke", this.fillColor())
            .attr("d", this._line(this._generateWaveVector(t)));
    };

    this._renderContour = function(t) {
        // Use to draw the bucket's contour
        var bucketContour = [
            {x: 0, y: 100}, // top-left
            {x: 0, y: 0},  // bottom-left
            {x: 100, y: 0}, // bottom-right
            {x: 100, y: 100} //top-right
        ];

        // Redraw the contour over all of the other content
        this.svg.select("#bucketContour").remove();
        this.svg.append("path")
            .attr('id', 'bucketContour')
            .attr('fill', 'none')
            .attr("stroke", "black")
            .attr("stroke-width", 4)
            .attr("d", this._line(bucketContour));
    };

    this._render = function(t) {
        this._renderFill(t);
        this._renderWave(t);
        this._renderContour(t);
    };

    this.render = function() {
        var bucket = this;
        var t = 0;
        bucket._render(t);
        setInterval(function () {
            bucket._render(t);
            t += 100;
        }, 100);
    };

    this.initialize(args);
};

