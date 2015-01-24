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
	util              = require('util');

function GTAContentPlugin() {
	BaseContentPlugin.call(this);

	this.commands = {
		'wr_iii_any': 'gta_wr_iii_any',
		'wr_iii':     'gta_wr_iii_any',
		'wr_3_any':   'gta_wr_iii_any',
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

		'wr_lcs_any': 'gta_wr_lcs_any',
		'wr_lcs':     'gta_wr_lcs_any',

		'wr_iv_any':     'gta_wr_iv_any',
		'wr_iv':         'gta_wr_iv_any',
		'wr_4_any':      'gta_wr_iv_any',
		'wr_4':          'gta_wr_iv_any',
		'wr_iv_classic': 'gta_wr_iv_classic',
		'wr_4_classic':  'gta_wr_iv_classic',

		'wr_v_any':     'gta_wr_v_any',
		'wr_v':         'gta_wr_v_any',
		'wr_5_any':     'gta_wr_v_any',
		'wr_5':         'gta_wr_v_any',
		'wr_v_classic': 'gta_wr_v_classic',
		'wr_5_classic': 'gta_wr_v_classic',

		'ryder':  'gta_ryder',
		'rng':    'gta_rng',

		'leaderboards': 'gta_leaderboards',
		'leaderboard':  'gta_leaderboards',
		'boards':       'gta_leaderboards',
		'gta_boards':   'gta_leaderboards',

		'sprinting': 'gta_sprinting',
		'sprint':    'gta_sprinting',

		'sliding': 'gta_sliding',
		'slide':   'gta_sliding',

		'ak47': 'gta_ak47',

		'swimming': 'gta_swimming',

		'pausebuffer':    'gta_pausebuffer',
		'pausebuffering': 'gta_pausebuffer',

		'vc_language': 'gta_vc_language',
		'vc_lang':     'gta_vc_language',
		'vc_lng':      'gta_vc_language',

		'toughened': 'gta_toughened',

		'classic':    'gta_classic',
		'classic_iv': 'gta_classic_iv',
		'classic_v':  'gta_classic_v'
	};

	this.dictEntries = {
		gta_wr_iii_any:    'WR for GTA III any% is 1:13:02 by SSJ4Vegeto, {{#reldate}}7 Mar. 2014{{/reldate}}',
		gta_wr_iii_mis:    'WR for GTA III All Missions is 3:27:46 by Menno888, {{#reldate}}28 Jan. 2014{{/reldate}}',
		gta_wr_iii_100:    'WR for GTA III 100% is 6:51:31 by MisterPost, {{#reldate}}1 Feb. 2014{{/reldate}}',
		gta_wr_vc_any:     'WR for GTA VC any% is 1:29:37 by ractrot, {{#reldate}}14 Mar. 2014{{/reldate}}',
		gta_wr_vc_mis:     'WR for GTA VC All Missions is 2:56:27 by Adam_ak, {{#reldate}}20 Dec. 2013{{/reldate}}',
		gta_wr_vc_100:     'WR for GTA VC 100% is 8:17:30 by JustShanz, {{#reldate}}12 Feb. 2014{{/reldate}}',
		gta_wr_sa_any:     'WR for San Andreas any% is 5:39:36 by UltimaOmega07, {{#reldate}}6 Nov. 2013{{/reldate}}',
		gta_wr_sa_100:     'WR for San Andreas 100% is 15:27:13 by S, {{#reldate}}6 Feb. 2014{{/reldate}}',
		gta_wr_lcs_any:    'WR for GTA: Liberty City Stories any% is 4:55:17 by BubbleBobbler, {{#reldate}}Wed Dec 11 2013{{/reldate}}',
		gta_wr_vcs_any:    'WR for GTA VCS any% is 4:34:05 by Lanayru (PSP), {{#reldate}}29 Jan. 2014{{/reldate}} / 4:55:40 by Oasiz on Emulated PS2, {{#reldate}}25 Aug. 2013{{/reldate}}',
		gta_wr_iv_any:     'There is no official GTA IV any% run according to the leaderboards.',
		gta_wr_iv_classic: 'WR for GTA IV Classic% is 6:52:00 by Dispersor, {{#reldate}}Tue Oct 08 2013{{/reldate}}',
		gta_wr_v_any:      'WR for GTA V any% is 8:17:46 by Dekap, {{#reldate}}2 Nov. 2013{{/reldate}}',
		gta_wr_v_classic:  'WR for GTA V Classic% is 7:59:17 by Dekap, {{#reldate}}1 Mar. 2014{{/reldate}}',

		gta_ryder:        'You blow up Ryder\'s car in order to skip a cutscene further into the mission. Restarting the mission is quicker than watching the cutscene.',
		gta_rng:          'RNG stands for Random Number Generator. The RNG controls every random aspect in the game, like the traffic or pedestrians in GTA or enemy spwans/movements in other games.',
		gta_leaderboards: 'The leaderboards are available at http://bombch.us/BXw',
		gta_sprinting:    'In GTA III and VC, you can sprint infinitely, whereas in San Andreas you run faster when tapping the sprint key instead of holding it. Fap2Win!',
		gta_sliding:      'By performing a timed combination of crouching, aiming and running, CJ starts to slide while aiming. This allows for faster movement, but is only possible with a gun that does not let you run when you aim (like an AK-47).',
		gta_ak47:         'By shooting your own car (which does not take damage from it), you increase the skill level for the AK-47 to Hitman lvl.',
		gta_swimming:     'During San Fierro there is one mission that requires CJ to have upgraded his lung capacity at least twice before it will let him start it.',
		gta_pausebuffer:  'Holding ESC (pausing/unpausing) messes with the game\'s frame-based logic and allows to skip some checks made by the game.',
		gta_classic:      'Classic% is like any%, but vehicle density must be 33% (as on consoles), fast travel via taxis is not allowed and skips like autosaves (IV) or mission failure skips (V) are forbidden.',
		gta_classic_iv:   'Classic% is like any%, but vehicle density must be 33% (as on consoles), fast travel via taxis is not allowed and autosaves are disabled.',
		gta_classic_v:    'Classic% is like any%, but vehicle density must be 33% (as on consoles), fast travel via taxis is not allowed and mission failure skips are forbidden.',
		gta_vc_language:  'German/French removes rampages, and the runner needs to make a rampage replay without taking the rampage.',
		gta_toughened:    'The Grand Theft Auto III "Toughened Mod" was designed to make the Any% missions more challenging.'
	};
}

util.inherits(GTAContentPlugin, BaseContentPlugin);

GTAContentPlugin.prototype.getKey = function() {
	return 'gta';
};

GTAContentPlugin.prototype.getACLTokens = function() {
	return ['gta_commands'];
};

GTAContentPlugin.prototype.getRequiredACLToken = function() {
	return 'gta_commands';
};

module.exports = GTAContentPlugin;
