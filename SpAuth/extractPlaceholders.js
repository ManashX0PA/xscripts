const fs = require('fs');
const jsonFile = require('./data/endpoints.json');

const placeHolderMap = {};
for (let [key, value] of Object.entries(jsonFile)) {
  const regex = /{([^}]*)}/g;
  const matchedArr = key.matchAll(regex);
  for (let item of matchedArr) {
    placeHolderMap[item[1]] = "6000";
  }
  fs.writeFileSync('./placeholders.json', JSON.stringify(placeHolderMap, null, 2));
}
