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
		'wr_london1961_any': 'gta_wr_london61_any',
		'wr_london61_any':   'gta_wr_london61_any',
		'wr_1961_any':       'gta_wr_london61_any',
		'wr_61_any':         'gta_wr_london61_any',
		'wr_london1961':     'gta_wr_london61_any',
		'wr_london61':       'gta_wr_london61_any',
		'wr_1961':           'gta_wr_london61_any',
		'wr_61':             'gta_wr_london61_any',

		'wr_2_any': 'gta_wr_2_any',
		'wr_2':     'gta_wr_2_any',

		'wr_iii_any':         'gta_wr_iii_any',
		'wr_iii':             'gta_wr_iii_any',
		'wr_3_any':           'gta_wr_iii_any',
		'wr_3':               'gta_wr_iii_any',
		'wr_iii_mis':         'gta_wr_iii_mis',
		'wr_3_mis':           'gta_wr_iii_mis',
		'wr_iii_100':         'gta_wr_iii_100',
		'wr_3_100':           'gta_wr_iii_100',
		'wr_iii_kingdom':     'gta_wr_iii_kingdomcome',
		'wr_3_kingdom':       'gta_wr_iii_kingdomcome',
		'wr_iii_come':        'gta_wr_iii_kingdomcome',
		'wr_3_come':          'gta_wr_iii_kingdomcome',
		'wr_iii_kc':          'gta_wr_iii_kingdomcome',
		'wr_3_kc':            'gta_wr_iii_kingdomcome',
		'wr_iii_packages':    'gta_wr_iii_packages',
		'wr_3_packages':      'gta_wr_iii_packages',
		'wr_iii_pkgs':        'gta_wr_iii_packages',
		'wr_3_pkgs':          'gta_wr_iii_packages',
		'wr_iii_100packages': 'gta_wr_iii_packages',
		'wr_3_100packages':   'gta_wr_iii_packages',
		'wr_iii_100pkgs':     'gta_wr_iii_packages',
		'wr_3_100pkgs':       'gta_wr_iii_packages',
		'wr_iii_stunts':      'gta_wr_iii_jumps',
		'wr_3_stunts':        'gta_wr_iii_jumps',
		'wr_iii_jumps':       'gta_wr_iii_jumps',
		'wr_3_jumps':         'gta_wr_iii_jumps',
		'wr_iii_rampages':    'gta_wr_iii_rampages',
		'wr_3_rampages':      'gta_wr_iii_rampages',

		'wr_vc_any':         'gta_wr_vc_any',
		'wr_vc':             'gta_wr_vc_any',
		'wr_vc_mis':         'gta_wr_vc_mis',
		'wr_vc_100':         'gta_wr_vc_100',
		'wr_vc_packages':    'gta_wr_vc_packages',
		'wr_vc_pkgs':        'gta_wr_vc_packages',
		'wr_vc_100packages': 'gta_wr_vc_packages',
		'wr_vc_100pkgs':     'gta_wr_vc_packages',
		'wr_vc_robberies':   'gta_wr_vc_robberies',
		'wr_vc_robberinos':  'gta_wr_vc_robberies',

		'wr_sa_any':     'gta_wr_sa_any',
		'wr_sa':         'gta_wr_sa_any',
		'wr_sa_100':     'gta_wr_sa_100',
		'wr_sa_tags':    'gta_wr_sa_tags',
		'wr_sa_100tags': 'gta_wr_sa_tags',

		'wr_a_any':       'gta_wr_advance_any',
		'wr_a':           'gta_wr_advance_any',
		'wr_advance_any': 'gta_wr_advance_any',
		'wr_advance':     'gta_wr_advance_any',

		'wr_lcs_any': 'gta_wr_lcs_any',
		'wr_lcs':     'gta_wr_lcs_any',

		'wr_vcs_any':           'gta_wr_vcs_any',
		'wr_vcs':               'gta_wr_vcs_any',
		'wr_vcs_luftballons':   'gta_wr_vcs_luftballons',
		'wr_vcs_99luftballons': 'gta_wr_vcs_luftballons',
		'wr_vcs_99':            'gta_wr_vcs_luftballons',

		'wr_iv_any':        'gta_wr_iv_any',
		'wr_iv':            'gta_wr_iv_any',
		'wr_4_any':         'gta_wr_iv_any',
		'wr_4':             'gta_wr_iv_any',
		'wr_iv_classic':    'gta_wr_iv_classic',
		'wr_4_classic':     'gta_wr_iv_classic',
		'wr_iv_bowling':    'gta_wr_iv_bowling',
		'wr_4_bowling':     'gta_wr_iv_bowling',
		'wr_iv_mostwanted': 'gta_wr_iv_mostwanted',
		'wr_4_mostwanted':  'gta_wr_iv_mostwanted',
		'wr_iv_mw':         'gta_wr_iv_mostwanted',
		'wr_4_mw':          'gta_wr_iv_mostwanted',

		'wr_tlad_any': 'gta_wr_tlad_any',
		'wr_tlad':     'gta_wr_tlad_any',

		'wr_tbogt_any': 'gta_wr_tbogt_any',
		'wr_tbogt':     'gta_wr_tbogt_any',

		'wr_cw_any': 'gta_wr_cw_any',
		'wr_cw':     'gta_wr_cw_any',

		'wr_v_any':     'gta_wr_v_any',
		'wr_v':         'gta_wr_v_any',
		'wr_5_any':     'gta_wr_v_any',
		'wr_5':         'gta_wr_v_any',
		'wr_v_classic': 'gta_wr_v_classic',
		'wr_5_classic': 'gta_wr_v_classic',
		'wr_v_trevor':  'gta_wr_v_trevor',
		'wr_5_trevor':  'gta_wr_v_trevor',

		'wr_trilogy_any': 'gta_wr_trilogy_any',
		'wr_trilogy':     'gta_wr_trilogy_any',
		'wr_trilogy_100': 'gta_wr_trilogy_100',

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
