/*
 * Copyright (c) 2014, Sgt. Kabukiman, https://bitbucket.org/sgt-kabukiman/
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

var GTAContentPlugin = function() {
	this.acl      = null;
	this.listener = null;
	this.texts    = {
		'ryder':  'You blow up Ryder\'s car in order to skip a cutscene further into the mission. Restarting the mission is quicker than watching the cutscene.',
		'30days': 'See below the stream to find out about the 30 Day Challenge.',
		'rng':    'RNG stands for Random Number Generator. The RNG controls every random aspect in the game, like the traffic or pedestrians in GTA or enemy spwans/movements in other games.',

		'leaderboards': 'The leaderboards are available at http://bombch.us/BXw',
		'boards':       '!leaderboards',
		'gta_boards':   '!leaderboards',

		'sprinting': 'In GTA III and VC, you can sprint infinitely, whereas in San Andreas you run faster when tapping the sprint key instead of holding it. Fap2Win!',
		'sprint':    '!sprinting',

		'sliding': 'By performing a timed combination of crouching, aiming and running, CJ starts to slide while aiming. This allows for faster movement, but is only possible with a gun that does not let you run when you aim (like an AK-47).',
		'slide':   '!sliding',

		'ak47': 'By shooting your own car (which does not take damage from it), you increase the skill level for the AK-47 to Hitman lvl.',

		'swimming': 'During San Fierro there is one mission that requires CJ to have upgraded his lung capacity at least twice before it will let him start it.',
	};
};

GTAContentPlugin.prototype = {
	setup: function(kabukibot, eventDispatcher) {
		this.acl      = kabukibot.getACL();
		this.listener = this.onCommand.bind(this);
	},

	getKey: function() {
		return 'gta';
	},

	getACLTokens: function() {
		return ['gta_commands'];
	},

	load: function(channel, kabukibot, eventDispatcher) {
		eventDispatcher.onCommand(channel.getIrcName(), this.listener);
	},

	unload: function(channel, kabukibot, eventDispatcher) {
		eventDispatcher.removeCommandListener(channel.getIrcName(), this.listener);
	},

	onCommand: function(command, args, message) {
		if (!this.acl.isAllowed(message.getUser(), 'gta')) {
			return;
		}

		if (command in this.texts) {
			message.respondToAll(this.texts[command]);
			return;
		}
	}
};

module.exports = GTAContentPlugin;
