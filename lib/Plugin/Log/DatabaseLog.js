/*
 * Copyright (c) 2015, Sgt. Kabukiman, https://github.com/sgt-kabukiman
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

var Utils = require('./../../Utils.js');
var MySQL = require('./../../Database/MySQL.js');

function DatabaseLog(db, channel) {
	var query;

	this.isResponseLog = channel === null;
	this.table         = this.isResponseLog ? 'log_responses' : ('log_chan_' + channel);
	this.db            = db;
	this.ready         = false;

	if (this.isResponseLog) {
		query = 'CREATE TABLE IF NOT EXISTS ' + this.table + ' (id INT UNSIGNED AUTO_INCREMENT, date DATETIME NOT NULL, channel VARCHAR(200) NOT NULL, sender VARCHAR(200) NOT NULL, message TEXT NOT NULL, PRIMARY KEY (id))';
	}
	else {
		query = 'CREATE TABLE IF NOT EXISTS ' + this.table + ' (id INT UNSIGNED AUTO_INCREMENT, date DATETIME NOT NULL, sender VARCHAR(200) NOT NULL, message TEXT NOT NULL, PRIMARY KEY (id))';
	}

	if (db instanceof MySQL) {
		query += ' DEFAULT CHARACTER SET utf8 COLLATE utf8_unicode_ci ENGINE = InnoDB';
	}

	var self = this;
	db.query(query, function() {
		self.ready = true;
	});
}

function now() {
	return Utils.dateToSQL(new Date());
}

var _ = DatabaseLog.prototype;

_.textMessage = function(msg) {
	var row = {
		sender:  msg.getUser().getPrefix() + msg.getUser().getName(),
		date:    now(),
		message: msg.getMessage().trim()
	};

	if (this.isResponseLog) {
		row.channel = msg.getChannel().getName();
	}

	if (this.ready) {
		this.db.insert(this.table, row);
	}
};

_.twitchMessage = function(msg) {
	var user = msg.getUsername();
	var line = '';

	switch (msg.getCommand()) {
		case 'clearchat':
			if (user) {
				line = '<' + user + ' has been timed out>';
			}
			else {
				line = '<channel has been cleared>';
			}
			break;

		case 'subscriber':
			line = '<' + user + ' just subscribed!>';
			break;
	}

	if (line.length > 0) {
		var row = {
			sender:  '$twitch',
			date:    now(),
			message: line
		};

		if (this.isResponseLog) {
			row.channel = msg.getChannel().getName();
		}

		if (this.ready) {
			this.db.insert(this.table, row);
		}
	}
};

_.response = function(chan, botname, text) {
	if (this.ready) {
		this.db.insert(this.table, {
			channel: chan,
			date:    now(),
			sender:  '$' + botname,
			message: text
		});
	}
};

_.close = function() {
	// do nothing
};

module.exports = DatabaseLog;
