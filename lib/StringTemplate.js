/*
 * Copyright (c) 2014, Sgt. Kabukiman, https://bitbucket.org/sgt-kabukiman/
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

var Mustache = require('mustache');

var StringTemplate = function() {
	this.functions = {};

	this.setFunction('reldate', function(text, render) {
		var
			now = new Date(),
			ref = Date.parse(text),
			day = 60*60*24*1000,
			diff, days;

		if (isNaN(ref)) {
			return '<invalid date: "' + text + '">';
		}

		diff = now - ref;
		days = parseInt(diff / day, 10);

		switch (days) {
			case 0:  return 'today';
			case 1:  return 'yesterday';
			case -1: return 'tomorrow';
			default: return (days > 0) ? (days + ' days ago') : ('in ' + days + ' days');
		}
	});
};

StringTemplate.prototype = {
	setFunction: function(sectionName, callback) {
		this.functions[sectionName] = function() { return callback; };

		return this;
	},

	unsetFunction: function(sectionName) {
		if (sectionName in this.functions) {
			delete this.functions[sectionName];
		}

		return this;
	},

	render: function(string, view, functions) {
		var viewData = {}, key;

		// nothing defined => use preconfigured functions
		if (typeof functions === 'undefined' || functions === true) {
			viewData = this.functions;
		}

		// custom list of functions given => completely override preconfigured functions
		else if (typeof functions === 'object') {
			for (key in functions) {
				if (functions.hasOwnProperty(key)) {
					this.viewData[key] = function() { return functions[key]; };
				}
			}
		}

		// the view overrides any functions
		for (key in view) {
			if (view.hasOwnProperty(key)) {
				this.viewData[key] = view[key];
			}
		}

		return Mustache.render(string, viewData);
	}
};

module.exports = StringTemplate;
