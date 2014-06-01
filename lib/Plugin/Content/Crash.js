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

function CrashContentPlugin() {
	BaseContentPlugin.call(this);

	this.commands = {
		wr_ctr_any: 'crash_wr_ctr_any',
		wr_ctr:     'crash_wr_ctr_any',
		wr_ctr_101: 'crash_wr_ctr_101',

		usf:    'crash_ctr_usf',
		notext: 'crash_ctr_notext',
		coco:   'crash_ctr_coco'
	};

	this.dictEntries = {
		crash_wr_ctr_any: 'WR for [CTR] Crash Team Racing any% is 0:51:50 (PAL PS2) by Lechanceux100, {{#reldate}}17 Apr. 2014{{/reldate}}',
		crash_wr_ctr_101: 'WR for [CTR] Crash Team Racing 101% is 3:09:40 (PAL PS2) by Lechanceux100, {{#reldate}}20 Apr. 2014{{/reldate}}',

		crash_ctr_usf:    'USF stands for "Ultimate Sacred Fire", giving you more speed than the maximun speedometer indicator.',
		crash_ctr_notext: 'By pressing ▲ in the language options, the game loads an "unfinished japanese" language. This skips a few cutscenes and reduces some delays here and there.',
		crash_ctr_coco:   'Coco is chosen not just because she\'s simply the best (amirite?), but also because her turning skills are required for a few tricks and shortcuts.'
	};
}

util.inherits(CrashContentPlugin, BaseContentPlugin);

var _ = CrashContentPlugin.prototype;

_.getKey = function() {
	return 'crash';
};

_.getACLTokens = function() {
	return ['crash_commands'];
};

_.getRequiredACLToken = function() {
	return 'crash_commands';
};

module.exports = CrashContentPlugin;
