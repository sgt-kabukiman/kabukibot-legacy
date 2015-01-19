/*
 * Copyright (c) 2014, Sgt. Kabukiman, https://bitbucket.org/sgt-kabukiman/
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

var utils = require('./../Utils.js'), http = require('client-http');

function SRRPlugin(log) {
	this.log      = log;
	this.dict     = log;
	this.mapping  = log;
	this.interval = null;
}

SRRPlugin.prototype = {
	setup: function(kabukibot, eventDispatcher) {
		var config = kabukibot.getConfig().plugins.srr;

		this.mapping = config.mapping;
		this.log     = kabukibot.getLog();
		this.dict    = kabukibot.getDictionary();

		this.fetchRecords();
		this.initUpdater(config.interval * 1000);
	},

	shutdown: function(kabukibot) {
		this.stopUpdater();
	},

	getKey: function() {
		return null;
	},

	initUpdater: function(interval) {
		this.interval = setInterval(this.fetchRecords.bind(this), interval);
	},

	stopUpdater: function() {
		this.interval && clearInterval(this.interval);
		this.interval = null;
	},

	fetchRecords: function() {
		var log = this.log, self = this, series;

		for (series in this.mapping) {
			log.debug('SRR: Fetching ' + series + ' WRs...');

			http.get('http://www.speedrun.com/api_records.php?series=' + encodeURIComponent(series), function(data) {
				if (!data) {
					log.error('SRR: Error fetching ' + series + ' WRs.');
				}
				else {
					try {
						data = JSON.parse(data);
					}
					catch (e) {
						log.error('Reveiced invalid JSON: ' + e);
						return;
					}

					log.debug('SRR: Success.');
					self.updateDictionary(series, data);
				}
			});
		}
	},

	updateDictionary: function(series, data) {
		var mapping = this.mapping[series], game, category;

		for (game in mapping) {
			if (!(game in data)) {
				this.log.warning('SRR: Could not find game "' + game + '" in "' + series + '" series.');
				continue;
			}

			for (category in mapping[game]) {
				if (!(category in data[game])) {
					this.log.warning('SRR: Could not find "' + category + '" category of "' + game + '".');
					continue;
				}

				this.setDictionaryText(series, game, category, data[game][category], mapping[game][category]);
			}
		}
	},

	setDictionaryText: function(series, game, category, data, dictKey) {
		var text, date;

		if (data.time === null) {
			return;
		}

		// personal taste: lowercase 'Any%'
		if (category === 'Any%') category = 'any%';

		// shorten some game names
		game = game.replace('Grand Theft Auto', 'GTA');

		text = 'WR for ' + game + ' ' + category + ' is ' + utils.secondsToRunTime(parseInt(data.time, 10)) + ' by ' + data.player;
		date = new Date(data.date * 1000);

		text += ', {{#reldate}}' + date.toDateString() + '{{/reldate}}';

		this.dict.set(dictKey, text);
	}
};

module.exports = SRRPlugin;
