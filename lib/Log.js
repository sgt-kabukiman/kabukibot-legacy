/*
 * Copyright (c) 2014, Sgt. Kabukiman, https://bitbucket.org/sgt-kabukiman/
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

var Log = function(name, level) {
	this.name      = name;
	this.level     = level || Log.DEBUG;
	this.formatter = function(log, level, message) {
		return '[' + log.getLevelName(level, true).toUpperCase() + '] ' + message;
	};
};

Log.DEBUG   = 1;
Log.INFO    = 2;
Log.WARNING = 3;
Log.ERROR   = 4;

Log.prototype = {
	getLevelName: function(level, shortName) {
		switch (level) {
			case Log.DEBUG:   return shortName ? 'dbg' : 'debug';
			case Log.INFO:    return shortName ? 'inf' : 'info';
			case Log.WARNING: return shortName ? 'wrn' : 'warning';
			case Log.ERROR:   return shortName ? 'err' : 'error';
		}

		return '[?]';
	},

	setFormatter: function(formatter) {
		this.formatter = formatter;
	},

	debug: function(message) {
		this.log(Log.DEBUG, message);
	},

	info: function(message) {
		this.log(Log.INFO, message);
	},

	warning: function(message) {
		this.log(Log.WARNING, message);
	},

	error: function(message) {
		this.log(Log.ERROR, message);
	},

	ircMessage: function(chan, username, message) {
		this.info('[#' + chan + '] ' + username + ': ' + message);
	},

	log: function(level, message) {
		if (level >= this.level) {
			console.log(this.formatter(this, level, message));
		}
	}
};

module.exports = Log;
