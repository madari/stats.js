/*
 * stats.js r5
 * http://github.com/mrdoob/stats.js
 *
 * Released under MIT license:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * How to use:
 *
 *  var stats = Stats.Builtin.FPS();
 *  parentElement.appendChild(stats.getElement());
 *
 *  setInterval(function () {
 *
 *  	stats.update();
 *
 *  }, 1000/60);
 *
 */

function Stats(name, period, options) {
	options = options || {};
	this.palette = options.palette || Stats.Palettes.Grayscale;
	this.width = options.width || 74;
	this.height = options.height || 30;

	this.mode = options.mode || Stats.Modes.Average;
	this.name = name;
	this.count = this.lastUpdate = this.lastRender = this.max = this.accumulated = 0;
	this.min = 0xFFFFFF;
	this.period = period || 0;

	this.canvas = document.createElement('canvas');
	this.canvas.width = this.width;
	this.canvas.height = this.height;
	this.context = this.canvas.getContext('2d');
	this.clear();

	this.title = document.createElement('div');
	this.title.innerHTML = '<strong>' + name + '</strong>';

	this.container = document.createElement('div');
	this.container.id = options.id || 'stats-' + name;
	this.container.className = options.className || 'stats';
	this.container.style.width = this.width + 3 + 'px';
	this.container.style.fontFamily = 'Helvetica, Arial, sans-serif';
	this.container.style.textAlign = 'left';
	this.container.style.textTransform = 'uppercase';
	this.container.style.fontSize = '9px';
	this.container.style.opacity = '0.9';
	this.container.style.color = 'rgb(' + this.palette.fg[0] + ',' + this.palette.fg[1] + ',' + this.palette.fg[2] + ')';
	this.container.style.backgroundColor = 'rgb(' + Math.floor(this.palette.bg[0] / 2) + ',' + Math.floor(this.palette.bg[1] / 2) + ',' + Math.floor(this.palette.bg[2] / 2) + ')';
	this.container.style.padding = '2px 0px 3px 3px';

	this.container.appendChild(this.title);
	this.container.appendChild(this.canvas);
};

Stats.prototype.clear = function() {
	this.context.fillStyle = 'rgb(' + this.palette.bg[0] + ',' + this.palette.bg[1] + ',' + this.palette.bg[2] + ')';
	this.context.fillRect(0, 0, this.width, this.height);
	this.contextData = this.context.getImageData(0, 0, this.width, this.height);
};

Stats.prototype.getElement = function() {
	return this.container;
};

Stats.prototype.translate = function(y) {
	var data = this.context.getImageData(0, 0, this.width, this.height - y);
	this.clear();
	this.context.putImageData(data, 0, y);
	this.contextData = this.context.getImageData(0, 0, this.width, this.height);
};

Stats.prototype.render = function(value) {
	var y, x, pl = 0, pr = 4, data = this.contextData.data;
	value = this.height - Math.min(value, this.height);

	for (y = 0; y < this.height; y++) {
		for (x = 0; x < this.width - 1; x++) {
			data[pl++] = data[pr++];
			data[pl++] = data[pr++];
			data[pl++] = data[pr++];
			++pl;
			++pr;
		}
		if (y < value) {
			data[pl++] = this.palette.bg[0];
			data[pl++] = this.palette.bg[1];
			data[pl++] = this.palette.bg[2];
			++pl;
		} else {
			data[pl++] = this.palette.fg[0];
			data[pl++] = this.palette.fg[1];
			data[pl++] = this.palette.fg[2];
			++pl;
		}
		pr += 4;
	}

	this.context.putImageData(this.contextData, 0, 0);
};

Stats.prototype.update = function(value) {
	var title, now = new Date().getTime();
	value = value || 1;

	if (this.lastUpdate > 0) {
		if (this.period > 0) {
			switch (this.mode) {
				case Stats.Modes.Average:
					this.count++;

				case Stats.Modes.Cumulative:
					this.accumulated += value;
					break;

				default:
					this.accumulated = value;
			}
			if (now > this.lastRender + this.period) {
				value = this.accumulated;
				this.accumulated = 0;
				if (this.count > 0) {
					value /= this.count;
				}
				this.count = 0;
			} else {
				value = null;
			}
		} else {
			value = this.mode == Stats.Modes.Interval ? now - this.lastUpdate : value;
		}
	} else {
		this.lastRender = now;
		value = null;
	}

	if (value !== null) {
		if (value < this.min) {
			this.min = value;
		}
		if (value > this.max) {
			this.translate(value - this.max);
			this.max = value;
		}

		this.render(value / this.max * this.height / 1.2);
		this.lastRender = now;

		title = '<strong>' + Stats.FormatValue(value) + ' ' + this.name + '</strong> ';
		title += '(<span>' + Stats.FormatValue(this.min) + '</span>-<span>' + Stats.FormatValue(this.max) + '</span>)';
		this.title.innerHTML = title;
	}

	this.lastUpdate = new Date().getTime();
};

Stats.FormatValue = function(value) {
	return value >= 1000 ? Math.round(value / 100) / 10 + 'k' : Math.round(value);
};

Stats.Modes = {
	Average: 0,
	Cumulative: 1,
	Single: 2,
	Interval: 3
};

Stats.Palettes = {
	Grayscale: { fg: [200, 200, 200], bg: [16, 16, 16] },
	Green: { fg: [0, 255, 0], bg: [16, 48, 16] },
	Cyan: { fg: [0, 255, 255], bg: [16, 16, 48] },
	Red: { fg: [255, 0, 0], bg: [48, 16, 16] }
};

Stats.Builtin = {
	FPS: function() {
		return new Stats('fps', 1000, { palette: Stats.Palettes.Cyan, mode: Stats.Modes.Cumulative });
	},
	MS: function() {
		return new Stats('ms', 0, { palette: Stats.Palettes.Green, mode: Stats.Modes.Interval });
	},
	Mem: function() {
		var s = new Stats('mem', 1000, { palette: Stats.Palettes.Red, mode: Stats.Modes.Single });
		s._update = s.update;
		s.update = function() {
			if (new Date().getTime() > s.lastRender + s.period) {
				s._update(webkitPerformance.memory.usedJSHeapSize * 0.000000954);
			}
		}
		return s;
	}
};
