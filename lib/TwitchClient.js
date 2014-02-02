var
	Message = require('./Message.js'),
	User    = require('./User.js');

var TwitchClient = function(ircClient) {
	this.irc      = ircClient;
	this.channels = {};

	ircClient.addListener('message', this.onMessage.bind(this));
	ircClient.addListener('raw', console.log.bind(console));
	ircClient.addListener('+mode',   this.onNames.bind(this));
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

	onMessage: function(from, to, text, message) {
		var msg = Message.parseIrcMessage(message), channel;

		//console.log(message);

		// find the channel info
		if (msg.type === Message.REGULAR) {
			channel = this.channels[msg.channel];
		}
		else {
			channel = null;
		}

		user = new User(msg.username, channel);
		msg  = new Message(channel, user, msg.message);

		// console.log(msg);
	},

	onNames: function(channel, by, mode, argument, message) {
		//console.log(channel, by, mode, argument, message);
	}
};

module.exports = TwitchClient;
