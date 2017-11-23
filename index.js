#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const euphoriaConnection = require('euphoria-connection');
const color = require('euphoria-color');
const chalk = require('chalk');

/* configurtation */
const config = require('./config.json');

/* globals */
let userList;

// allows the user to override any setting in the config file by affixing --{setting} {option} when calling the script 
const args = process.argv
		.join()
		.match(/-\w+,\w+/g) || [];
args.forEach( arg => {
		let key = arg
			.split(',')[0]
			.replace('-','');
		config[key] = arg.split(',')[1];
	})

const connection = new euphoriaConnection(config.room, config.human, "wss://euphoria.io", { origin: "https://euphoria.io" });

/* logging */
const logStream = fs.createWriteStream(path.join(__dirname, `application.log`), { flags: 'a' });
function log(...text) {
		text.forEach(text => {
			process.stdout.write(`${text}\n`)
			logStream.write(`${Date.now()} - ${JSON.stringify(text)}\n`)
		});
	}

/* memory */
const memory = []; // post memory
const stack = []; // planned event stack (timeouts) to allow us to override default acctions from CLI
let afkCounter = config.afk.delay * 1000;

const rl = readline.createInterface({
	completer: line => {
		let list = userList.map(user => user.name)
		return [list, line]
	},
	prompt: `${config.nick}${config.prompt}`,
	input: process.stdin,
	output: process.stdout,
	terminal: true
});

/* events */
connection.on('send-event', handleEvent);
connection.on('send-reply', handleEvent);
connection.on('join-event', ev => userList.push(ev.data));
connection.on('part-event', ev => {
	let i = userList.findIndex(user => user.id === ev.data.id);
	if(i > -1)
	userList.splice(i, 1);
});

/**
 * format id in the split colors appropriate.
 * @param {String} id
 */
function formatID(id, n = 3){
	if(n > 8)
		throw new Error("id split has to be below 8")

	// just rewrite this when it comes up
	return id
		? chalk.black(
			(() => {
				let res = "";
				for(let i = 0; i < n; i++){
					res += chalk.bgHsl(color(id.slice(id.length/n * i, id.length/n * (i+1))), 100, 50)(id.slice(id.length/n * i, id.length/n * (i+1)));
				};
				return res;
			})()
		) 
		: ""
	;
}

/**
 * 
 * @param {Object} event 
 */

function handleEvent(event){
	const data = event.data;
	handlePost(data);
	rl.prompt(true);
}

/**
 * formats and writes a euphoria post to TTY.
 * @param {Object} post 
 */

function handlePost(post) {
	rl.pause();
	// log anything posted
	let parent = formatID(post.parent);
	let agent = chalk.black(chalk.bgHsl(color(post.sender.id), 100, 50)(post.sender.id));
	
	log(`${parent}:${formatID(post.id)}:${chalk.hsl(color(post.sender.name),  100, 50)(post.sender.name)}: ${agent}\n> ${post.content}`);
	memory.push(post);
	rl.resume();
}


rl.on('line', line => {
	let override;
	line = line.split(' ');
	let command = line.shift();
	line = line.join(' ');
	if (command.startsWith('q'))
		process.exit();

	if (command.startsWith('p')){
		connection.post(line);
		clearTimeout(stack.shift());
		override = true;
	}

	if (command.startsWith('r')){
		connection.post(line, memory[memory.length-1].id);
		clearTimeout(stack.shift());
		override = true;
	}

	if (command.startsWith('n')){
		config.nick = line;
		nick(config.nick);
	}

	if (command.startsWith('a'))
		nick(config.nick + " - AFK");

	if(!override)
	rl.prompt();
	if(config.afk.enabled)
	afkCounter = config.afk.delay * 1000;

});


/**
 * 
 * @param {*} userlist 
 */
function renderUsers(userlist) {
	
}

/**
 * sets the nick to {nick}
 * @param {String} nick 
 */
function nick(nick = "><>") {
	config.nick = nick;
	connection.nick(nick);
	rl.setPrompt(`${nick}${config.prompt}`);
}

connection.once('ready', () => {
	
	// start with reading out the snapshot event
	connection.once('snapshot-event', ev => {
		userList = ev.data.listing;
		ev.data.log.forEach(handlePost);
		rl.prompt();
	});
	
	connection.nick(config.nick)
	log('connected');

	setInterval( () => {
		if(!--afkCounter)
			connection.nick(config.nick + " - AFK");

	});
});

connection.on('close', (...ev) => log('closed:', ev));
