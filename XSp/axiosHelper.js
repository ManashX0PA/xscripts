const axios = require('axios');
const handlebars = require('handlebars');

const callApi = async ({ url, method, data, headers } = {}) => {
  try {
    const options = {
      url, method, headers, data,
    }
    const axiosResp = await axios(options);
    const axiosData = axiosResp && axiosResp.data || {};
    return axiosData;
  } catch (error) {
    const errorData = error.response && error.response.data;
    const errorStatusCode = error.response && error.response.statusCode;
    // console.error({ data: errorData, statusCode: errorStatusCode, });
    // console.error(error.message)
    // console.error(error);
    return { error: true, statusCode: errorStatusCode, message: error.message || 'Unknown', errorData };
  }
}

module.exports = { callApi };