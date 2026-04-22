const Newsletter = require('./newsletter.model');
const { getPaginationData } = require('../../utils/pagination');

const subscribe = async (email) => {
  const existing = await Newsletter.findOne({ email });
  if (existing) {
    if (existing.isActive) {
      throw new Error('Este email ya está suscrito');
    } else {
      existing.isActive = true;
      existing.unsubscribedAt = undefined;
      await existing.save();
      return;
    }
  }

  await Newsletter.create({ email });
};

const unsubscribe = async (email) => {
  const existing = await Newsletter.findOne({ email });
  if (existing && existing.isActive) {
    existing.isActive = false;
    existing.unsubscribedAt = new Date();
    await existing.save();
  }
};

const getSubscribers = async (query, pagination) => {
  const { page, limit, skip } = pagination;
  const filter = {};
  
  if (query.active !== undefined) {
    filter.isActive = query.active === 'true';
  }

  const subscribers = await Newsletter.find(filter).sort({ subscribedAt: -1 }).skip(skip).limit(limit);
  const total = await Newsletter.countDocuments(filter);
  const totalActive = await Newsletter.countDocuments({ isActive: true });

  return {
    subscribers,
    pagination: getPaginationData(total, page, limit),
    totalActive
  };
};

module.exports = {
  subscribe,
  unsubscribe,
  getSubscribers
};
