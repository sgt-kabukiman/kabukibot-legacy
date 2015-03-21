/*
 * Copyright (c) 2015, Sgt. Kabukiman, https://github.com/sgt-kabukiman
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

var
	BaseContentPlugin = require('./Base.js'),
	util              = require('util');

function EGGSContentPlugin() {
	BaseContentPlugin.call(this);

	this.commands = {
		'eggs':     'eggs_info',
		'eggs2015': 'eggs2015_info'
	};

	this.dictEntries = {
		eggs_info:     'EGGS stands for Easter Gathering of Gaming Speedsters, a speedrunning marathon held in Portsmouth, England.',
		eggs2015_info: 'EGGS 2015 will probably be around the first week of April, 4th to 8th.'
	};
}

util.inherits(EGGSContentPlugin, BaseContentPlugin);

EGGSContentPlugin.prototype.getKey = function() {
	return 'eggs';
};

EGGSContentPlugin.prototype.getACLTokens = function() {
	return ['eggs_commands'];
};

EGGSContentPlugin.prototype.getRequiredACLToken = function() {
	return 'eggs_commands';
};

module.exports = EGGSContentPlugin;
