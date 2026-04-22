const Plan = require('./plan.model');

const getPlans = async (query) => {
  const filter = {};
  if (query.active !== 'false') {
    filter.isActive = true;
  }
  return await Plan.find(filter).sort({ order: 1 });
};

const createPlan = async (planData) => {
  return await Plan.create(planData);
};

const updatePlan = async (id, planData) => {
  const plan = await Plan.findByIdAndUpdate(id, planData, { new: true, runValidators: true });
  if (!plan) {
    throw new Error('Plan no encontrado');
  }
  return plan;
};

const deletePlan = async (id) => {
  const plan = await Plan.findByIdAndDelete(id);
  if (!plan) {
    throw new Error('Plan no encontrado');
  }
  return;
};

module.exports = {
  getPlans,
  createPlan,
  updatePlan,
  deletePlan
};
