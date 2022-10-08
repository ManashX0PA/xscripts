
const supportedAPIs = [
  "suggested-talent",
  "application-scores",
  "skill-taxonomy",
  "suggested-skill",
  "cv-parser"
];

module.exports = async function (context, req) {
  context.log('Health status api triggered');
  const apiName = req.params["api-name"] || 'none';
  const apiNameLower = (apiName+"").toLowerCase();
  if(!supportedAPIs.includes(apiNameLower)) {
    context.res = {
      status: 400,
      headers: {
        "Content-Type": "application/json",
      },
      body: {
        message: `${apiName} is not a recognized resource`,
      }
    };
    return;
  }
  context.res = {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: "200"
  };
};