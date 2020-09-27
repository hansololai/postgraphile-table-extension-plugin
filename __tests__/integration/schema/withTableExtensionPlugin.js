const {
  tableExtensionPlugin
} = require('../../../src');
const core = require("./core");

test('prints a schema with the table extension plugin',
  core.test(['p'], {
    appendPlugins: [tableExtensionPlugin],
    disableDefaultMutations: true,
    legacyRelations: 'omit',
  })
);
