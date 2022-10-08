const Nylas = require('nylas');
const { default: Draft } = require('nylas/lib/models/draft');

// Initialize and connect to the Nylas client

const xnylas = {
  "NY_API_URL": "https://api.cronofy.com",
  "NY_CLIENT_ID": "25b4wykrunl06p9vakclwxypx",
  "NY_CLIENT_SECRET": "ecnkbk9sni69uwi3u0w5b5861",
  "NY_REDIRECT_URI": "https://staging.x0pa.ai/nylas/cb"
}
Nylas.config({
    clientId: xnylas.NY_CLIENT_ID,
    clientSecret: xnylas.NY_CLIENT_SECRET
});

const ACCESS_TOKEN = "VP5qClxkNNt6VXB8lcojooFbJoNA5j"
const nylas = Nylas.with(ACCESS_TOKEN);

// If the draft has not been created
let draft = new Draft(nylas, {
    subject: 'With Love, from Nylas',
    to: [{ name: 'Bhadra X0PA', email: 'bhadra@x0pa.com' }],
    body: 'This email was sent using the Nylas email API. Visit <a href="https://nylas.com" >Visit</a> for details.'
});

// Create the tracking object
const tracking = { "links": true, "opens": true, "thread_replies": true, "payload": "payload" };

// Send the new draft with the tracking object passed in as an argument
draft.send(tracking).then(message => {
    console.log(`${message.id} was sent`);
});

// // Or, if the draft already exists
// draft = nylas.drafts.find('draft-id');

// // Send the existing draft with the tracking object passed in as an argument
// draft.send(tracking).then(message => {
//     console.log(`${message.id} was sent`);
// });
  
 