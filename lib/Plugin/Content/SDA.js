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

function SDAContentPlugin() {
	BaseContentPlugin.call(this);

	this.commands = {
		'agdq':     'agdq_info',
		'agdq2014': 'agdq2014_info',
		'sgdq':     'sgdq_info',
		'sgdq2014': 'sgdq2014_info'
	};

	this.dictEntries = {
		agdq_info:     'AGDQ stands for Awesome Games Done Quick, an annual charity speedrunning marathon held in the US. It traditionally collects money for the Prevent Cancer Foundation.',
		agdq2014_info: 'AGDQ 2014 was from January 5th to 11th.',
		sgdq_info:     'SGDQ stands for Summer Games Done Quick, the summer version of AGDQ. It\'s an annual charity speedrunning marathon.',
		sgdq2014_info: 'SGDQ 2014 is {{#reldate}}22 Jun 2014{{/reldate}}, from June 22nd to June 28th, in Denver.'
	};
}

util.inherits(SDAContentPlugin, BaseContentPlugin);

SDAContentPlugin.prototype.getKey = function() {
	return 'sda';
};

SDAContentPlugin.prototype.getACLTokens = function() {
	return ['sda_commands'];
};

SDAContentPlugin.prototype.getRequiredACLToken = function() {
	return 'sda_commands';
};

module.exports = SDAContentPlugin;
