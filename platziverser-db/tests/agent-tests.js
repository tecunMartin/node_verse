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
let uuid = 'yyy-yyy-yyy';
let AgentStub = null;
let sanbox = null;
let db = null;

let uuidArgs = {
  where: {
    uuid,
  },
};

test.beforeEach(async () => {
  sanbox = sinon.createSandbox();
  AgentStub = {
    hasMany: sanbox.spy(),
  };

  // Model findOne Stub
  AgentStub.findOne = sanbox.stub();
  AgentStub.findOne.withArgs(uuidArgs).returns(Promise.resolve(agentFixtures.byUuid(uuid)));

  // Model update Stub
  AgentStub.update = sanbox.stub();
  AgentStub.update.withArgs(single, uuidArgs).returns(Promise.resolve(single));

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

test.serial('Agent#createORupdate - exists', async (t) => {
  let agent = await db.Agent.createOrUpdate(single);

  t.true(AgentStub.findOne.called, 'findOne should be called on model');
  t.true(AgentStub.findOne.calledTwice, 'findOne should be called twice');
  t.true(AgentStub.update.calledOnce, 'Update should be called once');

  t.deepEqual(agent, single, 'Agent should be the same');
});
