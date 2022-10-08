const fs = require('fs');

// const endpointObj = require('./data/endpoints.json');
// const getArr = [];
// for (let [key, value] of Object.entries(endpointObj)) {
//   const valArr = value && Array.isArray(value) ? value.map(item => `${item || ''}`.trim().toLowerCase()) : [];
//   if (valArr.includes('get')) getArr.push(key);
// }
// fs.writeFileSync('./error/profile.json', JSON.stringify(getArr, null, 2))

const arr = require('./result/failedArr.json');
// const arr = require('./error/app.json');
const getArr = require('./data/get.json');

const refinedArr = [];
const notfound = [];
const pureArr = [];
for (let item of arr) {
  const endpoint = item.endpoint.trim().toLowerCase();
  if (!getArr.includes(endpoint)) continue;
  // if (endpoint.includes('application-base')) continue;
  if (!endpoint.includes('profile')) continue;

  const errorObj = item.apiResp && item.apiResp.errorData && item.apiResp.errorData.error && item.apiResp.errorData.error || {};
  const myErrorObj = item.apiResp && item.apiResp.error || {};
  
  const statusCode = errorObj.statusCode;
  const xCode = myErrorObj.code;
  if (statusCode == 404) notfound.push(item);
  else pureArr.push(item);

}

fs.writeFileSync('./error/profile-pure.json', JSON.stringify(pureArr, null, 2))
fs.writeFileSync('./error/profile-notfound.json', JSON.stringify(notfound, null, 2))