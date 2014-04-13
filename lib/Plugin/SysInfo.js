/*
 * Copyright (c) 2014, Sgt. Kabukiman, https://bitbucket.org/sgt-kabukiman/
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

var utils = require('./../Utils.js'), fs = require('fs'), path = require('path');

function SysInfo() {
	this.prefix   = '';
	this.version  = null;
	this.chanMngr = null;
}

SysInfo.prototype.getKey = function() {
	return null;
};

SysInfo.prototype.setup = function(kabukibot, eventDispatcher) {
	eventDispatcher.onCommand(null, this.onCommand.bind(this));

	this.prefix   = kabukibot.getCommandPrefix();
	this.chanMngr = kabukibot.getChannelManager();

	// try to read the version file
	var versionFile = path.join(__dirname, '..', '..', 'version');
	var self        = this;

	fs.readFile(versionFile, { encoding: 'utf-8' }, function(err,data) {
		if (!err) {
			self.version = data.trim();
			kabukibot.getLog().info('Version: ' + self.version);
		}
		else {
			kabukibot.getLog().warning('Could not read version file "' + versionFile + '": ' + err);
		}
	});
};

SysInfo.prototype.onCommand = function(command, args, message) {
	if (!message.getUser().isOperator()) return;

	if (command === this.prefix + 'uptime') {
		return message.respondToAll('I have been running for ' + utils.secondsToTime(process.uptime()) + '.');
	}

	if (command === this.prefix + 'sysinfo') {
		var response = [];

		if (this.version) {
			response.push('version ' + this.version);
		}

		response.push(utils.secondsToTime(process.uptime(), true) + ' uptime');
		response.push(this.chanMngr.getChannels().length + ' channels');

		console.log(process.memoryUsage());

		return message.respondToAll('System Info: ' + response.join(', '));
	}
};

module.exports = SysInfo;
