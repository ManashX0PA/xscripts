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
const jmc = database.container("jmap");

const getJobId = async (jid, context) => {
  const st = Date.now();
  try {
    const jitem = jmc.item(jid + "", jid);
    const res = await jitem.read();
    const { resource: jobItem, headers, } = res || {};
    console.log("res", res);
    const rc = headers["x-ms-request-charge"];
    const { job_id } = jobItem || {};
    context.log("XJAP:::jres", rc, job_id);
    context.log("XJAP:::TT:::jmap::suc", Date.now() - st);
    return job_id;
  } catch (err) {
    context.log.error(err);
    context.log.error("XJAP:::TT:::jmap::err", Date.now() - st);
    return null;
  }
};

const getTotalCount = async (querySpec, context) => {
  const st = Date.now();
  let tcount = 0;
  try {
    const res = await asmc.items.query(querySpec).fetchAll();
    const { resources: items, headers, } = res || {};
    context.log("XJAP:::COUNT", items[0]);
    const rc = headers["x-ms-request-charge"];
    if (items.length) {
      tcount = items[0];
    }
    const tctime = Date.now() - st;
    context.log("XJAP:::tres", rc);
    context.log("XJAP:::TT:::tres::suc", tctime);
    return { count: tcount, crc: rc, tct: tctime };
  } catch (err) {
    const tctime = Date.now() - st;
    context.log.error("XJAP:::", err);
    context.log.error("XJAP:::TT:::tres::err", tctime);
    return {
      count: 0,
      crc: -1,
      tct: tctime,
    };
  }
};

module.exports = async function (context, req) {
  const ot = Date.now();
  const {
    limit,
    page,
    debug,
    sortCriteria,
    sortBy,
  } = req.query || {};
  const { id } = req.params || {};
  let query = "-";
  let tquery = "-";
  try {
    context.log(`XJAP::: Job Appscores ran with id:[${id}]`);
    context.log(`XJAP::: JAP: Query:`, req.query);
    const idLen = (id + "").length;
    if (idLen > 36) {
      context.res = {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          query,
          message: "Invalid position opening id. Exceeds allowed length",
        },
      };
      return;
    }

    let flimit = 120;
    const limitNum = Number(limit);
    if (limit) {
      if (isNaN(limitNum) || limit < 1 || limit > 150) {
        context.res = {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
          body: {
            query,
            message:
              "Invalid limit, limit should be a valid integer and allowed limit (1-150)",
          },
        };
        return;
      } else {
        flimit = Math.min(limitNum, 150);
      }
    }

    let offset = 0;
    let fpage = 0;
    const pageNum = Number(page);
    if (page) {
      if (isNaN(pageNum) || pageNum < 0) {
        context.res = {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
          body: {
            query,
            message: "Invalid page, should be a valid number and >= 0",
          },
        };
        return;
      } else {
        fpage = page;
      }
    }
    offset = fpage * flimit;
    // if ((offset + flimit) > 150) {
    //   flimit = 150 - offset;
    // }

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

    let jt = -1;
    const jst = Date.now();
    const jobId = await getJobId(id, context);
    jt = Date.now() - jst;

    let last_data_pull_date = "NA";
    if (!jobId) {
      context.log(`XST:::No jobId for ${id}`);
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
          message: `Last Data Pull at ${last_data_pull_date}. No position opening id currently exists in X0PA DB.`,
        },
      };
      return;
    }
    const sq = `SELECT c.id, c.profile_index, c.score, c.breakdown, c.create_date, c.match_date `
    let tqp = `SELECT VALUE COUNT(1) `;
    let fqp = ` FROM ${asConName} c
      where c.job_index=@jobIndex`;
    query = `${sq} ${fqp}`;
    tquery = `${tqp} ${fqp}`;
    query += ` order by c.${sortByCol} ${forder} offset ${offset} limit ${flimit}`;
    const qparameters = [
      {
        name: "@jobIndex",
        value: id + "",
      },
    ];
    const querySpec = {
      query: query,
      parameters: qparameters,
    };
    const tquerySpec = {
      query: tquery,
      parameters: qparameters,
    };
    console.log("query", query);
    console.log("tquery", tquery);
    const tcountRes = await getTotalCount(tquerySpec, context);
    const { count: tcnt, crc, tct } = tcountRes || {};
    let tcount = tcnt;
    const st = Date.now();
    let qt = -1;
    let res = {
      resources: [],
      headers: {},
    };
    if (flimit > 0) {
      res = await asmc.items.query(querySpec).fetchAll();
      qt = Date.now() - st;
    }
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
    context.log("XJAP::: Items:", items.length, "Charge:", rc, hasMoreResults);
    const fres = {
      resultCount: tcount,
      results: results || [],
    };
    const tt = Date.now() - ot;
    if (debug) {
      fres.icnt = (Array.isArray(results) && results.length) || 0;
      fres.qt = qt;
      fres.jt = jt;
      fres.tt = tt;
      fres.tct = tct;
      fres.q = query;
      fres.qp = qparameters;
      fres.rc = rc;
      fres.crc = crc;
      fres.hm = hasMoreResults;
    }
    context.log("XJAP::: Total Time:", tt);
    context.res = {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: fres,
    };

  } catch (err) {
    context.log.error("XJAP::: Bad req", err);
    context.log.error("XJAP::: Bad req query", query);
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
