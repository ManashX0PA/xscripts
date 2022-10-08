const moment = require("moment");
const { CosmosClient } = require("@azure/cosmos");

const xconfig = require("./config");

const { xenv, endpoint, key, databaseId, ascoresCon } = xconfig || {};

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
    sortCriteria,
    sortBy,
    ids,
  } = req.body || {};
  let query = "-";
  const applErrMessage = "Invalid payload, expected array of valid application ids.";
  const appErrRes = {
    status: 400,
    headers: {
      "Content-Type": "application/json",
    },
    body: {
      message: applErrMessage,
    },
  };
  try {
    context.log(`XASM::: Appscores ran`, req.body);
    if (!Array.isArray(ids)) {
      context.res = appErrRes;
      return;
    }
    if (ids.length > 100) {
      context.res = {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          message: "Invalid payload, ids array length should be <= 100",
        },
      };
      return;
    }
    let forder = "desc";
    if (sortBy) {
      const sLower = (sortBy + "").toLowerCase();
      if (sLower !== "descending" && sLower !== "ascending") {
        context.res = {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
          body: {
            query,
            message:
              "Invalid sortBy query, should be one of ['ascending', 'descending']",
          },
        };
        return;
      }

      if (sLower === "ascending" || sLower === "asc") {
        forder = "asc";
      } else {
        if (sLower !== "descending" && sLower !== "desc") {
          context.res = {
            status: 400,
            headers: {
              "Content-Type": "application/json",
            },
            body: {
              query,
              message:
                "Invalid sortBy query, should be one of ['ascending', 'descending']",
            },
          };
          return;
        }
      }
    }

    let sortByCol = "score";
    if (sortCriteria) {
      const sLower = (sortCriteria + "").toLowerCase();
      if (sLower === "applied_on_date") {
        sortByCol = 'create_date';
      } else if (sLower === "scores") {
        sortByCol = 'score';
      } else {
        if ((sLower !== "applied_on_date") && (sLower !== "scores")) {
          context.res = {
            status: 400,
            headers: {
              "Content-Type": "application/json",
            },
            body: {
              query,
              message:
                "Invalid sortCriteria query, should be one of ['applied_on_date', 'scores']",
            },
          };
        }
        return;
      }
    }

    let applIdStr = "";
    ids.forEach((r, idx) => {
      if (r && (r.length <= 36)) {
        applIdStr += `"${r}"`;
        if ((idx + 1) < ids.length) {
          applIdStr += ",";
        }
      }
    });
    const applIdStrLenM = applIdStr.length - 1;
    if (applIdStr[applIdStrLenM] === ",") {
      applIdStr = applIdStr.substring(0, applIdStrLenM)
    }
    if (applIdStr.length < 3) {
      context.log.error(`Appidstr length ${applIdStr.length}`, applIdStr);
      context.res = appErrRes;
      return;
    }
    const sq = `SELECT c.id, c.profile_index, c.score, c.breakdown, c.create_date, c.match_date `;
    let fqp = ` FROM ${asConName} c
      where c.id IN (${applIdStr})`;
    query = `${sq} ${fqp}`;
    // query += ` order by c.${sortByCol} ${forder}`;
    const qparameters = [];
    const querySpec = {
      query: query,
      parameters: qparameters,
    };
    console.log("query", query);
    const st = Date.now();
    let qt = -1;
    let res = {
      resources: [],
      headers: {},
    };
    res = await asmc.items.query(querySpec).fetchAll();
    qt = Date.now() - st;
    const { resources: items, headers, hasMoreResults } = res || {};
    let results = [];
    if (Array.isArray(items) && items.length) {
      items.forEach((r) => {
        const { id, profile_index, profile_id, breakdown, score, create_date, match_date, ...rp } = r || {};
        console.log("R", r);
        const fr = {
          id: profile_index + "",
          app_id: id + "",
          score: Number(score || 0),
          resume_status: "unprocessed",
          applied_on_date: create_date,
          match_date: match_date,
          breakdown: breakdown,
        };
        if (debug) {
          fr.r = rp;
        }
        results.push(fr);
      });
    }
    const rc = headers["x-ms-request-charge"];
    context.log("XASM::: Items:", items.length, "Charge:", rc, hasMoreResults);
    const fres = {
      results: results || [],
    };
    const tt = Date.now() - ot;
    if (debug) {
      fres.qt = qt;
      fres.tt = tt;
      fres.q = query;
      fres.qp = qparameters;
      fres.rc = rc;
      fres.hm = hasMoreResults;
    }
    context.log("XASM::: Total Time:", tt);
    context.res = {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: fres,
    };

  } catch (err) {
    context.log.error("XASM::: Bad req", err);
    context.log.error("XASM::: Bad req query", query);
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
