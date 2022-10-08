const fs = require("fs");
const parse = require("csv-parse/lib/sync");

const xconfig = require("./config");
const { fshareDir } = xconfig || {};

// Synchronous
const getWJobIdMap = () => {
  try {
    const ot = Date.now();
    const jobIdMap = {};
    let st = Date.now();
    const jgen = fs.readFileSync(`${fshareDir}/jgen.csv`);
    console.log("TT:::JMAP FREAD", Date.now() - st);
    st = Date.now();
    const jbjson = parse(jgen, {
      columns: true,
      skip_empty_lines: true,
    });
    console.log("TT:::JMAP FPARSE", Date.now() - st);
    st = Date.now();
    for (let j of jbjson) {
      const { job_id, job_index } = j || {};
      jobIdMap[job_index] = job_id;
    }
    console.log("TT:::JMAP LOOP", Date.now() - st);
    console.log("TT:::JMAP TOTAL", Date.now() - ot);
    return jobIdMap;
  } catch (err) {
    console.error(err);
    return {};
  }
};

// Synchronous
const getWProfileIdMap = () => {
  try {
    const ot = Date.now();
    const profileIdMap = {};
    let st = Date.now();
    const pgen = fs.readFileSync(`${fshareDir}/pgen.csv`);
    console.log("TT:::PMAP FREAD", Date.now() - st);
    st = Date.now();
    const pfjson = parse(pgen, {
      columns: true,
      skip_empty_lines: true,
    });
    console.log("TT:::PMAP PARSE", Date.now() - st);
    st = Date.now();
    for (let p of pfjson) {
      const { profile_id, profile_index } = p || {};
      profileIdMap[profile_index] = profile_id;
    }
    console.log("TT:::PMAP LOOP", Date.now() - st);
    console.log("TT:::PMAP TOTAL", Date.now() - ot);
    return profileIdMap;
  } catch (err) {
    console.error(err);
    return {};
  }
};

module.exports = {
  getWJobIdMap,
  getWProfileIdMap,
};
