const AnalyticsEvent = require('./analytics.model');
const Quote = require('../quote/quote.model');
const Contact = require('../contact/contact.model');
const ChatbotConversation = require('../chatbot/chatbot.model');
const Newsletter = require('../newsletter/newsletter.model');

const registerEvent = async (eventData, ip, userAgent) => {
  const data = {
    ...eventData,
    ip,
    userAgent
  };
  await AnalyticsEvent.create(data);
};

const getDashboardSummary = async (query) => {
  // query could contain startDate, endDate, groupBy
  
  const totalPageViews = await AnalyticsEvent.countDocuments({ event: 'page_view' });
  const totalQuotes = await Quote.countDocuments();
  const totalContacts = await Contact.countDocuments();
  const chatbotSessions = await ChatbotConversation.countDocuments();
  const newsletterSubscribers = await Newsletter.countDocuments({ isActive: true });

  const topPagesData = await AnalyticsEvent.aggregate([
    { $match: { event: 'page_view' } },
    { $group: { _id: '$page', views: { $sum: 1 } } },
    { $sort: { views: -1 } },
    { $limit: 10 }
  ]);

  const topPages = topPagesData.map(p => ({ page: p._id || 'home', views: p.views }));

  return {
    summary: {
      totalPageViews,
      totalQuotes,
      totalContacts,
      chatbotSessions,
      newsletterSubscribers
    },
    pageViews: [], // Simplified for this stub
    topEvents: [],
    topPages
  };
};

module.exports = {
  registerEvent,
  getDashboardSummary
};
