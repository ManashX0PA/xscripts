const { callApi } = require("./axiosHelper");
const handlebars = require('handlebars');
const placeholders = require('./placeholders.json');
const jsonFile = require('./data/endpoints.json');
const fs = require('fs');
const ProgressBar = require('progress');

const passedArr = [];
const failedArr = [];
const allArr = [];

const main = async () => {
  try {
    const totalItems = Object.entries(jsonFile).length;
    console.log(totalItems)
    const validatingBar = new ProgressBar('Validating [:bar] :rate :percent :etas', { total: totalItems });
    let completed = [];
    try {
      completedContent = fs.readFileSync('./completed.json', 'utf-8');
      completed = JSON.parse(completedContent);
    } catch (error) {
      completed = []
    }
    for (let [key, value] of Object.entries(jsonFile)) {
      if (completed.includes(key)) continue;
      validatingBar.tick();
      const xkey = key.replace(/{/g, '{{').replace(/}/g, '}}');
      const urlReplacer = handlebars.compile(xkey);
      const endUrl = urlReplacer(placeholders);
      const fullEndpoint = `http://internship-placement.rp.edu.sg/roboroy/api/v1${endUrl}?x=x0patest`

      let failedItem = {};
      let passedItem = {};
      let allItem = {};
      // console.log(fullEndpoint);

      const val = 'get';
      const apiResp = await callApi({ url: fullEndpoint, method: val });
      // console.log({ apiResp })

      // est failed with status code 401',
      // errorData: { error: 'Unauthorized', code: 'X0PA-401-1' }
      allItem = {
        method: val,
        endpoint: key,
        endUrl,
        apiResp,
      };
      allArr.push(allItem);
      if (apiResp && apiResp.errorData && apiResp.errorData.error === 'Unauthorized') {
        passedItem = {
          method: val,
          endpoint: key,
          endUrl,
        };
        passedArr.push(passedItem);
      } else {
        failedItem = {
          method: val,
          endpoint: key,
          endUrl,
          apiResp,
        };
        failedArr.push(failedItem);
      }
      completed.push(key);

      fs.appendFileSync('./append/passedArr.txt', JSON.stringify(passedItem, null, 2) + "\n>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>Appended\n");
      fs.appendFileSync('./append/failedArr.txt', JSON.stringify(failedItem, null, 2) + "\n>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>Appended\n");
      fs.appendFileSync('./append/allArr.txt', JSON.stringify(allItem, null, 2) + "\n>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>Appended\n");
      
      // fs.writeFileSync('./append/passedArr.json', JSON.stringify([...passedArrPrev, ...passedArr], null, 2));
      // fs.writeFileSync('./append/failedArr.json', JSON.stringify([...failedArrPrev, ...failedArr], null, 2));
      // fs.writeFileSync('./append/allArr.json', JSON.stringify([...allArrPrev, ...allArr], null, 2));
      
      completed.push(key);
      fs.writeFileSync('./completed.json', JSON.stringify(completed, null, 2));
      // await new Promise(resolve => setTimeout(resolve, 200));
    }
  } catch (error) {
    console.error(error);
  }
}

main();