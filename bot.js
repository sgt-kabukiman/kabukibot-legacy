var
	TwitchClient = require('./lib/TwitchClient.js'),
	Channel      = require('./lib/Channel.js'),
	Dummy        = require('./lib/Plugin/ConsoleOutput.js'),
	irc          = require('irc'),
	sqlite3      = require('sqlite3');

var ircClient = new irc.Client('irc.twitch.tv', '...', {
	showErrors: true,
	autoConnect: false,
	floodProtection: true,
	floodProtectionDelay: 1000, // 1 sec
	password: '...',
	realName: '...',
	debug: false
});

var db = new sqlite3.Database('test.sqlite3', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, function() {
	// db.run('CREATE TABLE IF NOT EXISTS channels (name VARCHAR(200), ')
});

var twitchClient = new TwitchClient(ircClient);
var dummy        = new Dummy(console);

twitchClient.addPlugin(dummy);

twitchClient.connect([
	new Channel('...')
]);
