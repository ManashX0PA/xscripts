const fs = require('fs');
// app offer and profile 
// const fileContent = fs.readFileSync('./append/failedArr.txt', 'utf-8');
// const arr = fileContent.split('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>Appended');
const xarr = [];
const pureFailed = [];
const authFailed = [];
const notFound404 = [];
// for (let item of arr) {
//   try {
//     const obj = JSON.parse(item);
//     if (obj && obj.endpoint) xarr.push(obj);
//     if (obj.apiResp && obj.apiResp.errorData && obj.apiResp.error && obj.apiResp.error.statusCode == 404) notFound404.push(obj);
//     else pureFailed.push(obj);
//   } catch (error) {
//   }
// }


// const arr = require('./result/failedArr.json');
// for (let obj of arr) {
//   const errorObj = obj.apiResp && obj.apiResp.errorData && obj.apiResp.errorData.error && obj.apiResp.errorData.error || {};
//   const myErrorObj = obj.apiResp && obj.apiResp.error || {};
//   const statusCode = errorObj.statusCode;
//   const xCode = myErrorObj.code;
//   if (statusCode == 404) notFound404.push(obj);
//   else if (xCode ==  'AUTHORIZATION_REQUIRED') authFailed.push(obj);
//   else pureFailed.push(obj);
// }

// fs.writeFileSync('./result/failed/pureFailed.json', JSON.stringify(pureFailed, null, 2))
// fs.writeFileSync('./result/failed/authFailed.json', JSON.stringify(authFailed, null, 2))
// fs.writeFileSync('./result/failed/notFound.json', JSON.stringify(notFound404, null, 2))

const arr = require('./result/failed/pureFailed.json');
const getArr = require('./data/get.json')
const appArr = [];
const offerArr = [];
const profileArr = [];
for (let item of arr) {
  if (!getArr.includes(item.endpoint.trim().toLowerCase())) continue;

  if (item.endpoint.trim().toLowerCase().includes('application')) appArr.push(item);
  else if (item.endpoint.trim().toLowerCase().includes('offer')) offerArr.push(item);
  else if (item.endpoint.trim().toLowerCase().includes('profile')) profileArr.push(item);
}

fs.writeFileSync('./error/app.json', JSON.stringify(appArr, null, 2))
fs.writeFileSync('./error/offer.json', JSON.stringify(offerArr, null, 2))
fs.writeFileSync('./error/profile.json', JSON.stringify(profileArr, null, 2))