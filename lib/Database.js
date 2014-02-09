/*
 * Copyright (c) 2014, Sgt. Kabukiman, https://bitbucket.org/sgt-kabukiman/
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

var sqlite3 = require('sqlite3');

var Database = function(databaseFile) {
	this.file = databaseFile;
	this.db   = null;
};

Database.prototype = {
	connect: function(callback) {
		var db = new sqlite3.Database(this.file, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, function() {
			db.serialize(function() {
				db.run('CREATE TABLE IF NOT EXISTS channel (name VARCHAR(200) PRIMARY KEY)');
				db.run('CREATE TABLE IF NOT EXISTS acl (channel VARCHAR(200), permission VARCHAR(200), user_ident VARCHAR(100))');

				if (typeof callback === 'function') {
					callback(db);
				}
			});
		});

		this.db = db;
	},

	all: function(query, params, callback) {
		return this.db.all(query, params, callback);
	},

	insert: function(table, data, callback) {
		var cols = [], placeholders = [], params = {}, query, placeholder, col;

		for (col in data) {
			placeholder = '$' + col;

			cols.push(col);
			placeholders.push(placeholder);
			params[placeholder] = data[col];
		}

		query = 'INSERT INTO ' + table + ' (' + cols.join(',') + ') VALUES (' + placeholders.join(',') + ')';

		this.db.run(query, params, callback);
	},

	del: function(table, where, callback) {
		var conditions = [], params = {}, query, placeholder, col;

		for (col in where) {
			placeholder = '$' + col;

			conditions.push(col + ' = ' + placeholder);
			params[placeholder] = where[col];
		}

		query = 'DELETE FROM ' + table + ' WHERE ' + conditions.join(' AND ');

		this.db.run(query, params, callback);
	}
};

module.exports = Database;
