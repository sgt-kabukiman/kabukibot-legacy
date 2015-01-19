/*
 * Copyright (c) 2014, Sgt. Kabukiman, https://bitbucket.org/sgt-kabukiman/
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

var sqlite3 = require('sqlite3');

function SQLite(databaseFile) {
	this.file = databaseFile;
	this.db   = null;
}

SQLite.prototype = {
	connect: function(callback) {
		var db = new sqlite3.Database(this.file, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, function() {
			db.serialize(function() {
				db.run('CREATE TABLE IF NOT EXISTS channel (name VARCHAR(200) PRIMARY KEY)');
				db.run('CREATE TABLE IF NOT EXISTS acl (channel VARCHAR(200), permission VARCHAR(200), user_ident VARCHAR(100), PRIMARY KEY (channel, permission, user_ident))');
				db.run('CREATE TABLE IF NOT EXISTS plugin (channel VARCHAR(200), plugin VARCHAR(100), PRIMARY KEY (channel, plugin))');
				db.run('CREATE TABLE IF NOT EXISTS dictionary (keyname VARCHAR(200), value BLOB, PRIMARY KEY (keyname))');

				if (typeof callback === 'function') {
					callback(db);
				}
			});
		});

		this.db = db;
	},

	disconnect: function(callback) {
		callback();
	},

	onError: function(callback) {
		// TODO
	},

	query: function(query, callback) {
		this.db.run(query, callback);
	},

	serialize: function(callback) {
		return this.db.serialize(callback);
	},

	select: function(table, columns, where, callback) {
		var conditions = [], params = {}, query, placeholder, col;

		for (col in where) {
			placeholder = '$' + col;

			conditions.push(col + ' = ' + placeholder);
			params[placeholder] = where[col];
		}

		query  = 'SELECT ' + (typeof columns === 'string' ? columns : columns.join(',')) + ' ';
		query += 'FROM ' + table + ' ';
		query += 'WHERE ' + (conditions.length === 0 ? '1' : conditions.join(' AND '));

		this.db.all(query, params, callback);
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

	insertMany: function(table, rows, callback) {
		var self = this, db = this.db;

		function insertRow(err) {
			if (err) {
				db.run('ROLLBACK', function() {
					throw err;
				});
			}
			else {
				if (rows.length > 0) {
					row  = rows[0];
					rows = rows.splice(1);

					self.insert(table, row, insertRow);
				}
				else {
					db.run('COMMIT', callback);
				}
			}
		}

		db.run('BEGIN TRANSACTION', insertRow);
	},

	update: function(table, data, where, callback) {
		var updates = [], whereConditions = [], params = {}, query, placeholder, col;

		for (col in data) {
			placeholder = '$update_' + col;

			updates.push(col + ' = ' + placeholder);
			params[placeholder] = data[col];
		}

		for (col in where) {
			placeholder = '$where_' + col;

			whereConditions.push(col + ' = ' + placeholder);
			params[placeholder] = where[col];
		}

		// UPDATE table SET col = $col, col = $col WHERE col = $col AND col = $col

		query = 'UPDATE ' + table + ' SET ' + updates.join(',') + ' WHERE ' + whereConditions.join(' AND ');

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

module.exports = SQLite;
