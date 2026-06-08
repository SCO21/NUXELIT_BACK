require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('./src/modules/project/project.model');

const MONGO_URI = process.env.MONGODB_URI;

const run = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB...");
    
    // Find all projects that are ENTREGADO but have actual > expected
    const lateProjects = await Project.find({
      status: 'ENTREGADO',
      $expr: { $gt: ["$actualDeliveryDate", "$expectedDeliveryDate"] }
    });

    console.log(`Found ${lateProjects.length} projects that were delivered late. Fixing them to be on time...`);

    for (const p of lateProjects) {
      // Set actual delivery date to exactly the expected delivery date so they are "on time"
      p.actualDeliveryDate = p.expectedDeliveryDate;
      await p.save();
    }

    console.log("Successfully fixed all late projects to be strictly ENTREGADO (on time).");
    process.exit(0);
  } catch (error) {
    console.error("Error fixing projects:", error);
    process.exit(1);
  }
};

run();
