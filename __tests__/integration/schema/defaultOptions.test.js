const core = require("./core");

test(
  "prints a schema with the filter plugin",
  core.test(["p"], {
    // skipPlugins: [PgConnectionArgCondition],
    // appendPlugins: [require("../../../index.js")],
    disableDefaultMutations: true,
    legacyRelations: "omit",
  })
);
