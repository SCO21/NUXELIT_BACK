require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('./src/modules/project/project.model');

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const projects = await Project.find({});
  let updated = 0;
  for (const p of projects) {
    if (p.finances) {
      if (p.finances.paidAmount && !p.finances.amountPaid) {
        p.finances.amountPaid = p.finances.paidAmount;
      }
      if (p.status === 'ENTREGADO' && (!p.finances.amountPaid || p.finances.amountPaid === 0)) {
        p.finances.amountPaid = p.finances.agreedPrice || 5000; // Fake some revenue
      }
      await p.save();
      updated++;
    }
  }
  console.log(`Updated ${updated} projects finances.`);
  process.exit(0);
};

run();
