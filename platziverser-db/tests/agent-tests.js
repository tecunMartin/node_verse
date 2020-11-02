const test = require('ava');
const proxyquire = require('proxyquire');
const sinon = require('sinon');
const agentFixtures = require('../tests/fixtures/agent');

let config = {
  logging: function () {},
};

let MetricStub = {
  belongsTo: sinon.spy(),
};

let single = Object.assign({}, agentFixtures.single);
let id = 1;
let AgentStub = null;
let sanbox = null;
let db = null;

test.beforeEach(async () => {
  sanbox = sinon.createSandbox();
  AgentStub = {
    hasMany: sanbox.spy(),
  };

  // Model findById Stub
  AgentStub.findById = sanbox.stub();
  AgentStub.findById.withArgs(id).returns(Promise.resolve(agentFixtures.byId(id)));

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

test.serial('Agent#findById', async (t) => {
  let agent = await db.Agent.findById(id);

  t.true(AgentStub.findById.called, 'findById called on model');
  t.true(AgentStub.findById.calledOnce, 'findById should be called once');
  t.true(AgentStub.findById.calledWith(id), 'findById should be called with speficfi ID');

  t.deepEqual(agent, agentFixtures.byId(id), 'Should be the same');
});
