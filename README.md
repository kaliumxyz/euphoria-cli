# euphoria-cli

> served hot on your command line 😈

A sophisticated and very shiny [euphoria.io](https://euphoria.io) CLI, offering colour IDs, reply options, tricks for dealing with threads, and magic.

rated as the best euphoria CLI 2017.

## install

for the dependencies run:

```bash
$ npm i
```

configure a config.json file or use the included default, the format is as below:

```json
{
    "nick": "K",
    "room": "xkcd",
    "human": 1,
    "override": true,
    "afk": {
        "enabled": true,
        "delay": 600
    }
}

```

## usage

To run it from the command line and connect to the default room (set in the config):

```bash
$ node .
```


## start options

Any root option in the config can be set on startup using long format arguments.

```bash
$ --nick ><>
```

will set the username to `><>`.

```bash
$ node . --room music
```

will join the room music instead of the default set room.

## commands
There are no prefixes to commands, all commands can be either send in declarative English or as the first letter of the command.

### post
Post a single post to the root thread.
```
K> post Hi guys :D
```

### reply
Reply to the last message send.
```
xyzzy: how are you?
K> reply Good :D
```

### nick
Sets the nick of the bot.
```
K> nick ><>
><>>
```

### afk
Affixes - AFK to the nick.
```
K> afk
K - AFK>
```

### quit
Quits the program entirely.

## tests
To run the unit tests simply run: `npm test`

## license
MIT © [Kalium](https://kalium.xyz)