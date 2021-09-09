require('dotenv').config();
const mongoose = require('mongoose');
const { Client } = require('discord.js');
const client = new Client();

mongoose.connect('mongodb://localhost:27017/codeoftheday');

const channelSchema = new mongoose.Schema({
  channelId: String,
  category: String,
});

const Channel = mongoose.model('channel', channelSchema);

const PREFIX = '!code';

client.on('message', (message) => {
  if (message.author.bot) return;
  if (message.content.startsWith(PREFIX)) {
    const [cmd, value] = message.content.replace(PREFIX, '').trim().split(' ');
    if (cmd === 'r') {
      Channel.findOne({ channelId: message.channel.id }, (err, result) => {
        if (err) {
          console.log(err);
        } else {
          if (result) {
            message.reply('Channel already registered');
          } else {
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
                  channelId: channelId,
                  category: value,
                });
                channel.save((err) => {
                  if (err) {
                    console.log(err);
                  } else {
                    message.reply(
                      'Done... Now, the bot will send a question every 10 minutes'
                    );
                  }
                });
              } else {
                message.reply(
                  'Please give a valid question category, format should be ```!code r <category (javascript or python)>```'
                );
              }
            }
          }
        }
      });
    } else {
      message.reply(`Available commands 
1. !code r - Register this channel to get questions
2. !code q - Get an instant question
      `);
    }
  }
});

client.on('ready', () => {
  console.log('logged in');
});

client.login(process.env.BOT_TOKEN);
