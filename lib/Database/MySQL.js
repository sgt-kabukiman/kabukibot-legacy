/*
 * Copyright (c) 2015, Sgt. Kabukiman, https://github.com/sgt-kabukiman
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

var mysql = require('mysql');

function MySQL(connectionOptions) {
	this.opt          = connectionOptions;
	this.db           = null;
	this.errorHandler = null;
}

MySQL.prototype = {
	connect: function(callback) {
		var db = mysql.createConnection(this.opt), errorHandler = this.errorHandler;

		db.connect(function(err) {
			if (err) {
				if (errorHandler) {
					errorHandler(err);
					return;
				}

				throw 'Cannot connect to database: ' + err;
			}

			if (errorHandler) {
				db.on('error', errorHandler);
			}

			db.query('CREATE TABLE IF NOT EXISTS channel (name VARCHAR(200) PRIMARY KEY) DEFAULT CHARACTER SET utf8 COLLATE utf8_unicode_ci ENGINE = InnoDB');
			db.query('CREATE TABLE IF NOT EXISTS acl (channel VARCHAR(200), permission VARCHAR(200), user_ident VARCHAR(100), PRIMARY KEY (channel, permission, user_ident)) DEFAULT CHARACTER SET utf8 COLLATE utf8_unicode_ci ENGINE = InnoDB');
			db.query('CREATE TABLE IF NOT EXISTS plugin (channel VARCHAR(200), plugin VARCHAR(100), PRIMARY KEY (channel, plugin)) DEFAULT CHARACTER SET utf8 COLLATE utf8_unicode_ci ENGINE = InnoDB');
			db.query('CREATE TABLE IF NOT EXISTS dictionary (keyname VARCHAR(200), value VARCHAR(8192), PRIMARY KEY (keyname)) DEFAULT CHARACTER SET utf8 COLLATE utf8_unicode_ci ENGINE = InnoDB');

			callback();
		});

		this.db = db;
	},

	disconnect: function(callback) {
		this.db.end(callback);
	},

	onError: function(callback) {
		this.errorHandler = callback;

		if (this.db) {
			this.db.on('error', callback);
		}
	},

	query: function(query, callback) {
		this.db.query(query, callback);
	},

	serialize: function(callback) {
		return callback();
	},

	select: function(table, columns, where, callback) {
		var
			params = [],
			query  = 'SELECT ',
			key;

		if (typeof columns === 'string') {
			query += ' ' + columns;
			params = [table];
		}
		else {
			query += ' ??';
			params = [columns, table];
		}

		query += ' FROM ?? WHERE 1';

		for (key in where) {
			params.push(key);
			params.push(where[key]);

			query += ' AND ?? = ?';
		}

		this.db.query(query, params, callback);
	},

	insert: function(table, data, callback) {
		this.db.query('INSERT INTO ' + table + ' SET ?', data, callback);
	},

	insertMany: function(table, rows, callback) {
		var self = this, db = this.db;

		function insertRow(err) {
			if (err) {
				db.rollback(function() {
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
					db.commit(callback);
				}
			}
		}

		db.beginTransaction(insertRow);
	},

	update: function(table, data, where, callback) {
		var conditions = ['1'], params = [table, data], col;

		for (col in where) {
			params.push(col);
			params.push(where[col]);

			conditions.push('?? = ?');
		}

		this.db.query('UPDATE ?? SET ? WHERE ' + conditions.join(' AND '), params, callback);
	},

	del: function(table, where, callback) {
		var conditions = [], params = [table], col;

		for (col in where) {
			params.push(col);
			params.push(where[col]);

			conditions.push('?? = ?');
		}

		this.db.query('DELETE FROM ?? WHERE ' + conditions.join(' AND '), params, callback);
	}
};

module.exports = MySQL;
