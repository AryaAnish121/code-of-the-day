require('dotenv').config();
const numWords = require('num-words');
const mongoose = require('mongoose');
const { Client, MessageEmbed } = require('discord.js');
const client = new Client();
const https = require('https');
var decode = require('unescape');

mongoose.connect(process.env.MONGO);

const channelSchema = new mongoose.Schema({
  channelId: String,
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
            const channelId = message.channel.id;
            const channel = new Channel({
              channelId: channelId,
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
          }
        }
      });
    } else if (cmd === 'q') {
      https.get(
        'https://quizapi.io/api/v1/questions?limit=1',
        {
          headers: {
            'X-Api-Key': `9k2NOla8mq3YwipY4sw8ADB8ErNWe3EccEavqjCA`,
          },
        },
        (res) => {
          let chunks = [];
          res.on('data', (data) => {
            chunks.push(data);
          });
          res.on('end', () => {
            let data = Buffer.concat(chunks);
            const jsonData = JSON.parse(data);
            let counter = 1;
            let description = '';

            for (const property in jsonData[0].answers) {
              if (jsonData[0].answers[property]) {
                description += `:${numWords(counter)}: ${
                  jsonData[0].answers[property]
                } \n \n `;
              }
              counter++;
            }

            const msgEmbed = new MessageEmbed()
              .setTitle(jsonData[0].question)
              .setDescription(description);

            let reactCounter = 1;

            message.channel
              .send(msgEmbed)
              .then((botMsg) => {
                for (const property in jsonData[0].answers) {
                  if (jsonData[0].answers[property]) {
                    if (reactCounter === 1) {
                      botMsg.react('1️⃣');
                    }
                    if (reactCounter === 2) {
                      botMsg.react('2️⃣');
                    }
                    if (reactCounter === 3) {
                      botMsg.react('3️⃣');
                    }
                    if (reactCounter === 4) {
                      botMsg.react('4️⃣');
                    }
                    if (reactCounter === 5) {
                      botMsg.react('5️⃣');
                    }
                    if (reactCounter === 6) {
                      botMsg.react('6️⃣');
                    }
                  }
                  reactCounter++;
                }
              })
              .then(() => {
                let correctAnswer = '';
                const correctAnswersObject = jsonData[0].correct_answers;

                for (const answer in correctAnswersObject) {
                  const answerCheck = correctAnswersObject[answer];
                  if (answerCheck === 'true') {
                    correctAnswer = answer.replace('_correct', '');
                  }
                }

                message.channel.send(
                  `Answer: || ${jsonData[0].answers[correctAnswer]} ||`
                );
              });
          });
        }
      );
    } else if (cmd === 'd') {
      Channel.deleteOne({ channelId: message.channel.id })
        .then(() => {
          message.reply('done');
        })
        .catch((err) => {
          console.log(err);
        });
    } else {
      message.reply(
        `Available commands 
1. Register this channel to get questions (format) :arrow_down:` +
          '```!code r```' +
          `
2. Get an instant question (format) :arrow_down:` +
          '```!code q```'
      );
    }
  }
});

const shuffle = (array) => {
  var currentIndex = array.length,
    randomIndex;

  while (currentIndex != 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }

  return array;
};

const askQuestion = () => {
  https.get(
    'https://opentdb.com/api.php?amount=1&category=18&type=multiple',
    (res) => {
      let chunks = [];
      res.on('data', (data) => {
        chunks.push(data);
      });
      res.on('end', () => {
        let data = Buffer.concat(chunks);
        const jsonData = JSON.parse(data);
        let description = '';

        const choices = shuffle([
          ...jsonData.results[0].incorrect_answers,
          jsonData.results[0].correct_answer,
        ]);

        choices.forEach((choice, index) => {
          description += ` :${numWords(index + 1)}: ${decode(choice)} \n \n`;
        });

        const msgEmbed = new MessageEmbed()
          .setTitle(decode(jsonData.results[0].question))
          .setDescription(description);

        Channel.find({}, (err, channels) => {
          if (err) {
            console.log(err);
          } else {
            channels.forEach((channel) => {
              const sendingChannel = client.channels.cache.get(
                channel.channelId
              );
              if (sendingChannel) {
                sendingChannel.send(msgEmbed).then((sentMsg) => {
                  sentMsg.react('1️⃣');
                  sentMsg.react('2️⃣');
                  sentMsg.react('3️⃣');
                  sentMsg.react('4️⃣');
                });
                sendingChannel.send(
                  `Answer: || ${decode(jsonData.results[0].correct_answer)} ||`
                );
              }
            });
          }
        });
      });
    }
  );
};

client.on('ready', () => {
  console.log('logged in');
  client.user.setActivity('Questioning People :)', { type: 'PLAYING' });
});

client.login(process.env.BOT_TOKEN);

setInterval(askQuestion, 600000);
