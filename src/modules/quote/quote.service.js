const Quote = require('./quote.model');
const { getPaginationData } = require('../../utils/pagination');

const generateQuoteNumber = async () => {
  const year = new Date().getFullYear();
  // Find latest quote of the current year
  const latestQuote = await Quote.findOne({ quoteNumber: { $regex: `^QT-${year}-` } }).sort({ createdAt: -1 });

  let sequence = 1;
  if (latestQuote) {
    const lastParts = latestQuote.quoteNumber.split('-');
    sequence = parseInt(lastParts[2], 10) + 1;
  }

  const paddedSequence = sequence.toString().padStart(4, '0');
  return `QT-${year}-${paddedSequence}`;
};

const createQuote = async (quoteData) => {
  const dataToSave = {
    serviceType: quoteData.serviceType,
    projectDescription: quoteData.projectDescription,
    budget: quoteData.budget,
    timeline: quoteData.timeline,
    client: {
      name: quoteData.name,
      email: quoteData.email,
      phone: quoteData.phone,
      company: quoteData.company
    }
  };

  dataToSave.quoteNumber = await generateQuoteNumber();

  const quote = await Quote.create(dataToSave);
  return {
    quoteNumber: quote.quoteNumber,
    message: 'Tu solicitud de cotización ha sido recibida. Te enviaremos una propuesta en menos de 24 horas.'
  };
};

const getQuotes = async (query, pagination) => {
  const { page, limit, skip } = pagination;
  const filter = {};
  
  if (query.status) filter.status = query.status;
  if (query.serviceType) filter.serviceType = query.serviceType;

  const sort = {};
  if (query.sortBy) {
    sort[query.sortBy] = query.order === 'asc' ? 1 : -1;
  } else {
    sort.createdAt = -1;
  }

  const quotes = await Quote.find(filter).sort(sort).skip(skip).limit(limit);
  const total = await Quote.countDocuments(filter);

  return {
    quotes,
    pagination: getPaginationData(total, page, limit)
  };
};

const getQuoteById = async (id) => {
  const quote = await Quote.findById(id);
  if (!quote) {
    throw new Error('Cotización no encontrada');
  }
  return quote;
};

const updateQuote = async (id, updateData) => {
  const quote = await Quote.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
  if (!quote) {
    throw new Error('Cotización no encontrada');
  }
  return quote;
};

const deleteQuote = async (id) => {
  const quote = await Quote.findByIdAndDelete(id);
  if (!quote) {
    throw new Error('Cotización no encontrada');
  }
  return;
};

module.exports = {
  createQuote,
  getQuotes,
  getQuoteById,
  updateQuote,
  deleteQuote
};
