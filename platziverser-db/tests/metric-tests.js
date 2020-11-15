const test = require('ava');
const proxyquire = require('proxyquire');
const sinon = require('sinon');
const metricFixtures = require('../tests/fixtures/metric');
const agentFixtures = require('../tests/fixtures/agent');

// Configuracion para envio de proceso.
let config = {
  logging: () => {},
};

// Datos para crear una nueva metrica.
const newMetric = {
  agentId: 2,
  type: 'cpu',
  value: '50%',
};

let db, AgentStub, sandbox, MetricStub, byTypeAndUuidArgs, byUuidArgs;
const type = 'cpu';
const uuid = 'yyy-yyy-yyy';

// Datos para buscar.
const findOneArgs = {
  where: { uuid },
};

// extend para crear un nuevo objeto.
function extend(obj, values) {
  const clone = Object.assign({}, obj);
  return Object.assign(clone, values);
}

test.before(async () => {
  // Creamos un SandBox
  sandbox = sinon.createSandbox();

  // Creamos el mockup de Metric.
  MetricStub = {
    belongsTo: sandbox.spy(),
    findAll: null,
    create: null,
  };

  // Llenamos el campo de create
  MetricStub.create = sandbox.stub();

  // Llenamos el campo de findAll
  MetricStub.findAll = sandbox.stub();

  // Creamos el mockup de agent.
  AgentStub = {
    hasMany: sandbox.spy(),
    findOne: null,
  };

  // Llenamos el campo de findone
  AgentStub.findOne = sandbox.stub();

  // Creamos el objeto base para las extenderlos en las busquedas.
  const baseArgs = {
    include: [
      {
        attributes: [],
        model: AgentStub,
        where: {
          uuid,
        },
      },
    ],
    raw: true,
  };

  // Creamos el objeto con los datos necesario para la comparacion.
  byTypeAndUuidArgs = extend(baseArgs, {
    attributes: ['id', 'type', 'value', 'createdAt'],
    where: {
      type,
    },
    limit: 20,
    order: [['createdAt', 'DESC']],
  });

  // Creamos el objeto con los datos necesario para la comparacion.
  byUuidArgs = extend(baseArgs, {
    attributes: ['type'],
    group: ['type'],
  });

  MetricStub.findAll.withArgs(byTypeAndUuidArgs).returns(Promise.resolve(metricFixtures.findByTypeAgentUuid(type, uuid)));
  MetricStub.findAll.withArgs(byUuidArgs).returns(Promise.resolve(metricFixtures.findByAgentUuid(uuid)));

  AgentStub.findOne.withArgs(findOneArgs).returns(Promise.resolve(agentFixtures.byUuid(uuid)));
  MetricStub.create.withArgs(newMetric).returns(
    Promise.resolve({
      toJSON() {
        return newMetric;
      },
    })
  );

  const setupDatabase = proxyquire('../index.js', {
    './models/metric.js': () => MetricStub,
    './models/agent.js': () => AgentStub,
  });
  db = await setupDatabase(config);
});

test.afterEach(() => {
  console.log(db);
  sandbox && sandbox.restore();
});

test.serial('Metric', (t) => {
  t.truthy(db.Metric, 'Metric should exits');
});

test.serial('Metric#findByTypeAgentUuid', async (t) => {
  const metrics = await db.Metric.findByTypeAgentUuid(type, uuid);

  t.true(MetricStub.findAll.called, 'FindAll should be called on MetricModel ');
  t.true(MetricStub.findAll.calledOnce, 'FindAll should be called once');
  t.true(MetricStub.findAll.calledWith(byTypeAndUuidArgs), 'FindAll should be called with const byTypeAndUuidArgs');

  const metricCompare = metricFixtures.findByTypeAgentUuid(type, uuid);
  t.is(metrics.length, metricCompare.length, 'Metrics lenght be same metricsCompare.lenght');
  t.deepEqual(metrics, metricCompare, 'Metrics should be same metricsCompare');
});

test.serial('Metric#findByAgentUuid', async (t) => {
  const metrics = await db.Metric.findByAgentUuid(uuid);

  const metricsCompare = metricFixtures.findByAgentUuid(uuid);

  t.is(metrics.length, metricsCompare.length, 'Metrics length should some metricsCompare.length');
  t.deepEqual(metrics, metricsCompare, 'Metrics should be same metricsCompare');
});

test.serial('Metrics#create', async (t) => {
  const metrics = await db.Metric.create(uuid, newMetric);

  t.true(AgentStub.findOne.called, 'FindOne should be called on AgentModel');
  t.true(AgentStub.findOne.calledOnce, 'FindOne should be called once');
  t.true(AgentStub.findOne.calledWith(findOneArgs), 'FindOne should called with findOneArgs');

  t.true(MetricStub.create.called, 'create should be called on MetricModel');
  t.true(MetricStub.create.calledOnce, 'create should be called once');
  t.true(MetricStub.create.calledWith(newMetric), 'create should be called with newMetric argument');

  t.deepEqual(metrics, newMetric, 'metric should be same newMetric');
});
