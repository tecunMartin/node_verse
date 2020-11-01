const test = require('ava');

let config = {
  logging: function () {},
};

let db = null;

test.beforeEach(async () => {
  const setupDatabase = require('../index');
  db = await setupDatabase(config);
});

test('Agent', (t) => {
  t.truthy(db.Agent, 'Agent service should exits');
});
