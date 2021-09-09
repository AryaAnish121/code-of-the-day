require('dotenv').config();
const mongoose = require('mongoose');
const { Client } = require('discord.js');
const client = new Client();

mongoose.connect('mongodb://localhost:27017/codeoftheday');

const channelSchema = new mongoose.Schema({
  id: String,
  category: String,
});

const Channel = mongoose.model('channel', channelSchema);

const PREFIX = '!code';

client.on('message', (message) => {
  if (message.author.bot) return;
  if (message.content.startsWith(PREFIX)) {
    const [cmd, value] = message.content.replace(PREFIX, '').trim().split(' ');
    if (cmd === 'r') {
      if (!value) {
        message.reply(
          'Please give a question category, format should be ```!code r <category (javascript or python)>```'
        );
      } else {
        if (
          value.toLocaleLowerCase() === 'javascript' ||
          value.toLocaleLowerCase() === 'python'
        ) {
          const channelId = message.channel.id;
          const channel = new Channel({
            id: channelId,
            category: value,
          });
          channel.save((err) => {
            if (err) {
              console.log(err);
            } else {
            }
          });
        } else {
          message.reply(
            'Please give a valid question category, format should be ```!code r <category (javascript or python)>```'
          );
        }
      }
    } else {
      message.reply(`Available commands 
1. !code r
2. !code q
      `);
    }
  }
});

client.on('ready', () => {
  console.log('logged in');
});

client.login(process.env.BOT_TOKEN);
