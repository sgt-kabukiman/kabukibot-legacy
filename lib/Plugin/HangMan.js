/*
 * Copyright (c) 2014, Sgt. Kabukiman, https://bitbucket.org/sgt-kabukiman/
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

var
	utils      = require('./../Utils.js'),
	BasePlugin = require('./Base.js'),
	util       = require('util'),
	rot        = require('rot');

function HangManPlugin() {
	BasePlugin.call(this);

	this.me          = null;
	this.listener    = null;
	this.configs     = {};
	this.terms       = {};
	this.states      = {};
	this.termTable   = 'hangman_terms';
	this.configTable = 'hangman_config';
	this.maxTerms    = 200;
	this.maxTermLen  = 50;
	this.hitMessages = [
		'boom baby! %letter% was right! PogChamp',
		'awww yeah, %letter% is in there! Kreygasm',
		'well obviously %letter% is in there, duh!',
		'%letter% does compute! MrDestructoid',
		'you have been blessed by the RNGods, %letter% was right!'
	];
	this.solvedMessages = [
		'Holy Moly, %user% solved it! PogChamp',
		'Congratulations, %user%, you are correct! Kreygasm',
		'%user%, that does compute so hard! MrDestructoid'
	];
	this.missMessages = [
		'nope, %letter% is wrong.',
		'nope, no %letter% in there.',
		'you wish %letter% was in there, right? But no.',
		'TriHarder than %letter%.',
		'%letter%, really? FailFish',
		'was that really your best guess? %letter%? DansGame',
		'put some PJSalt on that %letter%.',
		'still waiting for a better guess than %letter%... ResidentSleeper'
	];
	this.missedSolveMessages = [
		'nope, "%solution%" is wrong.',
		'you wish "%solution%" was in right...',
		'TriHarder than "%solution%".',
		'"%solution%", really? FailFish',
		'"%solution%" DansGame next pls',
		'put some PJSalt on that "%solution%".'
	];
	this.winMessages = [
		'you have guessed the last letter! PogChamp PogChamp PogChamp',
		'I\'m glad you finally close the deal on this one. OpieOP',
		'you really are a master of this game MVGame'
	];
}

function normalize(s) {
	return s.replace(/[^a-z]/ig, ' ').replace(/\s+/g, ' ').trim().toUpperCase();
}

function getIntValue(argument) {
	if (argument.toLowerCase() === 'null' || argument.toLowerCase() === '"null"') {
		return null;
	}

	argument = parseInt(argument, 10);

	return (isNaN(argument)) ? false : argument;
}

util.inherits(HangManPlugin, BasePlugin);

HangManPlugin.prototype.setup = function(kabukibot, eventDispatcher) {
	BasePlugin.prototype.setup.call(this, kabukibot, eventDispatcher);

	this.me       = kabukibot.getBotName();
	this.listener = this.onCommand.bind(this);

	if (this.bot.getConfig().database.driver === 'sqlite') {
		this.db.query('CREATE TABLE IF NOT EXISTS ' + this.termTable + ' (channel VARCHAR(200), term VARCHAR(50), author VARCHAR(100), PRIMARY KEY (channel, term))');
		this.db.query('CREATE TABLE IF NOT EXISTS ' + this.configTable + ' (channel VARCHAR(200), deepbot_costs INTEGER UNSIGNED NULL, deepbot_prize INTEGER UNSIGNED NULL, PRIMARY KEY (channel))');
	}
	else {
		this.db.query('CREATE TABLE IF NOT EXISTS ' + this.termTable + ' (channel VARCHAR(200), term VARCHAR(50), author VARCHAR(100), PRIMARY KEY (channel, term)) DEFAULT CHARACTER SET utf8 COLLATE utf8_unicode_ci ENGINE = InnoDB');
		this.db.query('CREATE TABLE IF NOT EXISTS ' + this.configTable + ' (channel VARCHAR(200), deepbot_costs INTEGER UNSIGNED NULL, deepbot_prize INTEGER UNSIGNED NULL, PRIMARY KEY (channel)) DEFAULT CHARACTER SET utf8 COLLATE utf8_unicode_ci ENGINE = InnoDB');
	}
};

HangManPlugin.prototype.getKey = function() {
	return 'hangman';
};

HangManPlugin.prototype.getACLTokens = function() {
	return ['start_hangman', 'play_hangman', 'add_hangman_terms', 'remove_hangman_terms'];
};

HangManPlugin.prototype.getRequiredACLToken = function(cmd) {
	switch (cmd) {
		case 'hangman':
			return 'start_hangman';

		case 'guess':
		case 'solve':
			return 'play_hangman';

		case 'hangman_add':
			return 'add_hangman_terms';

		case 'hangman_remove':
			return 'remove_hangman_terms';

		case 'hangman_config':
			return 'this_does_not_exist_so_only_owner_and_op_are_allowed';
	}
};

HangManPlugin.prototype.load = function(channel, kabukibot, eventDispatcher) {
	var self = this, chan = channel.getName(), ircName = channel.getIrcName();

	eventDispatcher.onCommand(ircName, this.listener);

	this.terms[chan]   = {};
	this.configs[chan] = { deepbotCosts: null, deepbotPrize: null };
	this.states[chan]  = { term: null, letters: [], reminder: null };

	this.selectFromDatabase(this.termTable, 'term, author', { channel: chan }, function(rows) {
		self.debug('Loaded ' + rows.length + ' hangman terms for ' + ircName + '.');

		for (var i = 0, len = rows.length; i < len; ++i) {
			self.terms[chan][rows[i].term] = rows[i].author;
		}

		self.selectFromDatabase(self.configTable, '*', { channel: chan }, function(rows) {
			if (rows.length === 0) {
				self.debug('No extended hangman configuration for ' + ircName + ' found. Creating dummy one.');
				rows = [ { channel: chan, deepbot_costs: null, deepbot_prize: null } ];
				self.db.insert(self.configTable, rows[0]);
			}
			else {
				self.debug('Loaded extended hangman configuration for ' + ircName + '.');
			}

			self.configs[chan] = {
				deepbotCosts: rows[0].deepbot_costs,
				deepbotPrize: rows[0].deepbot_prize
			};
		});
	});
};

HangManPlugin.prototype.unload = function(channel, kabukibot, eventDispatcher) {
	var chan = channel.getName();

	eventDispatcher.removeCommandListener(channel.getIrcName(), this.listener);

	if (chan in this.terms) {
		if (this.states[chan].reminder) {
			clearInterval(this.states[chan].reminder);
		}

		delete this.terms[chan];
		delete this.configs[chan];
		delete this.states[chan];
	}
};

HangManPlugin.prototype.onCommand = function(command, args, message) {
	if (message.isProcessed()) return;

	var chan = message.getChannel().getName();

	// not for us
	if (command !== 'hangman' && command !== 'guess' && command !== 'solve' && command !== 'hangman_add' && command !== 'hangman_remove' && command !== 'hangman_config') {
		return;
	}

	// not allowed
	if (!this.acl.isAllowed(message.getUser(), this.getRequiredACLToken(command))) {
		return;
	}

	switch (command) {
		case 'hangman':        return this.startNewGame(chan, message);
		case 'guess':          return this.guess(chan, args, message);
		case 'solve':          return this.solve(chan, args, message);
		case 'hangman_add':    return this.addTerm(chan, args, message);
		case 'hangman_remove': return this.removeTerm(chan, args, message);
		case 'hangman_config': return this.setConfig(chan, args, message);
	}
};

HangManPlugin.prototype.startNewGame = function(chan, message) {
	var config = this.configs[chan], terms = this.terms[chan], msg, term;

	// end running game, if any

	if (this.isGameRunning(chan)) {
		msg = 'Sorry folks, new round is starting. The solution was: "' + this.states[chan].term + '"';

		if (config.deepbotPrize !== null) {
			msg += ' - Guess I will have to take that prize, thank you very much.';
		}

		message.respondToAll(msg);
		this.giveDeepbotPrize(this.me, message, false);
		this.clearReminder(chan);
	}

	if (utils.isEmptyObject(terms)) {
		return this.errorResponse(message, 'no terms defined yet. Use !hangman_add <term> to add the first. Up to 30 letters (A-Z and spaces).');
	}

	// choose new term

	term = utils.randomItem(terms);

	this.states[chan] = {
		term:     term,
		author:   terms[term],
		letters:  [],
		reminder: null
	};

	// tell people the news

	msg = 'The RNG has spoken, here is your challenge.';

	if (config.deepbotCosts !== null && config.deepbotCosts > 0) {
		msg += ' A guess will cost you ¤ ' + config.deepbotCosts + '!';
	}

	message.respondToAll(msg);
	message.respondToAll(this.hideLetters(term, []), true);

	this.setReminder(message.getChannel());
};

HangManPlugin.prototype.guess = function(chan, args, message) {
	var state = this.states[chan], letter;

	// ignore the command if no game is running, in order to prevent spamming the bot
	if (!this.isGameRunning(chan)) {
		return;
	}

	// check the guess arguments
	if (args.length < 1) {
		return this.errorResponse(message, 'you must give a single letter, like `!guess A`.');
	}

	letter = args[0];

	if (!letter.match(/^[a-z]$/i)) {
		return this.errorResponse(message, 'you must give a single letter, like `!guess A`.');
	}

	letter = letter.toUpperCase();

	// did someone already guess this one?
	if (state.letters.indexOf(letter) !== -1) {
		return;
	}

	// remember all guesses, even unsuccessful ones
	state.letters.push(letter);

	// miss?
	if (state.term.indexOf(letter) === -1) {
		message.respond(utils.randomItem(this.missMessages).replace('%letter%', letter));
		message.respondToAll(this.hideLetters(state.term, state.letters), true);

		this.setReminder(message.getChannel());
		return;
	}

	// the last letter has been guessed!
	if (this.isSolved(state)) {
		message.respond(utils.randomItem(this.winMessages).replace('%letter%', letter));
		message.respondToAll(message.getUser().getName() + ' has won the game! The solution was:', true);
		message.respondToAll(this.hideLetters(state.term, state.letters, true) + '(by ' + state.author + ')', true);

		this.clearReminder(chan);
		this.giveDeepbotPrize(message.getUser().getName(), message, true);

		this.states[chan].term    = null;
		this.states[chan].author  = null;
		this.states[chan].letters = [];
	}

	// this was a successful guess, but the game keeps on
	else {
		message.respond(utils.randomItem(this.hitMessages).replace('%letter%', letter));
		message.respondToAll(this.hideLetters(state.term, state.letters), true);

		this.setReminder(message.getChannel());
	}
};

HangManPlugin.prototype.solve = function(chan, args, message) {
	var state = this.states[chan], solution, secret, multiplier;

	// ignore the command if no game is running, in order to prevent spamming the bot
	if (!this.isGameRunning(chan)) {
		return;
	}

	// check the guess arguments
	if (args.length < 1) {
		return this.errorResponse(message, 'you must give the full answer, like `!solve This is the secret`.');
	}

	// we don't care for special chars in the solution, so "!solve WHATS UP" solves "WHATS UP?"
	solution = normalize(args.join(' '));

	if (solution.length === 0) {
		return this.errorResponse(message, 'your solution contained no letters.');
	}

	// compare with the current term
	secret = normalize(state.term);

	if (solution !== secret) {
		return message.respond(utils.randomItem(this.missedSolveMessages).replace('%solution%', solution));
	}

	// woohoo!

	// remove all the already guessed characters
	multiplier = this.getMultiplier(state);

	message.respondToAll(utils.randomItem(this.solvedMessages).replace('%user%', message.getUser().getName()));
	message.respondToAll('The solution is: ' + state.term, true);
	message.respondToAll('This round was brought to you by ' + state.author + '.', true);

	this.clearReminder(chan);
	this.giveDeepbotPrize(message.getUser().getName(), message, true, multiplier);

	this.states[chan].term    = null;
	this.states[chan].author  = null;
	this.states[chan].letters = [];
};

HangManPlugin.prototype.addTerm = function(chan, args, message) {
	var self = this, rot13, term, author;

	// check the arguments
	if (args.length === 0 || (args.length === 1 && args[0].toLowerCase() === 'rot13')) {
		return this.errorResponse(message, 'you must give at least one word, like `!hangman_add This is the secret`. You can use ROT13 by doing `!hangman_add rot13 Guvf vf gur frperg`.');
	}

	rot13 = args[0].toLowerCase() === 'rot13';
	term  = rot13 ? args.slice(1).join(' ') : args.join(' ');
	term  = term.replace(/[^a-z ,!?-]/gi, '').toUpperCase();

	if (term.length === 0) {
		return this.errorResponse(message, 'your term contained no actual letters.');
	}

	if (term.length > this.maxTermLen) {
		return this.errorResponse(message, 'your term can only be up to ' + this.maxTermLen + ' letters long, yours was ' + term.length + '.');
	}

	if (rot13) {
		term = rot(term, -13);
	}

	if (term in this.terms[chan]) {
		return this.errorResponse(message, 'your term is already on the list.');
	}

	author = message.getUser().getName();

	this.db.insert(this.termTable, { channel: chan, term: term, author: author }, function() {
		self.terms[chan][term] = author;
		message.respond('thanks for your input, the term has been added.');
	});
};

HangManPlugin.prototype.removeTerm = function(chan, args, message) {
	var self = this, term;

	// check the arguments
	if (args.length < 1) {
		return this.errorResponse(message, 'you must give the full term, like `!hangman_remove This was a stupid term`.');
	}

	term = args.join(' ');
	term = term.replace(/[^a-z ,!?-]/gi, '').toUpperCase();

	if (term.length === 0) {
		return this.errorResponse(message, 'your term contained no actual letters.');
	}

	if (!(term in this.terms[chan])) {
		return this.errorResponse(message, '"' + term + '" is not in the list.');
	}

	this.db.del(this.termTable, { channel: chan, term: term }, function() {
		delete self.terms[chan][term];
		message.respond('the term has been removed.');
	});
};

HangManPlugin.prototype.setConfig = function(chan, args, message) {
	var key, changes, value;

	// check the arguments
	if (args.length < 2) {
		return this.errorResponse(message, 'you must give the config key and the new value, like `!hangman_config deepbot_prize 420`.');
	}

	key     = args[0].toLowerCase();
	changes = false;

	switch (key) {
		case 'deepbot_prize':
			value = getIntValue(args[1]);

			if (value === false) {
				this.errorResponse(message, 'invalid value given. Give a positive number or "null".');
			}
			else if (value === null || value <= 0) {
				changes = true;
				this.configs[chan].deepbotPrize = null;
				message.respond('the DeepBot prize for winning a round has been disabled.');
			}
			else {
				changes = true;
				this.configs[chan].deepbotPrize = value;
				message.respond('the DeepBot prize for winning a round has been set to ¤ ' + value + '.');
			}

			break;

		case 'deepbot_costs':
			message.respond('costs per guess are disabled because they are instable and spam the chat. You don\'t want that, believe me.');
			break;
	}

	if (changes) {
		this.db.update(this.configTable, {
			deepbot_costs: this.configs[chan].deepbotCosts,
			deepbot_prize: this.configs[chan].deepbotPrize
		}, {
			channel: chan
		});
	}
};

HangManPlugin.prototype.setReminder = function(channel) {
	var chan = channel.getName(), state = this.states[chan], self = this;

	this.clearReminder(chan);

	state.reminder = setInterval(function() {
		self.remind(channel);
	}, 45*1000); // 45 sec
};

HangManPlugin.prototype.clearReminder = function(chan) {
	chan = this.getChan(chan);

	if (this.states[chan].reminder !== null) {
		clearInterval(this.states[chan].reminder);
		this.states[chan].reminder = null;
	}
};

HangManPlugin.prototype.remind = function(channel) {
	var state = this.states[channel.getName()];

	channel.say('Our term is: ' + this.hideLetters(state.term, state.letters) + ' - !guess <letter> or !solve <term>');
};

HangManPlugin.prototype.getMultiplier = function(state) {
	var multiplier = 0, i = 0, chars = [], leftover;

	// remove all the already guessed characters
	leftover = state.term.replace(new RegExp('[ ' + state.letters.join('') + ',!?-]', 'g'), '');

	// "FOO" => ['F', 'O', 'O']
	leftover = leftover.split('');

	// count each character once towards to multiplier (['F', 'O', 'O'] => F+O = 2)
	for (; i < leftover.length; ++i) {
		if (chars.indexOf(leftover[i]) === -1) {
			multiplier++;
			chars.push(leftover[i]);
		}
	}

	return multiplier;
};

HangManPlugin.prototype.hideLetters = function(text, lettersToShow, hideMisses) {
	var misses = [], idx;

	text = text.replace(new RegExp('[^ ' + lettersToShow.join('') + ',!?-]', 'g'), '_');

	if (!hideMisses && lettersToShow.length > 0) {
		lettersToShow.sort();

		for (idx in lettersToShow) {
			if (text.indexOf(lettersToShow[idx]) === -1) {
				misses.push(lettersToShow[idx]);
			}
		}

		if (misses.length > 0) {
			text += ' [' + misses.join(', ') + ']';
		}
	}

	return text;
};

HangManPlugin.prototype.isGameRunning = function(chan) {
	return this.states[chan].term !== null;
};

HangManPlugin.prototype.isSolved = function(state) {
	return state.term.replace(new RegExp('[ ' + state.letters.join('') + ',!?-]', 'g'), '').length === 0;
};

HangManPlugin.prototype.giveDeepbotPrize = function(to, message, congratulate, multiplier) {
	var prize = this.configs[this.getChan(message)].deepbotPrize;

	if (prize !== null) {
		if (congratulate === true) {
			if (multiplier > 1) {
				message.respond('you are rewarded ¤ ' + prize + ' × ' + multiplier + '!', true, true);
			}
			else {
				message.respond('you are rewarded ¤ ' + prize + '!', true, true);
			}
		}

		if (multiplier > 1) {
			prize *= multiplier;
		}

		message.respondToAll('!add ' + prize + ' ' + to, true);
	}
};

module.exports = HangManPlugin;
