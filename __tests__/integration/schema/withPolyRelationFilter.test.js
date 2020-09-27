const {
  addFakeUniqueConstraintFromIndex,
  uniqueConstraintFromSmartComment,
} = require('../../../src');
const core = require("./core");

test('prints a schema with the fake constraint',
  core.test(['p'], {
    appendPlugins: [addFakeUniqueConstraintFromIndex],
    disableDefaultMutations: true,
    legacyRelations: 'omit',
  })
);


test('prints a schema with the unique constraint plugin',
  core.test(['p'], {
    appendPlugins: [uniqueConstraintFromSmartComment],
    disableDefaultMutations: true,
    legacyRelations: 'omit',
  })
);