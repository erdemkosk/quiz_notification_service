const cron = require('node-cron');
require('dotenv').config();
const cronTime = require('cron-time-generator');
const express = require('express');
const bodyParser = require('body-parser');
const JSONdb = require('simple-json-db');
const discordPlugin = require('./plugins/discord');

const { MEMBER_MESSAGES_HAVE_NOT_ENTERED_LONG_TIME } = require('./constraints');
const { generateRandomNumber, generateDaysAfter, convertToLookup } = require('./logic');
const { getMembersFromApi, sendPushNotifacations } = require('./services/service-calls');
const { DISCORD_MESSAGE_TYPES } = require('./constraints');

const db = new JSONdb('./database.json');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const port = 3000;

let cronIsStarted = false;

const sendingCron = cron.schedule(cronTime.everyMinute(), () => {
  (async () => {
    let members = await getMembersFromApi({ startDate: generateDaysAfter(3), endDate: Date.now().toString() });

    if (db.has('membersAlreadySended')) {
      const alreadySendedMembers = db.get('membersAlreadySended');

      Object.keys(alreadySendedMembers).forEach((memberId) => {
        members = members.filter(member => member._id !== memberId);
      });

      const membersLookUp = convertToLookup({ items: members, key: '_id' });

      const totalMembers = { ...alreadySendedMembers, ...membersLookUp };
      db.set('membersAlreadySended', totalMembers);
    }
    else {
      const membersLookUp = convertToLookup({ items: members, key: '_id' });
      db.set('membersAlreadySended', membersLookUp);
    }

    const randomNumber = generateRandomNumber(4);

    discordPlugin.sendMessageToDiscord({
      messageType: DISCORD_MESSAGE_TYPES.SUCCESS,
      message: `Toplam gönderilen notifacition kullanıcı sayısı ${members.length}`,
    });

    await sendPushNotifacations({
      members,
      title: MEMBER_MESSAGES_HAVE_NOT_ENTERED_LONG_TIME[`MESSAGE_${randomNumber}`].title,
      body: MEMBER_MESSAGES_HAVE_NOT_ENTERED_LONG_TIME[`MESSAGE_${randomNumber}`].body,
    });
  })();
});

const deleteJsonCron = cron.schedule(cronTime.every(2).minutes(), () => {
  db.deleteAll();
  discordPlugin.sendMessageToDiscord({
    messageType: DISCORD_MESSAGE_TYPES.WARN,
    message: 'Database sıfırlandı',
  });
});

const cronStart = () => {
  cronIsStarted = true;
  sendingCron.start();
  deleteJsonCron.start();
  discordPlugin.sendMessageToDiscord({
    messageType: DISCORD_MESSAGE_TYPES.SUCCESS,
    message: 'Cron başlatıldı.',
  });
};

const cronStop = () => {
  cronIsStarted = false;
  sendingCron.stop();
  deleteJsonCron.stop();
  discordPlugin.sendMessageToDiscord({
    messageType: DISCORD_MESSAGE_TYPES.SUCCESS,
    message: 'Cron durduruldu.',
  });
};

app.get('/status', (req, res) => res.status(200).send({ cronIsStarted }));

app.get('/start', (req, res) => {
  cronStart();
  return res.status(200).send({ cronIsStarted });
});

app.get('/stop', (req, res) => {
  cronStop();
  return res.status(200).send({ cronIsStarted });
});

app.post('/send-notif', async (req, res) => {
  const {
    memberIds, isAdmin, levels, startDate, endDate, emails, nameSurnames, body, title,
  } = req.body;

  const members = await getMembersFromApi({
    memberIds, isAdmin, levels, startDate, endDate, emails, nameSurnames,
  });


  if (members) {
    discordPlugin.sendMessageToDiscord({
      messageType: DISCORD_MESSAGE_TYPES.SUCCESS,
      message: `Manuel Notif Gönderiliyor... Bulunan kriterdeki kullanıcı sayısı  ${members.length}`,
    });

    await sendPushNotifacations({
      members,
      title,
      body,
    });
  }

  else {
    discordPlugin.sendMessageToDiscord({
      messageType: DISCORD_MESSAGE_TYPES.SUCCESS,
      message: `Aranan kriterlerde kullanıcılar bulunamadı  ${JSON.stringify(memberIds, isAdmin, levels, startDate, endDate, emails, nameSurnames)}`,
    });
  }


  return res.status(200).send({ test: true });
});


app.listen(port, () => {
  console.log(`Notification service listening at http://localhost:${port}`);
});
