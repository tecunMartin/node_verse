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

// Variables de uso global
let id = 1;
let uuid = 'yyy-yyy-yyy';
let AgentStub = null;
let sandbox = null;
let db = null;
let single = Object.assign({}, agentFixtures.single);

let usernameArgs = {
  where: { username: 'platzi', connected: true },
};

let connectedArgs = {
  where: { connected: true },
};

let uuidArgs = {
  where: { uuid },
};

// En el caso para crear un agente.
let newAgent = {
  uuid: '123-123-123',
  name: 'test',
  username: 'test',
  hostname: 'test',
  pid: 0,
  connected: false,
};

// Lo que hara antes de cada prueba.
test.beforeEach(async () => {
  sandbox = sinon.createSandbox();
  AgentStub = {
    hasMany: sandbox.spy(),
  };

  // Model create stub
  AgentStub.create = sandbox.stub();
  AgentStub.create.withArgs(newAgent).returns(
    Promise.resolve({
      toJSON() {
        return newAgent;
      },
    })
  );

  // Model update Stub
  AgentStub.update = sandbox.stub();
  AgentStub.update.withArgs(single, uuidArgs).returns(Promise.resolve(single));

  // Model findById Stub
  AgentStub.findById = sandbox.stub();
  AgentStub.findById.withArgs(id).returns(Promise.resolve(agentFixtures.byId(id)));

  // Model findOne Stub
  AgentStub.findOne = sandbox.stub();
  AgentStub.findOne.withArgs(uuidArgs).returns(Promise.resolve(agentFixtures.byUuid(uuid)));

  // Model findAll Stub
  AgentStub.findAll = sandbox.stub();
  AgentStub.findAll.withArgs().returns(Promise.resolve(agentFixtures.all));
  AgentStub.findAll.withArgs(connectedArgs).returns(Promise.resolve(agentFixtures.connected));
  AgentStub.findAll.withArgs(usernameArgs).returns(Promise.resolve(agentFixtures.platzi));

  // Pedimos el remplazo de los modelos reales.
  const setupDatabase = proxyquire('../index', {
    './models/agent': () => AgentStub,
    './models/metric': () => MetricStub,
  });
  db = await setupDatabase(config);
});

// Lo que hara despues de cada prueba.
test.afterEach(() => {
  sandbox && sinon.restore();
});

// Prueba para saber si el agente Existe.
test('Agent', (t) => {
  t.truthy(db.Agent, 'Agent service should exits');
});

// Testing de SetUp para las distintas llamas a metric.
test.serial('Setup', (t) => {
  t.true(AgentStub.hasMany.called, 'AgentModel.hasMany was executed');
  t.true(AgentStub.hasMany.calledWith(MetricStub), 'Argument should be the MetricModel');
  t.true(MetricStub.belongsTo.called, 'MetricModel.belongsTo was executed');
  t.true(MetricStub.belongsTo.calledWith(AgentStub), 'Argumet should be the Agentmodel');
});

// Testing para las llamadas de un agente.
test.serial('Agent#findById', async (t) => {
  let agent = await db.Agent.findById(id);

  t.true(AgentStub.findById.called, 'findById called on model');
  t.true(AgentStub.findById.calledOnce, 'findById should be called once');
  t.true(AgentStub.findById.calledWith(id), 'findById should be called with speficfi ID');

  t.deepEqual(agent, agentFixtures.byId(id), 'Should be the same');
});

// Testing para saber la creacion o la modificacion y llamadas de un agente.
test.serial('Agent#createOrUpdate - exists', async (t) => {
  let agent = await db.Agent.createOrUpdate(single);

  t.true(AgentStub.findOne.called, 'findOne should be called on model');
  t.true(AgentStub.findOne.calledTwice, 'findOne should be called twice');
  t.true(AgentStub.findOne.calledWith(uuidArgs), 'findOne should be called with uuid args');
  t.true(AgentStub.update.called, 'agent.update called on model');
  t.true(AgentStub.update.calledOnce, 'agent.update should be called once');
  t.true(AgentStub.update.calledWith(single), 'agent.update should be called with specified args');

  t.deepEqual(agent, single, 'agent should be the same');
});

test.serial('Agent#findConnected', async (t) => {
  let agents = await db.Agent.findConnected();
  t.true(AgentStub.findAll.called, 'FindAll should be called on model');
  t.true(AgentStub.findAll.calledOnce, 'FindAll should be called once');
  t.true(AgentStub.findAll.calledWith(connectedArgs), 'FindAll should be called with connected args');
});

test.serial('Agent#findByUsername', async (t) => {
  let agents = await db.Agent.findByUsername('platzi');

  t.true(AgentStub.findAll.called, 'findAll should be called on model');
  t.true(AgentStub.findAll.calledOnce, 'findAll should be called once');
  // t.true(AgentStub.findAll.calledWith(usernameArgs), 'FindAll should be called with username args');
  // t.is(agents.length, agentFixtures.platzi.length, 'agents should be the same amount');
  // t.deepEqual(agents, agentFixtures.platzi, 'agents should be the same');
});

test.serial('Agent#findAll', async (t) => {
  let agents = await db.Agent.findAll();

  t.true(AgentStub.findAll.called, 'findAll should be called on model');
  t.true(AgentStub.findAll.calledOnce, 'findAll should be called once');
  t.true(AgentStub.findAll.calledWith(), 'findAll should be called without args');

  t.is(agents.length, agentFixtures.all.length, 'agents should be the same amount');
  t.deepEqual(agents, agentFixtures.all, 'agents should be the same');
});

test.serial('Agent#createOrUpdate - new', async (t) => {
  let agent = await db.Agent.createOrUpdate(newAgent);

  t.true(AgentStub.findOne.called, 'findOne should be called on model');
  t.true(AgentStub.findOne.calledOnce, 'findOne should be called once');
  t.true(
    AgentStub.findOne.calledWith({
      where: { uuid: newAgent.uuid },
    }),
    'findOne should be called with uuid args'
  );
  t.true(AgentStub.create.called, 'create should be called on model');
  t.true(AgentStub.create.calledOnce, 'create should be called once');
  t.true(AgentStub.create.calledWith(newAgent), 'create should be called with specified args');

  t.deepEqual(agent, newAgent, 'agent should be the same');
});
