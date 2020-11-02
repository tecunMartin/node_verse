module.exports = function setupAgent(AgentModel) {
  function findById(id) {
    return AgentModel.findById(id);
  }

  async function createOrUpdate(agent) {
    const cond = {
      where: {
        uuid: agent.uuid,
      },
    };

    const existingAgent = await AgentModel.findOne(cond);
    console.log(existingAgent);

    if (existingAgent) {
      const updated = await AgentModel.update(agent, cond);
      console.log(updated);
      return updated ? AgentModel.findOne(cond) : existingAgent;
    }

    const result = await AgentModel.create(agent);
    return result.toJSON();
  }

  return {
    findById,
    createOrUpdate,
  };
};
