var
	ModeMessage   = require('./ModeMessage.js'),
	TextMessage   = require('./TextMessage.js'),
	TwitchMessage = require('./TwitchMessage.js'),
	User          = require('./User.js');

var TwitchClient = function(ircClient) {
	this.irc      = ircClient;
	this.channels = {};
	this.plugins  = [];

	ircClient.addListener('message#', this.onMessage.bind(this));
	ircClient.addListener('me',       this.onPrivmsg.bind(this));
	ircClient.addListener('+mode',    this.onModeChange.bind(this));
	ircClient.addListener('-mode',    this.onModeChange.bind(this));
};

TwitchClient.prototype = {
	connect: function(initialChannels) {
		var self = this, irc = this.irc;

		irc.connect(function() {
			// make sure Twitch knows we're not just an ordinary IRC client, but
			// understand their special user semantics (this enables the
			// SPECIALUSER messages from Twitch)
			irc.send('TWITCHCLIENT');

			if (typeof initialChannels === 'object') {
				for (var i = 0, len = initialChannels.length; i < len; ++i) {
					self.joinChannel(initialChannels[i]);
				}
			}
		});
	},

	joinChannel: function(channel) {
		this.channels[channel.getName()] = channel;

		this.irc.join(channel.getIrcName());
	},

	addPlugin: function(plugin) {
		this.plugins.push(plugin);
	},

	onMessage: function(username, chan, text) {
		var
			channel = this.channels[chan.substring(1)],
			user    = new User(username, channel),
			msg     = new TextMessage(channel, user, text);

		this.process(msg);
	},

	onPrivmsg: function(username, text, message) {
		var msg = TwitchMessage.fromIrcMessage(message);

		this.process(msg);
	},

	onModeChange: function(chan, by, mode, username, message) {
		var
			args    = message.args,
			channel = this.channels[args[0].substring(1)],
			user    = args.length === 3 ? new User(args[2], channel) : null,
			msg     = new ModeMessage(channel, args[1], user);

		this.process(msg);
	},

	process: function(message) {
		for (var i in this.plugins) {
			message = this.plugins[i].process(message, this);
		}
	}
};

module.exports = TwitchClient;
