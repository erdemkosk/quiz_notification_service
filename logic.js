const generateRandomNumber = maxValue => Math.floor(Math.random() * maxValue);

const generateDaysAfter = (days) => {
  const result = new Date();
  result.setDate(result.getDate() - days);
  return result;
};

const convertToLookup = ({ items, key = 'key' }) => {
  const lookup = {};
  items
    .forEach((item) => {
      lookup[item[key].toString()] = item;
    });

  return lookup;
};

module.exports = {
  generateRandomNumber,
  generateDaysAfter,
  convertToLookup,
};
