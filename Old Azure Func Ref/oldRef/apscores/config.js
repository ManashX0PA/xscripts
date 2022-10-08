const XNENV = process.env.XNENV;
const XDB = process.env.XDB;
const XCON = process.env.XCON;
const XCOSURI = process.env.XCOSURI;
const XCOSKEY = process.env.XCOSKEY;
const XSHAREDIR = process.env.XSHAREDIR;
const XASCORECON = process.env.XASCORECON;

const config = {
  endpoint: XCOSURI,
  key: XCOSKEY,
  xenv: XNENV,
  databaseId: XDB,
  containerId: XCON,
  fshareDir: XSHAREDIR,
  ascoresCon: XASCORECON,
};

module.exports = config;
