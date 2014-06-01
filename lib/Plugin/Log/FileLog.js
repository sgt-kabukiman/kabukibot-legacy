/*
 * Copyright (c) 2014, Sgt. Kabukiman, https://bitbucket.org/sgt-kabukiman/
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

var fs = require('fs');

function FileLog(filename, multichannel) {
	this.stream = fs.createWriteStream(filename, { flags: 'a' });
	this.multi  = !!multichannel;
}

function logLine(text, chan) {
	return '[' + (new Date()).toUTCString() + '] ' + (chan ? ('[#' + chan + '] ') : '') + text + "\n";
}

var _ = FileLog.prototype;

_.textMessage = function(msg) {
	this.stream.write(logLine(msg.getUser().getPrefix() + msg.getUser().getName() + ': ' + msg.getMessage().trim(), this.multi ? msg.getChannel().getName() : ''));
};

_.twitchMessage = function(msg) {
	var user = msg.getUsername();
	var line = '';

	switch (msg.getCommand()) {
		case 'clearchat':
			if (user) {
				line = logLine('<' + user + ' has been timed out>');
			}
			else {
				line = logLine('<channel has been cleared>');
			}
			break;

		case 'subscriber':
			line = logLine('<' + user + ' just subscribed!>');
			break;
	}

	if (line.length > 0) {
		this.stream.write(line, this.multi ? chan : '');
	}
};

_.response = function(chan, botname, text) {
	this.stream.write(logLine(botname + ': ' + text.trim(), this.multi ? chan : ''));
};

_.close = function() {
	this.stream.end();
};

module.exports = FileLog;
