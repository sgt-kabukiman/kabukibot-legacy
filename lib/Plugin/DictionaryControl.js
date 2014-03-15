/*
 * Copyright (c) 2014, Sgt. Kabukiman, https://bitbucket.org/sgt-kabukiman/
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

var DictionaryControlPlugin = function() {
	this.dict   = null;
	this.prefix = null;
};

DictionaryControlPlugin.prototype = {
	setup: function(kabukibot, eventDispatcher) {
		eventDispatcher.onCommand(true, this.onCommand.bind(this));

		this.dict   = kabukibot.getDictionary();
		this.prefix = kabukibot.getCommandPrefix();
	},

	getKey: function() {
		return null;
	},

	onCommand: function(command, args, message) {
		if (!message.getUser().isOperator()) {
			return;
		}

		switch (command) {
			case this.prefix + 'dict_set':  return this.handleSet(args, message);
			case this.prefix + 'dict_get':  return this.handleGet(args, message);
			case this.prefix + 'dict_keys': return this.handleGetKeys(args, message);
		}
	},

	handleGet: function(args, message) {
		var key;

		if (args.length < 1) {
			message.respond('Syntax is `!' + this.prefix + 'dict_get key`; See !' + this.prefix + 'dict_keys for a list of all keys.');
			return;
		}

		key = args[0];

		if (!this.dict.has(key)) {
			message.respond('Unknown key "' + key + '" given.');
		}
		else {
			message.respond(key + ' = ' + this.dict.get(key));
		}
	},

	handleSet: function(args, message) {
		var key, exists, text;

		if (args.length < 2) {
			message.respond('Syntax is `!' + this.prefix + 'dict_set key Your text here`.');
			return;
		}

		key    = args[0];
		text   = args.slice(1).join(' ');
		exists = this.dict.has(key);

		this.dict.set(key, text);

		if (exists) {
			message.respond('Replaced "' + key + '" with "' + text + '".');
		}
		else {
			message.respond('Added "' + key + '" with "' + text + '".');
		}
	},

	handleGetKeys: function(args, message) {
		message.respond('Keys are: ' + this.dict.keys().join(', '));
	}
};

module.exports = DictionaryControlPlugin;
