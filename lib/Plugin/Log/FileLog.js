/*
 * Copyright (c) 2014, Sgt. Kabukiman, https://bitbucket.org/sgt-kabukiman/
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

var fs = require('fs');

function FileLog(filename) {
	this.stream = fs.createWriteStream(filename, { flags: 'a' });
}

var _ = FileLog.prototype;

_.textMessage = function(chan, user, text) {
	var line = '[' + (new Date()).toUTCString() + '] ' + user.getPrefix() + user.getName() + ': ' + text.trim();

	this.stream.write(line + "\n");
};

module.exports = FileLog;
