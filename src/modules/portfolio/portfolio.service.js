const Portfolio = require('./portfolio.model');
const { uploadImage, deleteImage } = require('../../utils/storageService');
const { getPaginationData } = require('../../utils/pagination');

const getPortfolios = async (query, pagination) => {
  const { page, limit, skip } = pagination;
  const filter = {};
  
  if (query.active !== 'false') filter.isActive = true;
  if (query.category) filter.category = query.category;
  if (query.featured === 'true') filter.featured = true;

  const projects = await Portfolio.find(filter)
    .sort({ order: 1, createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Portfolio.countDocuments(filter);
  const categories = await Portfolio.distinct('category', { isActive: true });

  return {
    projects,
    pagination: getPaginationData(total, page, limit),
    categories
  };
};

const createPortfolio = async (portfolioData, file) => {
  let imageUrl = null;
  if (file) {
    imageUrl = await uploadImage(file.buffer, 'portfolio');
  }

  const data = { ...portfolioData };
  if (imageUrl) data.image = imageUrl;

  return await Portfolio.create(data);
};

const updatePortfolio = async (id, portfolioData, file) => {
  const portfolio = await Portfolio.findById(id);
  if (!portfolio) {
    throw new Error('Proyecto no encontrado');
  }

  let imageUrl = portfolio.image;
  if (file) {
    if (imageUrl) {
      await deleteImage(imageUrl);
    }
    imageUrl = await uploadImage(file.buffer, 'portfolio');
  }

  const data = { ...portfolioData };
  if (file) data.image = imageUrl;

  Object.assign(portfolio, data);
  await portfolio.save();
  return portfolio;
};

const deletePortfolio = async (id) => {
  const portfolio = await Portfolio.findById(id);
  if (!portfolio) {
    throw new Error('Proyecto no encontrado');
  }

  if (portfolio.image) {
    await deleteImage(portfolio.image);
  }

  await Portfolio.findByIdAndDelete(id);
  return;
};

module.exports = {
  getPortfolios,
  createPortfolio,
  updatePortfolio,
  deletePortfolio
};
