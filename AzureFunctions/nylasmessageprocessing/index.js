module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    const reqMethodVal = (req.method + "").trim().toLowerCase();
    if (reqMethodVal === 'get') {
        console.log("method", req.method)
        const { query } = req || {};
        const { challenge } = query || {};
        context.res = {
            status: 200,
            body: challenge,
        }
    }
    else if (reqMethodVal === 'post') {
        console.log("method", req.method)
        const { body } = req || {};
        context.log(body)

        

        
        context.res = {
            status: 200,
            body: body,
        }
    }
}