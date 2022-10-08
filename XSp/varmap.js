const fs = require('fs');
// app offer and profile 
const fileContent = fs.readFileSync('./append/failedArr.txt', 'utf-8');
const arr = fileContent.split('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>Appended');