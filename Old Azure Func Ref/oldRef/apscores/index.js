const moment = require("moment");
const { CosmosClient } = require("@azure/cosmos");

const xconfig = require("./config");

const {
  xenv, endpoint, key, databaseId,
  ascoresCon,
} = xconfig || {};

const client = new CosmosClient({
  endpoint, key,
});

const database = client.database(databaseId);
const asConName = ascoresCon || "appscores";
const asmc = database.container(asConName);

module.exports = async function (context, req) {
  const ot = Date.now();
  const {
    debug,
  } = req.query || {};
  const { id } = req.params || {};
  let query = "-";
  try {
    context.log(`XAS::: Application scores ran with id:[${id}]`);
    context.log(`XAS::: AS: Query:`, req.query);
    const idLen = (id + "").length;
    if (idLen > 36) {
      context.res = {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          query,
          message: "Invalid application id. Exceeds allowed length",
        },
      };
      return;
    }

    const st = Date.now();
    let qt = -1;
    let res = {
      resources: [],
      headers: {},
    };
    const aitem = asmc.item(id + "", id);
    res = await aitem.read();

    qt = Date.now() - st;
    const { resource: appItem, headers, } = res || {};
    let fres = {};
    const { id: mcfAppId, profile_index, breakdown, score, create_date, match_date,...rp } = appItem || {};
    if(!mcfAppId) {
      let last_data_pull_date = '-';
      switch (xenv) {
        case "STAGING":
          last_data_pull_date = "17 June 2021 12:00AM";
          break;
        case "QA":
          last_data_pull_date = "7 July 2021 12:00AM";
          break;
        case "PRODUCTION":
          last_data_pull_date = moment()
            .add(-8, "h")
            .format("DD MMM YYYY 12:00A");
          break;
        default:
          last_data_pull_date = "Unknown";
      }
      context.res = {
        status: 404,
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          message: `Last Data Pull at ${last_data_pull_date}. No application id currently exists in X0PA DB.`,
        },
      };
      return;
    }
    
    fres = {
      id: profile_index + "",
      app_id: mcfAppId + "",
      score: Number(score || 0),
      resume_status: "unprocessed",
      applied_on_date: create_date,
      match_date: match_date,
      breakdown: breakdown,
    };
    const rc = headers["x-ms-request-charge"];
    context.log("XAS::: Charge:", rc);
    const tt = Date.now() - ot;
    if (debug) {
      fres.tt = tt;
      fres.qt = qt;
      fres.rc = rc;
    }
    context.log("XAS::: Total Time:", tt);
    context.res = {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: fres,
    };
  } catch (err) {
    context.log.error("XAS::: Bad req", err);
    context.log.error("XAS::: Bad req query", query);
    context.res = {
      status: 400,
      headers: {
        "Content-Type": "application/json",
      },
      body: {
        message: "Bad Request / Unknown error occured",
      },
    };
  }
};
