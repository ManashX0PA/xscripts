const os = require("os");
const moment = require("moment");
const { CosmosClient, ConsistencyLevel } = require("@azure/cosmos");
// const CosmosClient = require("@azure/cosmos").CosmosClient;

const xconfig = require("./config");
// const { getWJobIdMap, getWProfileIdMap } = require("./mmap");

const { xenv, endpoint, key, databaseId, containerId } = xconfig || {};

const client = new CosmosClient({
  endpoint, key,
  // consistencyLevel: ConsistencyLevel.Eventual
});

const database = client.database(databaseId);
const container = database.container(containerId);
const jmc = database.container("jmap");
const pmc = database.container("pmap");

// const ot = Date.now();
// const f1 = os.freemem();
// const fjobIdMap = getWJobIdMap();
// const f2 = os.freemem();
// const fprofileIdMap = getWProfileIdMap();
// const f3 = os.freemem();
// console.log("TT:::DATA LOAD", Date.now() - ot);
// const den = 1000 * 1000;
// console.log(
//   "MEM::: JLoad PLoad Total",
//   f1 / den,
//   (f1 - f2) / den,
//   (f2 - f3) / den,
//   (f1 - f3) / den
// );

const mayBeParse = (str, context) => {
  try {
    if(typeof str != "string") {
      return str;
    }
    try {
      return JSON.parse(str);
    } catch (e) {
      context.log.warn("XST::: unable to json parse str 1", str);
      context.log.error("XST::: unable to json parse err 1", e);
      try {
        let str1 = str.replace(/'/g, "");
        return JSON.parse(str1);
      } catch(e) {
        context.log.warn("XST::: unable to json parse str 2", str);
        context.log.error("XST::: unable to json parse err 2", e);
        let str2 = str.replace(/\'/g, '"');
        return JSON.parse(str2);
      }
    }
  } catch(err) {
    context.log.warn("XST::: unable to json parse str", str);
    context.log.error("XST::: unable to json parse err", err);
    return str;
  }
};

const getJobId = async (jid, context) => {
  const st = Date.now();
  try {
    const query = "select j.job_id from jmap j where j.job_index=@jid";
    const qparameters = [
      {
        name: "@jid",
        value: jid + "",
      },
    ];
    const querySpec = {
      query: query,
      parameters: qparameters,
    };
    const res = await jmc.items.query(querySpec).fetchAll();
    const { resources: items, headers } = res || {};
    const rc = headers["x-ms-request-charge"];
    const { job_id } = items[0] || {};
    context.log("XST:::jres", rc, job_id);
    context.log("XST:::TT:::jmap::suc", Date.now() - st);
    return job_id;
  } catch (err) {
    context.log.error(err);
    context.log.error("XST:::TT:::jmap::err", Date.now() - st);
    return null;
  }
};

const getProfileIdMap = async (pidArr, pidStr, context) => {
  const st = Date.now();
  try {
    // console.log("pidArr", pidArr);
    let query = `select p.profile_id, p.profile_index from pmap p where p.profile_id in (${pidStr})`;
    // query = `select p.profile_id, p.profile_index from pmap p where p.profile_id in @profileIdArr`;
    // console.log("query", query);
    // const qparameters = [
    //   {
    //     name: "@profileIdArr",
    //     value: pidArr
    //   }
    // ];
    const querySpec = {
      query: query,
      // parameters: qparameters,
    };
    const res = await pmc.items.query(querySpec).fetchAll();
    const { resources: items, headers } = res || {};
    // console.log("items", items);
    const rc = headers["x-ms-request-charge"];
    const pmap = {};
    if (Array.isArray(items)) {
      items.forEach((p) => {
        // console.log("p", p);
        const { profile_id, profile_index } = p || {};
        if (profile_id && profile_index) {
          pmap[profile_id] = profile_index;
        }
      });
    }
    context.log("XST:::pres", rc);
    context.log("XST:::TT:::pmap::suc", Date.now() - st);
    return pmap;
  } catch (err) {
    context.log.error("XST:::", err);
    context.log.error("XST:::TT:::pmap::err", Date.now() - st);
    return {};
  }
};

const getTotalCount = async (querySpec, context) => {
  const st = Date.now();
  let tcount = 0;
  try {
    const res = await container.items.query(querySpec).fetchAll();
    const { resources: items, headers, } = res || {};
    context.log("XST:::COUNT", items[0]);
    const rc = headers["x-ms-request-charge"];
    if (items.length) {
      tcount = items[0];
    }
    const tctime = Date.now() - st;
    context.log("XST:::tres", rc);
    context.log("XST:::TT:::tres::suc", tctime);
    return { count: tcount, crc: rc, tct: tctime };
  } catch (err) {
    const tctime = Date.now() - st;
    context.log.error("XST:::", err);
    context.log.error("XST:::TT:::tres::err", tctime);
    return {
      count: 0,
      crc: -1,
      tct: tctime,
    };
  }
};

module.exports = async function (context, req) {
  const ot = Date.now();
  // const profileIdMap = {};

  // id: constr(max_length = 36),
  // toLastModified: Optional[date] = datetime.now().date(),
  // fromLastModified: Optional[date] = (datetime.now() - timedelta(days = 180)).date(),
  // limit: Optional[conint(ge = 1, le = 150)] = 120,
  // page: Optional[conint(ge = 0)] = 0,
  // threshold: Optional[conint(ge = 0, le = 100)] = 0,
  // sortBy: sortByEnum = sortByEnum.descending

  // id = '2d5b87b169f7d03104e610653828c467'
  // toLastModified = datetime.now().date()
  // fromLastModified = (datetime.now() - timedelta(days = 180)).date()
  // threshold = 0
  // page = 999
  // limit = 5
  const {
    toLastModified,
    fromLastModified,
    limit,
    page,
    threshold,
    sortBy,
    debug,
  } = req.query || {};
  const { id } = req.params || {};
  let query = "-";
  let tquery = "-";
  try {
    context.log(`XST::: Suggested Talent ran with id:[${id}]`);
    context.log(`XST::: ST: Query:`, req.query);
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
    if((offset + flimit) > 150) {
      flimit = 150 - offset;
    }
    let ffromlastModified = moment().add(-180, "d").format("YYYY-MM-DD");
    if (fromLastModified) {
      if (moment(fromLastModified, "YYYY-MM-DD").isValid()) {
        ffromlastModified = moment(fromLastModified).format("YYYY-MM-DD");
      } else {
        context.res = {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
          body: {
            query,
            message:
              "Invalid fromLastModified date/date-format. Date should be valid and is of format yyyy-mm-dd",
          },
        };
        return;
      }
    }

    let ftoLastModified = moment().format("YYYY-MM-DD");
    if (toLastModified) {
      if (moment(toLastModified, "YYYY-MM-DD").isValid()) {
        ftoLastModified = moment(toLastModified).format("YYYY-MM-DD");
      } else {
        context.res = {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
          body: {
            query,
            message:
              "Invalid toLastModified date/date-format. Date should be valid and is of format yyyy-mm-dd",
          },
        };
        return;
      }
    }

    const thresholdNum = threshold && Number(threshold);
    if (
      threshold &&
      (isNaN(thresholdNum) || thresholdNum > 100 || thresholdNum < 0)
    ) {
      context.res = {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          query,
          message:
            "Invalid threshold value(should be an integer between 0 - 100)",
        },
      };
      return;
    }

    let forder = "desc";
    if (sortBy) {
      const sLower = (sortBy + "").toLowerCase();
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

    let jt = -1;
    const jst = Date.now();
    const jobId = await getJobId(id, context);
    jt = Date.now() - jst;
    // jobIdMap[id];

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
    } else {
      const sq = `SELECT c.job_id,c.profile_id,c.overall_score,
      c.skill_match_breakdown,c.score,c.breakdown,c.manual_entry,
      c.match_date,c.update_date,c.is_open_to_opportunities `
      let tqp = `SELECT VALUE COUNT(1) `;
      let fqp = ` FROM ${containerId} c
      where c.job_id=@jobId
      and c.is_open_to_opportunities=true
      and c.update_date >= @ffromlastModified
      and c.update_date <= @ftoLastModified`;
      if (thresholdNum) {
        fqp += ` and c.score >= @thresholdNum`;
      }
      query = `${sq} ${fqp}`;
      tquery = `${tqp} ${fqp}`;
      query += ` order by c.score ${forder}`;
      query += ` offset ${offset} limit ${flimit}`;
      const qparameters = [
        {
          name: "@jobId",
          value: jobId + "",
        },
        {
          name: "@ffromlastModified",
          value: ffromlastModified,
        },
        {
          name: "@ftoLastModified",
          value: ftoLastModified,
        },
      ];
      if (thresholdNum) {
        qparameters.push({
          name: "@thresholdNum",
          value: thresholdNum,
        });
      }
      const querySpec = {
        query: query,
        parameters: qparameters,
      };
      const tquerySpec = {
        query: tquery,
        parameters: qparameters,
      };
      const tcountRes = await getTotalCount(tquerySpec, context);
      const { count: tcnt, crc, tct } = tcountRes || {};
      let tcount = Math.min(tcnt, 150);
      const st = Date.now();
      let qt = -1;
      let res = {
        resources: [],
        headers: {},
      };
      if(offset < 150 && flimit > 0) {
        res = await container.items.query(querySpec).fetchAll();
        qt = Date.now() - st;
      }
      const { resources: items, headers, hasMoreResults } = res || {};
      let results = [];
      let pt = -1;
      if (Array.isArray(items) && items.length) {
        const profileIds = [];
        let pstr = "";
        items.forEach((r, idx) => {
          const { profile_id } = r || {};
          if (profile_id) {
            pstr += `"${profile_id}"`;
            if (idx + 1 < items.length) {
              pstr += ",";
            }
            profileIds.push(profile_id);
          }
        });
        let profileMap = {};
        if (profileIds.length) {
          const pst = Date.now();
          profileMap = await getProfileIdMap(profileIds, pstr, context);
          pt = Date.now() - pst;
          // console.log("profileMap", profileMap);
        }
        items.forEach((r) => {
          const { profile_id, breakdown, score, ...rp } = r || {};
          const xid = profileMap[profile_id];
          // context.log("XST:::breakdown", breakdown);
          const fr = {
            id: xid + "",
            score: Number(score || 0),
            breakdown: mayBeParse(breakdown, context),
            resume_status: "unprocessed",
          };
          if (debug) {
            fr.profile_id = profile_id;
            fr.r = rp;
          }
          results.push(fr);
          // const af = moment(ftoLastModified, "YYYY-MM-DD").isSameOrAfter(update_date, 'day');
          // const bf = moment(ffromlastModified, "YYYY-MM-DD").isSameOrBefore(update_date, 'day');
          // if(update_date
          //   && is_open_to_opportunities
          //   && af
          //   && bf
          // ) {
          //   r.score = Number(score || 0);
          //   if(thresholdNum) {
          //     if(score >= thresholdNum) {
          //       results.push(r);
          //     }
          //   } else {
          //     results.push(r);
          //   }
          // } else {
          // results.push({
          //   is_open_to_opportunities,
          //   threshold: threshold || '-',
          //   update_date,
          //   a: af,
          //   b: bf,
          //   bf: moment(ffromlastModified, "YYYY-MM-DD"),
          //   af: moment(ftoLastModified, "YYYY-MM-DD"),
          // });
          // }
        });
      }
      // const fresults = orderBy(results, ["score", "desc"]);
      const rc = headers["x-ms-request-charge"];
      context.log("XST::: Items:", items.length, "Charge:", rc, hasMoreResults);
      const fres = {
        resultCount: tcount,
        results: results || [],
      };
      const tt = Date.now() - ot;
      if (debug) {
        fres.icnt = (Array.isArray(results) && results.length) || 0,
        fres.jt = jt;
        fres.qt = qt;
        fres.pt = pt;
        fres.tt = tt;
        fres.tct = tct;
        fres.j = jobId || "0";
        fres.q = query;
        fres.qp = qparameters;
        fres.rc = rc;
        fres.crc = crc;
        fres.hm = hasMoreResults;
      }
      context.log("XST::: Total Time:", tt);
      context.res = {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
        body: fres,
      };
    }
  } catch (err) {
    context.log.error("XST::: Bad req", err);
    context.log.error("XST::: Bad req query", query);
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
