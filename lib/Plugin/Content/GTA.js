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
	this.tpl      = null;
	this.commands = {
		'wr_iii_any': 'gta_wr_iii_any',
		'wr_iii':     'gta_wr_iii_any',
		'wr_3':       'gta_wr_iii_any',
		'wr_iii_mis': 'gta_wr_iii_mis',
		'wr_3_mis':   'gta_wr_iii_mis',
		'wr_iii_100': 'gta_wr_iii_100',
		'wr_3_100':   'gta_wr_iii_100',

		'wr_vc_any': 'gta_wr_vc_any',
		'wr_vc':     'gta_wr_vc_any',
		'wr_vc_mis': 'gta_wr_vc_mis',
		'wr_vc_100': 'gta_wr_vc_100',

		'wr_sa_any': 'gta_wr_sa_any',
		'wr_sa':     'gta_wr_sa_any',
		'wr_sa_100': 'gta_wr_sa_100',

		'wr_vcs_any': 'gta_wr_vcs_any',
		'wr_vcs':     'gta_wr_vcs_any',

		'wr_v_any':     'gta_wr_v_any',
		'wr_v':         'gta_wr_v_any',
		'wr_5':         'gta_wr_v_any',
		'wr_v_classic': 'gta_wr_v_classic',
		'wr_5_classic': 'gta_wr_v_classic',

		'ryder':  'gta_ryder',
		'30days': 'gta_30days',
		'rng':    'gta_rng',

		'leaderboards': 'gta_leaderboards',
		'boards':       'gta_leaderboards',
		'gta_boards':   'gta_leaderboards',

		'sprinting': 'gta_sprinting',
		'sprint':    'gta_sprinting',

		'sliding': 'gta_sliding',
		'slide':   'gta_sliding',

		'ak47': 'gta_ak47',

		'swimming': 'gta_swimming'
	};
};

GTAContentPlugin.prototype = {
	setup: function(kabukibot, eventDispatcher) {
		this.acl      = kabukibot.getACL();
		this.tpl      = kabukibot.getStringTemplate();
		this.listener = this.onCommand.bind(this);
		this.dict     = kabukibot.getDictionary();

		this.dict
			.add('gta_wr_iii_any',   'WR for GTA III any% is 1:13:02 by SSJ4Vegeto, {{#reldate}}7 Mar. 2014{{/reldate}}')
			.add('gta_wr_iii_mis',   'WR for GTA III All Missions is 3:27:46 by Menno888, {{#reldate}}28 Jan. 2014{{/reldate}}')
			.add('gta_wr_iii_100',   'WR for GTA III 100% is 6:51:31 by MisterPost, {{#reldate}}1 Feb. 2014{{/reldate}}')
			.add('gta_wr_vc_any',    'WR for GTA VC any% is 1:30:02 by m00nchile, {{#reldate}}25 Feb. 2014{{/reldate}}')
			.add('gta_wr_vc_mis',    'WR for GTA VC All Missions is 2:56:27 by Adam_ak, {{#reldate}}20 Dec. 2013{{/reldate}}')
			.add('gta_wr_vc_100',    'WR for GTA VC 100% is 8:17:30 by JustShanz, {{#reldate}}12 Feb. 2014{{/reldate}}')
			.add('gta_wr_sa_any',    'WR for San Andreas any% is 5:39:36 by UltimaOmega07, {{#reldate}}6 Nov. 2013{{/reldate}}')
			.add('gta_wr_sa_100',    'WR for San Andreas 100% is 15:27:13 by S, {{#reldate}}6 Feb. 2014{{/reldate}}')
			.add('gta_wr_vcs_any',   'WR for GTA VCS any% is 4:34:05 by Lanayru (PSP), {{#reldate}}29 Jan. 2014{{/reldate}} / 4:55:40 by Oasiz on Emulated PS2, {{#reldate}}25 Aug. 2013{{/reldate}}')
			.add('gta_wr_v_any',     'WR for GTA V any% is 8:17:46 by Dekap, {{#reldate}}2 Nov. 2013{{/reldate}}')
			.add('gta_wr_v_classic', 'WR for GTA V Classic% is 7:59:17 by Dekap, {{#reldate}}1 Mar. 2014{{/reldate}}')

			.add('gta_ryder',        'You blow up Ryder\'s car in order to skip a cutscene further into the mission. Restarting the mission is quicker than watching the cutscene.')
			.add('gta_rng',          'RNG stands for Random Number Generator. The RNG controls every random aspect in the game, like the traffic or pedestrians in GTA or enemy spwans/movements in other games.')
			.add('gta_leaderboards', 'The leaderboards are available at http://bombch.us/BXw')
			.add('gta_sprinting',    'In GTA III and VC, you can sprint infinitely, whereas in San Andreas you run faster when tapping the sprint key instead of holding it. Fap2Win!')
			.add('gta_sliding',      'By performing a timed combination of crouching, aiming and running, CJ starts to slide while aiming. This allows for faster movement, but is only possible with a gun that does not let you run when you aim (like an AK-47).')
			.add('gta_ak47',         'By shooting your own car (which does not take damage from it), you increase the skill level for the AK-47 to Hitman lvl.')
			.add('gta_swimming',     'During San Fierro there is one mission that requires CJ to have upgraded his lung capacity at least twice before it will let him start it.')
		;
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
		if (!this.acl.isAllowed(message.getUser(), 'gta_commands')) {
			return;
		}

		if (command in this.commands) {
			message.respondToAll(this.tpl.render(this.dict.get(this.commands[command])));
		}
	}
};

module.exports = GTAContentPlugin;
