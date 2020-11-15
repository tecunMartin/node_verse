const db = require('../index');

async function run() {
  const config = {
    database: process.env.DB_NAME || 'platziverse',
    username: process.env.DB_USER || 'platzi',
    password: process.env.DB_PASS || 'platzi',
    host: process.env.DB_HOST || 'localhost',
    dialect: 'postgres',
  };

  const { Agent, Metric } = await db(config).catch(handleFatalError);

  const agent = await Agent.createOrUpdate({
    id: 2,
    uuid: 'EEE',
    name: 'Martin',
    username: 'tecunMartin',
    hostname: 'platzi',
    pid: 2,
    connected: true,
  }).catch(handleFatalError);

  console.log('--agent--');
  console.log(agent);

  const agents = await Agent.findAll().catch(handleFatalError);
  console.log('--Agents--');
  console.log(agents);

  const metric = await Metric.create(agent.uuid, {
    type: 'CPU',
    value: 500,
  }).catch(handleFatalError);
  console.log('--metric--');
  console.log(metric);

  const metrics = await Metric.findByAgentUuid(agent.uuid).catch(handleFatalError);
  console.log('--Metrics--');
  console.log(metrics);
}

function handleFatalError(err) {
  console.error(err.message);
  console.error(err.stack);
  process.exit(1);
}
run();
