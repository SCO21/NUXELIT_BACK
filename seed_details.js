require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('./src/config/database');
const Project = require('./src/modules/project/project.model');

const architectures = [
  'Monolítica MVC',
  'Microservicios con Docker',
  'Arquitectura Serverless (AWS Lambda)',
  'Arquitectura Orientada a Eventos',
  'Monorepo con Turborepo',
  'Arquitectura Hexagonal'
];

const techStacks = [
  'React, Node.js, Express, MongoDB',
  'Vue.js, Laravel, MySQL',
  'Next.js, Tailwind CSS, PostgreSQL, Prisma',
  'Angular, Spring Boot, Oracle',
  'React Native, Firebase',
  'Svelte, Go, Redis',
  'Astro, Tailwind, Supabase'
];

const hosting = [
  'Vercel (Frontend), Heroku (Backend)',
  'AWS EC2, AWS RDS',
  'Google Cloud Run',
  'DigitalOcean Droplet',
  'Hostinger VPS',
  'Render y MongoDB Atlas',
  'Netlify y Supabase'
];

const notesList = [
  'Proyecto fluido, el cliente quedó muy satisfecho con el rendimiento.',
  'Hubo ligeros cambios en los requerimientos a mitad del proceso, pero se logró estabilizar.',
  'Considerar ofrecerle un plan de mantenimiento mensual a este cliente.',
  'Se migró desde un sistema legado. El rendimiento mejoró significativamente.',
  'Utilizamos una nueva tecnología de cache en este proyecto, documentar resultados.',
  'Gran proyecto. El equipo de diseño entregó Figma a tiempo.'
];

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function populateDetails() {
  try {
    await connectDB();
    console.log('Conectado a la base de datos...');
    
    const projects = await Project.find({});
    let updatedCount = 0;

    for (const p of projects) {
      let newDetails = p.details || {
        technologies: 'No definidas',
        architecture: 'No definida',
        serviceUrls: 'Sin URLs asignadas',
        deployedAt: 'No desplegado',
        notes: 'Sin notas'
      };

      if (p.status === 'EN_DESARROLLO') {
        newDetails.architecture = getRandom(architectures);
      } else if (p.status === 'EN_DISENO' || p.status === 'PENDIENTE') {
        // Dejar por defecto
      } else {
        // TESTING, ENTREGADO, CANCELADO, EN_PAUSA etc
        newDetails.technologies = getRandom(techStacks);
        newDetails.architecture = getRandom(architectures);
        const sanitizeName = (name) => name ? name.toLowerCase().replace(/\s+/g, '') : 'demo';
        newDetails.serviceUrls = `Frontend: https://${sanitizeName(p.client.company || p.client.name)}.nuxelit.com\nBackend: https://api.${sanitizeName(p.client.company || p.client.name)}.nuxelit.com`;
        newDetails.deployedAt = getRandom(hosting);
        newDetails.notes = getRandom(notesList);
      }

      p.details = newDetails;
      await p.save();
      updatedCount++;
    }

    console.log(`Se han actualizado con éxito los detalles de ${updatedCount} proyectos.`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

populateDetails();
