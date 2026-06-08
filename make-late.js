require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('./src/modules/project/project.model');

const MONGO_URI = process.env.MONGODB_URI;

const run = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    
    // Get 3 random projects that are currently on time
    const projects = await Project.aggregate([
      { $match: { status: 'ENTREGADO' } },
      { $sample: { size: 3 } }
    ]);
    
    for (const p of projects) {
      const doc = await Project.findById(p._id);
      // Make actual delivery date 5 days late
      const newActual = new Date(doc.expectedDeliveryDate);
      newActual.setDate(newActual.getDate() + 5);
      doc.actualDeliveryDate = newActual;
      await doc.save();
      console.log(`Made project ${doc._id} late.`);
    }

    console.log("Successfully set 3 projects to ENTREGADO_TARDE.");
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

run();
