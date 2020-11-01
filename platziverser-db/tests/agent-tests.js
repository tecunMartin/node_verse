const test = require('ava');
const proxyquire = require('proxyquire');
const sinon = require('sinon');

let config = {
  logging: function () {},
};

let MetricStub = {
  belongsTo: sinon.spy(),
};

let AgentStub = null;
let sanbox = null;
let db = null;

test.beforeEach(async () => {
  sanbox = sinon.createSandbox();
  AgentStub = {
    hasMany: sanbox.spy(),
  };

  const setupDatabase = proxyquire('../index', {
    './models/agent': () => AgentStub,
    './models/metric': () => MetricStub,
  });
  db = await setupDatabase(config);
});

test.afterEach(() => {
  sanbox && sinon.restore();
});

test('Agent', (t) => {
  t.truthy(db.Agent, 'Agent service should exits');
});

test.serial('Setup', (t) => {
  t.true(AgentStub.hasMany.called, 'AgentModel.hasMany was executed');
  t.true(AgentStub.hasMany.calledWith(MetricStub), 'Argument should be the MetricModel');
  t.true(MetricStub.belongsTo.called, 'MetricModel.belongsTo was executed');
  t.true(MetricStub.belongsTo.calledWith(AgentStub), 'Argumet should be the Agentmodel');
});
