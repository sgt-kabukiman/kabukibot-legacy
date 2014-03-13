/*
 * Copyright (c) 2014, Sgt. Kabukiman, https://bitbucket.org/sgt-kabukiman/
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

var Dictionary = function(database, log) {
	this.db   = database;
	this.log  = log;
	this.data = {};
};

Dictionary.prototype = {
	load: function(callback) {
		var self = this;

		this.data = {};

		this.db.all('SELECT * FROM dictionary WHERE 1', { }, function(err, rows) {
			var perm, userIdent, i;

			if (err) {
				self.log.error('Could not query the dictionary: ' + err.message);
				return;
			}

			self.log.debug('Loaded ' + rows.length + ' dictionary entries.');

			for (i = 0, len = rows.length; i < len; ++i) {
				self.data[rows[i].keyname] = rows[i].value;
			}

			callback();
		});
	},

	add: function(key, value) {
		if (!(key in this.data)) {
			this.log.debug('Added dictionary key "' + key + '" with "' + value + '".');
			this.db.insert('dictionary', { value: value, keyname: key });

			this.data[key] = value;
		}

		return this;
	},

	set: function(key, value) {
		if (key in this.data) {
			this.log.debug('Updated dictionary key "' + key + '" with "' + value + '".');
			this.db.update('dictionary', { value: value }, { keyname: key });
		}
		else {
			this.log.debug('Added dictionary key "' + key + '" with "' + value + '".');
			this.db.insert('dictionary', { value: value, keyname: key });
		}

		this.data[key] = value;

		return this;
	},

	get: function(key) {
		return (key in this.data) ? this.data[key] : null;
	},

	has: function(key) {
		return (key in this.data);
	},

	del: function(key) {
		if (key in this.data) {
			this.log.debug('Deleted dictionary key "' + key + '".');
			this.db.del('dictionary', { keyname: key });
			delete this.data[key];
		}

		return this;
	}
};

module.exports = Dictionary;