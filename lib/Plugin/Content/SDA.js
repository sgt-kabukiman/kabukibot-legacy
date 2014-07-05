/*
 * Copyright (c) 2014, Sgt. Kabukiman, https://bitbucket.org/sgt-kabukiman/
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

var
	BaseContentPlugin = require('./Base.js'),
	Utils             = require('./../../Utils.js'),
	util              = require('util'),
	numeral           = require('numeral'),
	http              = require('client-http');

function SDAContentPlugin() {
	BaseContentPlugin.call(this);

	this.commands = {
		'agdq':     'agdq_info',
		'agdq2014': 'agdq2014_info',
		'agdq2015': 'agdq2015_info',
		'sgdq':     'sgdq_info',
		'sgdq2014': 'sgdq2014_info'
	};

	this.dictEntries = {
		agdq_info:     'AGDQ stands for Awesome Games Done Quick, an annual charity speedrunning marathon held in the US. It traditionally collects money for the Prevent Cancer Foundation.',
		agdq2014_info: 'AGDQ 2014 was from January 5th to 11th.',
		agdq2015_info: 'AGDQ 2015 is from January 3rd ({{#reldate}}3 Jan 2015{{/reldate}}) to January 10th (main marathon); clean up and bonus stream will go on until January 13th.',
		sgdq_info:     'SGDQ stands for Summer Games Done Quick, the summer version of AGDQ. It\'s an annual charity speedrunning marathon.',
		sgdq2014_info: 'SGDQ 2014 was held from Jun 22 to Jun 28 at the Crown Plaza Hotal in Denver, Colorado, and raised over $700,000 for Doctors Without Borders.'
	};

	this.tracker = null;
	this.stats   = {
		total: 0,
		donations: 0
	};
}

util.inherits(SDAContentPlugin, BaseContentPlugin);

var _ = SDAContentPlugin.prototype;

_.getKey = function() {
	return 'sda';
};

_.getACLTokens = function() {
	return ['sda_commands'];
};

_.getRequiredACLToken = function() {
	return 'sda_commands';
};

_.setup = function(kabukibot, eventDispatcher) {
	BaseContentPlugin.prototype.setup.call(this, kabukibot, eventDispatcher);

	if (kabukibot.getConfig().plugins.sda.tracker) {
		this.tracker = kabukibot.getConfig().plugins.sda.tracker;

		// update every 3 minutes
		setInterval(this.updateTracker.bind(this), 3*60*1000);
		this.updateTracker();
	}
};

_.updateTracker = function() {
	var log = this.log, self = this;

	log.debug('SDA: Updating donations...');
	http.get(this.tracker, function(data) {
		var html, match, statsHTML;

		if (!data) {
			log.error('SDA: Error fetching donation tracker.');
			return;
		}

		html  = data.replace(/[\n\r]/g, '');
		match = html.match(/class="title">(.*?)<\/div>/i);

		if (!match) {
			log.error('SDA: Could not match title row.');
			return;
		}

		statsHTML = match[1];
		match     = statsHTML.match(/Donation Total:<\/b>\$([0-9,.]+)\s*\(([0-9]+)\)<b>/i);

		if (!match) {
			log.error('SDA: Could not match donation info.');
			return;
		}

		self.stats.total     = +(match[1].replace(',', '')); // convert to float
		self.stats.donations = parseInt(match[2], 10);

		log.debug('SDA: Success.');
	});
};

_.onCommand = function(command, args, message) {
	if (message.isProcessed()) return;

	if (command.match(/s?gdq(stats|donations)/i)) {
		if (!this.acl.isAllowed(message.getUser(), this.getRequiredACLToken(command))) {
			return;
		}

		var donations = numeral(this.stats.donations).format('0,0');
		var total     = numeral(this.stats.total).format('0,0.00');
		var emote     = Utils.randomItem(['FrankerZ', 'PogChamp', 'TriHard', 'Kreygasm', 'FuzzyOtterOO', '<3']);
		var emotes    = [];

		for (var i = 0; i <= (this.stats.total/100000); ++i) {
			emotes.push(emote);
		}

		message.respondToAll('We are at ' + donations + ' donations, with a total of $' + total + ' raised for Doctors Without Borders ' + emotes.join(' '));
	}
	else {
		BaseContentPlugin.prototype.onCommand.call(this, command, args, message);
	}
};

module.exports = SDAContentPlugin;
