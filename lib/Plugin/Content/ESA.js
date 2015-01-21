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

function ESAContentPlugin() {
	BaseContentPlugin.call(this);

	this.commands = {
		'esa':     'esa_info',
		'esa2014': 'esa2014_info',
		'esa2015': 'esa2015_info',
	};

	this.dictEntries = {
		esa_info:     'ESA stands for European Speedster Assembly, an annual charity speedrunning marathon held in Sweden. It\'s kind of the "European AGDQ".',
		esa2014_info: 'ESA 2014 was at Nyeport in Skövde (Sweden), from July 27th to August 3rd, and raised with its two streams a total of nearly $37,000 for Doctors Without Borders.',
		esa2015_info: 'ESA 2015 is from June 28th to July 5th.'
	};
}

util.inherits(ESAContentPlugin, BaseContentPlugin);

ESAContentPlugin.prototype.getKey = function() {
	return 'esa';
};

ESAContentPlugin.prototype.getACLTokens = function() {
	return ['esa_commands'];
};

ESAContentPlugin.prototype.getRequiredACLToken = function() {
	return 'esa_commands';
};

module.exports = ESAContentPlugin;
