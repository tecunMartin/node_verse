'use strict';

const defaults = require('defaults');
const setupDatabase = require('./lib/db');
const setupMetricModel = require('./models/metric');
const setupAgentModel = require('./models/agent');
const setupAngent = require('./lib/agent');

module.exports = async function (config) {
  config = defaults(config, {
    dialect: 'sqlite',
    pool: {
      max: 10,
      min: 0,
      idle: 1000,
    },
    query: {
      raw: true,
    },
  });

  const sequelize = setupDatabase(config);
  const AgentModel = setupAgentModel(config);
  const MetricModel = setupMetricModel(config);

  AgentModel.hasMany(MetricModel);
  MetricModel.belongsTo(AgentModel);

  await sequelize.authenticate();

  if (config.setup) {
    await sequelize.sync({ force: true });
  }

  const Agent = setupAngent(AgentModel);
  const Metric = {};

  return {
    Agent,
    Metric,
  };
};
