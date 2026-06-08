require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('./src/modules/project/project.model');

const MONGO_URI = process.env.MONGODB_URI;

if (!MONGO_URI) {
  console.error("MONGODB_URI missing in .env");
  process.exit(1);
}

const firstNames = ["Alejandro", "Sofia", "Diego", "Valentina", "Mateo", "Camila", "Leonardo", "Isabella", "Daniel", "Mariana", "Hugo", "Lucia", "Martin", "Valeria", "Joaquin", "Victoria", "Lucas", "Martina", "Emilio", "Julieta"];
const lastNames = ["Garcia", "Martinez", "Rodriguez", "Lopez", "Perez", "Gonzalez", "Gomez", "Fernandez", "Ruiz", "Diaz", "Alvarez", "Romero", "Torres", "Suarez", "Ortiz", "Vargas", "Castro", "Mendez", "Rios", "Silva"];
const companies = ["TechCorp", "InnovaSolutions", "Global Media", "Digital Studio", "EcoShop", "DevCraft", "NextGen", "SmartApps", "Webify", "CloudSystems"];
const serviceTypes = ['E-commerce', 'App Movil', 'Software', 'Landing Page', 'Otro'];

const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

const generateRandomProject = () => {
  const name = `${getRandomItem(firstNames)} ${getRandomItem(lastNames)}`;
  const serviceType = getRandomItem(serviceTypes);
  const company = getRandomItem(companies);
  
  // Date logic
  const startYear = 2025;
  const startMonth = getRandomInt(0, 11);
  const startDay = getRandomInt(1, 28);
  const startDate = new Date(startYear, startMonth, startDay);
  
  const expectedDaysToBuild = getRandomInt(15, 60);
  const expectedDeliveryDate = new Date(startDate);
  expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + expectedDaysToBuild);
  
  // 30% chance it was delivered late
  let isLate = Math.random() < 0.3;
  const actualDeliveryDate = new Date(expectedDeliveryDate);
  if (isLate) {
    actualDeliveryDate.setDate(actualDeliveryDate.getDate() + getRandomInt(2, 10)); // late by 2-10 days
  } else {
    actualDeliveryDate.setDate(actualDeliveryDate.getDate() - getRandomInt(0, 5)); // on time or early
  }

  const agreedPrice = getRandomInt(10, 100) * 100;
  
  return {
    client: {
      name: name,
      email: `${name.toLowerCase().replace(' ', '.')}@example.com`,
      phone: `+57300${getRandomInt(100000, 999999)}`,
      company: company
    },
    serviceType: serviceType,
    status: 'ENTREGADO',
    description: `Proyecto de ${serviceType} completado para ${company}.`,
    startDate: startDate,
    expectedDeliveryDate: expectedDeliveryDate,
    actualDeliveryDate: actualDeliveryDate,
    finances: {
      agreedPrice: agreedPrice,
      paidAmount: agreedPrice, // Fully paid if delivered
      pendingAmount: 0
    },
    rating: getRandomInt(4, 5) // Happy clients
  };
};

const run = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB...");
    
    const projectsToInsert = Array.from({ length: 30 }, generateRandomProject);
    
    await Project.insertMany(projectsToInsert);
    console.log(`Successfully inserted 30 projects with status ENTREGADO.`);
    
    process.exit(0);
  } catch (error) {
    console.error("Error seeding projects:", error);
    process.exit(1);
  }
};

run();
