/*
 * Copyright (c) 2014, Sgt. Kabukiman, https://bitbucket.org/sgt-kabukiman/
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

var
	BasePlugin = require('./Base.js'),
	utils      = require('./../Utils.js'),
	util       = require('util');

function TrollPlugin() {
	this.listener  = null;
	this.responses = {
		why: [
			// the very lazy man's RNG manipulation
			'Because it\'s faster.',
			'Because it\'s faster.',
			'Because it\'s faster.',
			'Because it\'s faster.',
			'Because it\'s faster.',
			'Because it\'s faster.',
			'Because it\'s faster.',
			'Because it\'s faster.',
			'Because it\'s faster.',
			'Because it\'s faster.',
			'Because it\'s faster.',
			'Because it\'s faster.',
			'Because it\'s faster.',
			'Because it\'s faster.',
			'Because it\'s faster.',
			'Because it\'s faster.',
			'Because it\'s faster.',
			'Because it\'s faster.',
			'Because it\'s faster.',
			'Because it\'s faster.',
			'Because it\'s faster.',
			'Doing this manipulates the RNG in later parts of the game. Just wait a bit, you\'ll see.',
			'Doing this is literally just for the lulz of it.',
			'Doing this prevents viewers from noticing that the runner is actually using cheats.'
		],
		system: [ // GG http://en.wikipedia.org/wiki/List_of_video_game_consoles
			'This is on PC.',
			'This is on C64.',
			'This is on Magnavox Odyssey.',
			'This is on Atari 2600.',
			'This is on the Nintendo Entertainment System (NES).',
			'This is on Sega Genesis.',
			'This is on PlayStation 4.',
			'This is on ENIAC.',
			'This is on Zuse Z1.'
		],
		song: [
//			'The current song is "Sandstorm" by Darude.',
			'The current song is "Never Gonna Give You Up" by Rick Astley.',               // shoutouts to dfocus89
			'The current song is "Inside Out" by DotEXE.',                                 // shoutouts to mhmd_fvc
			'The current song is "Barbie Girl" by Aqua.',                                  // shoutouts to Eidgod
			'The current song is "PON PON PON" by Kyary Pamyu Pamyu.',
			'The current song is "Bangarang" by Skrillex.',
			'The current song is "Hooked on a Feeling" by David Hasselhoff.',
			'The current song is "Judas" by Lady Gaga.',
			'The current song is "Friday" by Rebecca Black.',
			'The current song is "Dancing in the Street" by David Bowie & Mick Jagger.',
			'Currently playing is Bach - Toccata and Fugue in D Minor.'
		]
	}
}

util.inherits(TrollPlugin, BasePlugin);

var _ = TrollPlugin.prototype;

_.setup = function(kabukibot, eventDispatcher) {
	BasePlugin.prototype.setup.call(this, kabukibot, eventDispatcher);

	this.listener = this.onCommand.bind(this);
};

_.getKey = function() {
	return 'troll';
};

_.getACLTokens = function() {
	return ['trolling'];
};

_.load = function(channel, kabukibot, eventDispatcher) {
	eventDispatcher.onCommand(channel.getName(), this.listener);
};

_.unload = function(channel, kabukibot, eventDispatcher) {
	eventDispatcher.removeCommandListener(channel.getName(), this.listener);
};

_.onCommand = function(command, args, message) {
	if (message.isProcessed()) return;

	// not for us
	if (!(command in this.responses)) {
		return;
	}

	// not allowed
	if (!this.acl.isAllowed(message.getUser(), 'trolling')) {
		return;
	}

	message.respondToAll(utils.randomItem(this.responses[command]));
};

module.exports = TrollPlugin;
