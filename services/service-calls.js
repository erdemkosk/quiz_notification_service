/* eslint-disable no-await-in-loop */
const axios = require('axios');

const getMembersFromApi = async ({
  memberIds, isAdmin, levels, startDate, endDate, emails, nameSurnames,
}) => {
  const options = {
    headers: {
      Authorization: `Bearer ${process.env.TOKEN}`,
    },
  };

  const data = {
    startDate,
    endDate,
    memberIds,
    isAdmin,
    levels,
    emails,
    nameSurnames,
  };

  const response = await axios.post(process.env.FILTER_URL, data, options);

  return response.data.results;
};

const sendPushNotifacations = async ({ members, title, body }) => {
  for (let i = 0; i < members.length; i += 1) {
    if (!members[i].notifications) {
      break;
    }
    for (let z = 0; z < members[i].notifications.length; z += 1) {
      const data = {
        to: members[i].notifications[z],
        title: `${members[i].nameSurname} ${title}`,
        body,
      };

      await axios.post(process.env.EXPO_URL, data);
    }
  }
};

module.exports = {
  getMembersFromApi,
  sendPushNotifacations,
};
