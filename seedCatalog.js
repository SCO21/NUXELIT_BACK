require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const EstimationCatalog = require('./src/modules/estimation/catalog.model');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nuxelit';

// Base specification dataset provided by the user (YAML format converted to JS Object)
const baseSeederData = {
  config: {
    general: {
      hoursPerDayDefault: 8,
      currencyDefault: 'COP',
      riskGlobalDefault: 0.10,
      allowArchitectureImages: true,
      allowCostEstimation: true,
      allowObservations: true,
      allowVersioning: true,
      allowPdfDownload: true,
      allowExcelUpload: true,
      allowManualCreation: true,
      allowConfigActivities: true,
      allowConfigPlans: true,
      allowConfigPackages: true,
      allowConfigRates: true
    },
    states: [
      { code: 'PENDIENTE', name: 'Pendiente', description: 'Estimación creada o cargada, pendiente de revisión.', order: 1, active: true },
      { code: 'APROBADO', name: 'Aprobado', description: 'Estimación validada y aceptada.', order: 2, active: true },
      { code: 'RECHAZADO', name: 'Rechazado', description: 'Estimación revisada y no aceptada.', order: 3, active: true },
      { code: 'MODIFICADO', name: 'Modificado', description: 'Estimación ajustada después de una versión previa.', order: 4, active: true },
      { code: 'ARCHIVADO', name: 'Archivado', description: 'Estimación cerrada para consulta histórica.', order: 5, active: true }
    ],
    priorities: [
      { code: 'BAJA', name: 'Baja', factor: 1.00 },
      { code: 'MEDIA', name: 'Media', factor: 1.00 },
      { code: 'ALTA', name: 'Alta', factor: 1.10 },
      { code: 'URGENTE', name: 'Urgente', factor: 1.25 }
    ],
    environments: [
      { code: 'LOCAL', name: 'Local' },
      { code: 'DEV', name: 'Dev' },
      { code: 'QA', name: 'QA' },
      { code: 'STAGE', name: 'Stage' },
      { code: 'PROD', name: 'Producción' }
    ],
    currencies: [
      { code: 'COP', name: 'Peso colombiano', symbol: '$', active: true },
      { code: 'USD', name: 'Dólar estadounidense', symbol: 'USD', active: true },
      { code: 'EUR', name: 'Euro', symbol: 'EUR', active: true }
    ],
    developmentTypes: [
      { code: 'LANDING_PAGE', name: 'Landing page' },
      { code: 'WEB_CORPORATIVA', name: 'Web corporativa' },
      { code: 'ECOMMERCE', name: 'E-commerce' },
      { code: 'PORTAL', name: 'Portal' },
      { code: 'APLICACION_WEB', name: 'Aplicación web' },
      { code: 'CUSTOM', name: 'Desarrollo a la medida' }
    ],
    complexities: [
      { code: 'BAJA', name: 'Baja', factor: 0.85, description: 'Actividad sencilla, con bajo nivel de incertidumbre.' },
      { code: 'MEDIA', name: 'Media', factor: 1.00, description: 'Actividad estándar, con alcance claro.' },
      { code: 'ALTA', name: 'Alta', factor: 1.30, description: 'Actividad con integración, lógica o mayor validación.' },
      { code: 'MUY_ALTA', name: 'Muy alta', factor: 1.60, description: 'Actividad con alta dependencia técnica o incertidumbre.' }
    ],
    roles: [
      { code: 'PM', role: 'PM', rate: 120000, description: 'Gestión del proyecto, seguimiento, coordinación y control de alcance.', active: true },
      { code: 'ANALISTA', role: 'Analista', rate: 90000, description: 'Levantamiento, análisis funcional, validación de alcance y documentación.', active: true },
      { code: 'UX_UI', role: 'Diseñador UX/UI', rate: 90000, description: 'Diseño de interfaces, flujos, wireframes y lineamientos visuales.', active: true },
      { code: 'DEV_FRONT', role: 'Desarrollador Front', rate: 95000, description: 'Desarrollo frontend, maquetación, componentes, vistas e interacción.', active: true },
      { code: 'DEV_BACK', role: 'Desarrollador Back', rate: 105000, description: 'Desarrollo backend, servicios, integraciones, lógica y persistencia.', active: true },
      { code: 'FULL_STACK', role: 'Full Stack', rate: 115000, description: 'Desarrollo integral frontend y backend.', active: true },
      { code: 'QA_TESTER', role: 'QA/Tester', rate: 75000, description: 'Pruebas funcionales, validación de criterios y reporte de hallazgos.', active: true },
      { code: 'DEVOPS', role: 'DevOps', rate: 130000, description: 'Despliegues, configuración de ambientes, dominios, SSL y pipelines.', active: true },
      { code: 'ARQUITECTO', role: 'Arquitecto', rate: 150000, description: 'Diseño técnico, revisión de arquitectura, decisiones técnicas y lineamientos.', active: true },
      { code: 'SOPORTE', role: 'Soporte', rate: 70000, description: 'Ajustes menores, monitoreo básico, soporte y estabilización.', active: true }
    ],
    phases: [
      { code: 'ENTENDIMIENTO', name: 'Entendimiento', order: 1 },
      { code: 'ANALISIS', name: 'Análisis', order: 2 },
      { code: 'DISENO_UX_UI', name: 'Diseño UX/UI', order: 3 },
      { code: 'FRONT', name: 'Front', order: 4 },
      { code: 'BACK', name: 'Back', order: 5 },
      { code: 'INTEGRACION', name: 'Integración', order: 6 },
      { code: 'QA', name: 'QA', order: 7 },
      { code: 'DEVOPS', name: 'DevOps', order: 8 },
      { code: 'DOCUMENTACION', name: 'Documentación', order: 9 },
      { code: 'SOPORTE', name: 'Soporte', order: 10 },
      { code: 'ARQUITECTURA', name: 'Arquitectura', order: 11 }
    ],
    pdfSections: [
      { code: 'PORTADA', name: 'Portada', required: true, order: 1 },
      { code: 'RESUMEN_EJECUTIVO', name: 'Resumen ejecutivo', required: true, order: 2 },
      { code: 'ALCANCE', name: 'Alcance', required: true, order: 3 },
      { code: 'DETALLE_ACTIVIDADES', name: 'Detalle de actividades', required: true, order: 4 },
      { code: 'COSTOS', name: 'Estimación de costos', required: false, order: 5 },
      { code: 'ARQUITECTURA_PROPUESTA', name: 'Arquitectura propuesta', required: false, order: 6 },
      { code: 'SUPUESTOS', name: 'Supuestos y restricciones', required: true, order: 7 },
      { code: 'APROBACION', name: 'Aprobación', required: true, order: 8 }
    ],
    permissions: [
      { code: 'ESTIMACIONES_VER', name: 'Ver estimaciones' },
      { code: 'ESTIMACIONES_CREAR', name: 'Crear estimaciones' },
      { code: 'ESTIMACIONES_EDITAR', name: 'Editar estimaciones' },
      { code: 'ESTIMACIONES_CARGAR_EXCEL', name: 'Cargar estimaciones desde Excel' },
      { code: 'ESTIMACIONES_DESCARGAR_PDF', name: 'Descargar PDF de estimación' },
      { code: 'ESTIMACIONES_CAMBIAR_ESTADO', name: 'Cambiar estado de estimación' },
      { code: 'PARAMETROS_ACTIVIDADES_GESTIONAR', name: 'Gestionar catálogo de actividades' },
      { code: 'PARAMETROS_PLANES_GESTIONAR', name: 'Gestionar planes' },
      { code: 'PARAMETROS_PAQUETES_GESTIONAR', name: 'Gestionar paquetes' },
      { code: 'PARAMETROS_TARIFAS_GESTIONAR', name: 'Gestionar tarifas' }
    ]
  },
  activities: [
    { code: 'ACT-001', name: 'Reunión de entendimiento', phase: 'Entendimiento', type: 'Gestión', role: 'PM', complexity: 'Media', baseHours: 1.50, riskPercent: 0.10, dependency: 'Agenda y responsables definidos', description: 'Sesión inicial para levantar necesidad, contexto, restricciones y actores del proyecto.', active: true },
    { code: 'ACT-002', name: 'Análisis técnico del requerimiento', phase: 'Análisis', type: 'Gestión', role: 'Analista', complexity: 'Media', baseHours: 2.00, riskPercent: 0.10, dependency: 'Necesidad clara y aprobada', description: 'Revisión funcional y técnica para definir alcance, dependencias, riesgos y estrategia de implementación.', active: true },
    { code: 'ACT-003', name: 'Diseño UX/UI base', phase: 'Diseño UX/UI', type: 'UX/UI', role: 'Diseñador UX/UI', complexity: 'Media', baseHours: 4.00, riskPercent: 0.10, dependency: 'Contenido y referencia visual disponible', description: 'Diseño base de interfaz, flujo principal y lineamientos visuales para una pantalla o sección.', active: true },
    { code: 'ACT-004', name: 'Crear página web landing', phase: 'Front', type: 'Front', role: 'Desarrollador Front', complexity: 'Media', baseHours: 10.00, riskPercent: 0.10, dependency: 'Diseño aprobado', description: 'Maquetación responsive de landing con hero, beneficios, bloques informativos y llamado a la acción.', active: true },
    { code: 'ACT-005', name: 'Crear página interna', phase: 'Front', type: 'Front', role: 'Desarrollador Front', complexity: 'Media', baseHours: 6.00, riskPercent: 0.10, dependency: 'Diseño o wireframe disponible', description: 'Maquetación responsive de página interna con estructura de contenido reusable.', active: true },
    { code: 'ACT-006', name: 'Formulario de contacto', phase: 'Front', type: 'Front', role: 'Desarrollador Front', complexity: 'Media', baseHours: 5.00, riskPercent: 0.05, dependency: 'Campos y destino definidos', description: 'Formulario responsive con campos, validaciones básicas y mensaje de confirmación.', active: true },
    { code: 'ACT-007', name: 'Botón WhatsApp', phase: 'Front', type: 'Front', role: 'Desarrollador Front', complexity: 'Baja', baseHours: 1.50, riskPercent: 0.00, dependency: 'Número y mensaje inicial', description: 'Botón flotante o fijo de WhatsApp con enlace configurado y comportamiento mobile.', active: true },
    { code: 'ACT-008', name: 'Optimización SEO inicial', phase: 'Front', type: 'Front', role: 'Desarrollador Front', complexity: 'Media', baseHours: 3.00, riskPercent: 0.05, dependency: 'Keywords y contenido base', description: 'Metadatos, títulos, descripciones, encabezados y buenas prácticas SEO on-page.', active: true },
    { code: 'ACT-009', name: 'Configuración analítica básica', phase: 'Integración', type: 'Integración', role: 'Desarrollador Front', complexity: 'Media', baseHours: 2.00, riskPercent: 0.05, dependency: 'Accesos a herramienta analítica', description: 'Configuración base de analítica, conversiones iniciales y verificación de eventos principales.', active: true },
    { code: 'ACT-010', name: 'Integración API externa', phase: 'Integración', type: 'Back', role: 'Desarrollador Back', complexity: 'Alta', baseHours: 8.00, riskPercent: 0.10, dependency: 'Documentación técnica de API', description: 'Conexión con API externa, autenticación, mapeo de request/response y manejo de errores.', active: true },
    { code: 'ACT-011', name: 'Chatbot web', phase: 'Integración', type: 'Front', role: 'Desarrollador Front', complexity: 'Media', baseHours: 4.00, riskPercent: 0.05, dependency: 'Script o proveedor disponible', description: 'Inserción de script, widget o componente de chatbot, configuración básica y validación visual.', active: true },
    { code: 'ACT-012', name: 'Portal de pagos', phase: 'Integración', type: 'Back', role: 'Desarrollador Back', complexity: 'Alta', baseHours: 12.00, riskPercent: 0.10, dependency: 'Credenciales sandbox disponibles', description: 'Integración de pasarela de pagos para iniciar transacciones y validar estados.', active: true },
    { code: 'ACT-013', name: 'Validación de pagos y webhooks', phase: 'Integración', type: 'Back', role: 'Desarrollador Back', complexity: 'Alta', baseHours: 8.00, riskPercent: 0.10, dependency: 'Webhook y eventos definidos', description: 'Recepción de notificaciones, actualización de estados y manejo de confirmaciones de pago.', active: true },
    { code: 'ACT-014', name: 'Panel CMS básico', phase: 'Back', type: 'Back', role: 'Desarrollador Back', complexity: 'Alta', baseHours: 12.00, riskPercent: 0.10, dependency: 'Campos del CMS definidos', description: 'Panel sencillo para administrar contenido básico, textos o banners.', active: true },
    { code: 'ACT-015', name: 'Blog / noticias', phase: 'Front', type: 'Front', role: 'Desarrollador Front', complexity: 'Media', baseHours: 6.00, riskPercent: 0.05, dependency: 'Modelo de contenido definido', description: 'Listado y detalle de publicaciones con estructura reusable para blog o noticias.', active: true },
    { code: 'ACT-016', name: 'Multiidioma', phase: 'Front', type: 'Front', role: 'Desarrollador Front', complexity: 'Media', baseHours: 5.00, riskPercent: 0.10, dependency: 'Traducciones o estrategia definida', description: 'Habilitación de estructura multiidioma y carga inicial para segundo idioma.', active: true },
    { code: 'ACT-017', name: 'Autenticación y roles', phase: 'Back', type: 'Back', role: 'Desarrollador Back', complexity: 'Alta', baseHours: 10.00, riskPercent: 0.10, dependency: 'Roles y reglas de acceso definidas', description: 'Inicio de sesión, perfiles y control de acceso por tipo de usuario.', active: true },
    { code: 'ACT-018', name: 'Dashboard administrativo', phase: 'Front', type: 'Front', role: 'Desarrollador Front', complexity: 'Alta', baseHours: 12.00, riskPercent: 0.10, dependency: 'Requerimientos del dashboard definidos', description: 'Interfaz administrativa con widgets, tablas o indicadores principales.', active: true },
    { code: 'ACT-019', name: 'Módulo de productos / catálogo', phase: 'Front', type: 'Front', role: 'Desarrollador Front', complexity: 'Alta', baseHours: 10.00, riskPercent: 0.10, dependency: 'Modelo de producto aprobado', description: 'Listado, filtros y detalle de productos o servicios.', active: true },
    { code: 'ACT-020', name: 'Carrito de compras', phase: 'Front', type: 'Front', role: 'Desarrollador Front', complexity: 'Alta', baseHours: 12.00, riskPercent: 0.10, dependency: 'Catálogo y reglas comerciales', description: 'Construcción de carrito con agregar/quitar productos y resumen de compra.', active: true },
    { code: 'ACT-021', name: 'Checkout / pedido', phase: 'Integración', type: 'Back', role: 'Full Stack', complexity: 'Alta', baseHours: 10.00, riskPercent: 0.10, dependency: 'Reglas de pedido definidas', description: 'Flujo de checkout, captura de datos del comprador y creación de pedido.', active: true },
    { code: 'ACT-022', name: 'QA funcional', phase: 'QA', type: 'QA', role: 'QA/Tester', complexity: 'Media', baseHours: 4.00, riskPercent: 0.00, dependency: 'Ambiente de pruebas disponible', description: 'Ejecución de pruebas funcionales sobre flujo, casos borde y criterios de aceptación.', active: true },
    { code: 'ACT-023', name: 'Pruebas unitarias', phase: 'QA', type: 'QA', role: 'Desarrollador Back', complexity: 'Media', baseHours: 3.00, riskPercent: 0.00, dependency: 'Cobertura mínima definida', description: 'Construcción o ajuste de pruebas unitarias para lógica nueva o modificada.', active: true },
    { code: 'ACT-024', name: 'Despliegue a QA', phase: 'DevOps', type: 'DevOps', role: 'DevOps', complexity: 'Media', baseHours: 2.00, riskPercent: 0.00, dependency: 'Pipeline o acceso a servidor', description: 'Compilación, publicación y validación smoke test en ambiente QA.', active: true },
    { code: 'ACT-025', name: 'Despliegue a producción', phase: 'DevOps', type: 'DevOps', role: 'DevOps', complexity: 'Alta', baseHours: 3.00, riskPercent: 0.10, dependency: 'Ventana de despliegue aprobada', description: 'Publicación productiva, validación inicial y acompañamiento de salida.', active: true },
    { code: 'ACT-026', name: 'Mantenimiento mensual', phase: 'Soporte', type: 'Soporte', role: 'Soporte', complexity: 'Media', baseHours: 4.00, riskPercent: 0.00, dependency: 'Alcance mensual acordado', description: 'Bolsa de horas mensual para ajustes menores, soporte y monitoreo básico.', active: true },
    { code: 'ACT-027', name: 'Auditoría técnica', phase: 'Análisis', type: 'Arquitectura', role: 'Arquitecto', complexity: 'Alta', baseHours: 6.00, riskPercent: 0.05, dependency: 'Acceso al sitio o aplicación', description: 'Revisión de rendimiento, estructura, seguridad y oportunidades de mejora.', active: true },
    { code: 'ACT-028', name: 'Configuración dominio / SSL', phase: 'DevOps', type: 'DevOps', role: 'DevOps', complexity: 'Media', baseHours: 2.00, riskPercent: 0.00, dependency: 'Acceso a DNS y hosting', description: 'Configuración de dominio, DNS y certificado SSL.', active: true },
    { code: 'ACT-029', name: 'Agenda / reservas', phase: 'Front', type: 'Front', role: 'Desarrollador Front', complexity: 'Media', baseHours: 8.00, riskPercent: 0.10, dependency: 'Campos y reglas definidos', description: 'Módulo para agendar citas, reservas o solicitudes con validación básica.', active: true },
    { code: 'ACT-030', name: 'Integración Google Maps', phase: 'Integración', type: 'Front', role: 'Desarrollador Front', complexity: 'Baja', baseHours: 2.50, riskPercent: 0.00, dependency: 'Ubicación o API key', description: 'Mapa embebido o integración básica con ubicaciones y enlaces.', active: true },
    { code: 'ACT-031', name: 'Portal clientes / login', phase: 'Back', type: 'Back', role: 'Desarrollador Back', complexity: 'Alta', baseHours: 10.00, riskPercent: 0.10, dependency: 'Flujos y datos definidos', description: 'Portal para clientes con acceso a información o módulos privados.', active: true },
    { code: 'ACT-032', name: 'Recuperación de contraseña', phase: 'Back', type: 'Back', role: 'Desarrollador Back', complexity: 'Media', baseHours: 3.00, riskPercent: 0.05, dependency: 'Correo o canal de recuperación', description: 'Flujo de recuperación y restablecimiento de contraseña con validaciones.', active: true },
    { code: 'ACT-033', name: 'Analítica avanzada / eventos', phase: 'Integración', type: 'Integración', role: 'Desarrollador Front', complexity: 'Media', baseHours: 4.00, riskPercent: 0.05, dependency: 'Matriz de eventos definida', description: 'Eventos personalizados, objetivos, conversiones y etiquetado avanzado.', active: true },
    { code: 'ACT-034', name: 'IA / asistente FAQ', phase: 'Integración', type: 'Front', role: 'Desarrollador Front', complexity: 'Alta', baseHours: 6.00, riskPercent: 0.10, dependency: 'Base de conocimiento disponible', description: 'Configuración de asistente con base de preguntas frecuentes o respuestas guiadas.', active: true },
    { code: 'ACT-035', name: 'Carga masiva / importador', phase: 'Back', type: 'Back', role: 'Desarrollador Back', complexity: 'Alta', baseHours: 8.00, riskPercent: 0.10, dependency: 'Formato de archivo definido', description: 'Carga masiva de datos mediante archivo y validaciones de estructura.', active: true },
    { code: 'ACT-036', name: 'Pasarela de envíos', phase: 'Integración', type: 'Back', role: 'Desarrollador Back', complexity: 'Media', baseHours: 6.00, riskPercent: 0.10, dependency: 'Operador logístico definido', description: 'Integración básica con operador o cálculo de costo de envío.', active: true },
    { code: 'ACT-037', name: 'Integración CRM / leads', phase: 'Integración', type: 'Back', role: 'Desarrollador Back', complexity: 'Media', baseHours: 6.00, riskPercent: 0.05, dependency: 'Campos y endpoint definidos', description: 'Envío de formularios, leads o eventos hacia CRM o herramienta comercial.', active: true },
    { code: 'ACT-038', name: 'Copy y carga inicial de contenido', phase: 'Documentación', type: 'Documentación', role: 'Analista', complexity: 'Media', baseHours: 4.00, riskPercent: 0.05, dependency: 'Contenido aprobado y organizado', description: 'Carga inicial de textos, imágenes o estructura base de contenido.', active: true }
  ],
  plans: [
    {
      name: 'Landing page corporativa',
      code: 'PLAN-LANDING-CORP',
      type: 'Landing page',
      idealFor: 'Captación / campañas',
      description: 'Sitio de una sola página con foco comercial y conversión.',
      includes: '1 landing + formulario + contacto + SEO inicial.',
      activities: [
        { activityName: 'Reunión de entendimiento', quantity: 1, order: 1, role: 'PM', baseHours: 1.50, description: 'Sesión inicial para levantar necesidad y alcance.' },
        { activityName: 'Análisis técnico del requerimiento', quantity: 1, order: 2, role: 'Analista', baseHours: 2.00, description: 'Revisión funcional y técnica para definir alcance y dependencias.' },
        { activityName: 'Diseño UX/UI base', quantity: 1, order: 3, role: 'Diseñador UX/UI', baseHours: 4.00, description: 'Diseño base de interfaz y flujo principal.' },
        { activityName: 'Crear página web landing', quantity: 1, order: 4, role: 'Desarrollador Front', baseHours: 10.00, description: 'Maquetación responsive de landing comercial.' },
        { activityName: 'Formulario de contacto', quantity: 1, order: 5, role: 'Desarrollador Front', baseHours: 5.00, description: 'Formulario con campos, validaciones y confirmación.' },
        { activityName: 'Botón WhatsApp', quantity: 1, order: 6, role: 'Desarrollador Front', baseHours: 1.50, description: 'Botón de contacto directo por WhatsApp.' },
        { activityName: 'Optimización SEO inicial', quantity: 1, order: 7, role: 'Desarrollador Front', baseHours: 3.00, description: 'Configuración SEO on-page básica.' },
        { activityName: 'Configuración analítica básica', quantity: 1, order: 8, role: 'Desarrollador Front', baseHours: 2.00, description: 'Configuración inicial de analítica.' },
        { activityName: 'QA funcional', quantity: 1, order: 9, role: 'QA/Tester', baseHours: 4.00, description: 'Pruebas funcionales del flujo principal.' },
        { activityName: 'Despliegue a QA', quantity: 1, order: 10, role: 'DevOps', baseHours: 2.00, description: 'Publicación y validación en QA.' },
        { activityName: 'Despliegue a producción', quantity: 1, order: 11, role: 'DevOps', baseHours: 3.00, description: 'Publicación productiva y validación inicial.' },
        { activityName: 'Configuración dominio / SSL', quantity: 1, order: 12, role: 'DevOps', baseHours: 2.00, description: 'Configuración de dominio y certificado SSL.' }
      ]
    },
    {
      name: 'Sitio web básico',
      code: 'PLAN-WEB-BASICO',
      type: 'Web corporativa',
      idealFor: 'Empresas pequeñas',
      description: 'Sitio institucional con varias páginas internas y contacto.',
      includes: '1 landing + 3 páginas internas + formulario + WhatsApp.',
      activities: [
        { activityName: 'Reunión de entendimiento', quantity: 1, order: 1, role: 'PM', baseHours: 1.50, description: 'Sesión inicial para levantar necesidad y alcance.' },
        { activityName: 'Análisis técnico del requerimiento', quantity: 1, order: 2, role: 'Analista', baseHours: 2.00, description: 'Revisión funcional y técnica.' },
        { activityName: 'Diseño UX/UI base', quantity: 1, order: 3, role: 'Diseñador UX/UI', baseHours: 4.00, description: 'Diseño base de interfaz.' },
        { activityName: 'Crear página web landing', quantity: 1, order: 4, role: 'Desarrollador Front', baseHours: 10.00, description: 'Página principal del sitio.' },
        { activityName: 'Crear página interna', quantity: 3, order: 5, role: 'Desarrollador Front', baseHours: 6.00, description: 'Páginas internas informativas.' },
        { activityName: 'Formulario de contacto', quantity: 1, order: 6, role: 'Desarrollador Front', baseHours: 5.00, description: 'Formulario de contacto del sitio.' },
        { activityName: 'Botón WhatsApp', quantity: 1, order: 7, role: 'Desarrollador Front', baseHours: 1.50, description: 'Contacto rápido por WhatsApp.' },
        { activityName: 'Optimización SEO inicial', quantity: 1, order: 8, role: 'Desarrollador Front', baseHours: 3.00, description: 'SEO base del sitio.' },
        { activityName: 'Configuración analítica básica', quantity: 1, order: 9, role: 'Desarrollador Front', baseHours: 2.00, description: 'Analítica básica del sitio.' },
        { activityName: 'QA funcional', quantity: 1, order: 10, role: 'QA/Tester', baseHours: 4.00, description: 'Validación funcional del sitio.' },
        { activityName: 'Despliegue a QA', quantity: 1, order: 11, role: 'DevOps', baseHours: 2.00, description: 'Despliegue en QA.' },
        { activityName: 'Despliegue a producción', quantity: 1, order: 12, role: 'DevOps', baseHours: 3.00, description: 'Despliegue productivo.' },
        { activityName: 'Configuración dominio / SSL', quantity: 1, order: 13, role: 'DevOps', baseHours: 2.00, description: 'Configuración de dominio y SSL.' }
      ]
    },
    {
      name: 'Sitio corporativo',
      code: 'PLAN-SITIO-CORP',
      type: 'Web corporativa',
      idealFor: 'Empresas en crecimiento',
      description: 'Sitio institucional robusto, blog y CMS básico.',
      includes: '1 landing + 4 páginas internas + blog + CMS básico.',
      activities: [
        { activityName: 'Reunión de entendimiento', quantity: 1, order: 1, role: 'PM', baseHours: 1.50, description: 'Sesión inicial para levantar necesidad y alcance.' },
        { activityName: 'Análisis técnico del requerimiento', quantity: 1, order: 2, role: 'Analista', baseHours: 2.00, description: 'Análisis funcional y técnico.' },
        { activityName: 'Diseño UX/UI base', quantity: 2, order: 3, role: 'Diseñador UX/UI', baseHours: 4.00, description: 'Diseño base para secciones principales.' },
        { activityName: 'Crear página web landing', quantity: 1, order: 4, role: 'Desarrollador Front', baseHours: 10.00, description: 'Página principal corporativa.' },
        { activityName: 'Crear página interna', quantity: 4, order: 5, role: 'Desarrollador Front', baseHours: 6.00, description: 'Páginas internas corporativas.' },
        { activityName: 'Formulario de contacto', quantity: 1, order: 6, role: 'Desarrollador Front', baseHours: 5.00, description: 'Formulario de contacto.' },
        { activityName: 'Botón WhatsApp', quantity: 1, order: 7, role: 'Desarrollador Front', baseHours: 1.50, description: 'Contacto por WhatsApp.' },
        { activityName: 'Blog / noticias', quantity: 1, order: 8, role: 'Desarrollador Front', baseHours: 6.00, description: 'Listado y detalle para blog o noticias.' },
        { activityName: 'Panel CMS básico', quantity: 1, order: 9, role: 'Desarrollador Back', baseHours: 12.00, description: 'Administración básica de contenido.' },
        { activityName: 'Optimización SEO inicial', quantity: 1, order: 10, role: 'Desarrollador Front', baseHours: 3.00, description: 'SEO on-page.' },
        { activityName: 'Configuración analítica básica', quantity: 1, order: 11, role: 'Desarrollador Front', baseHours: 2.00, description: 'Analítica inicial.' },
        { activityName: 'Copy y carga inicial de contenido', quantity: 1, order: 12, role: 'Analista', baseHours: 4.00, description: 'Carga inicial de contenido aprobado.' },
        { activityName: 'QA funcional', quantity: 1, order: 13, role: 'QA/Tester', baseHours: 4.00, description: 'Validación funcional.' },
        { activityName: 'Despliegue a QA', quantity: 1, order: 14, role: 'DevOps', baseHours: 2.00, description: 'Despliegue en QA.' },
        { activityName: 'Despliegue a producción', quantity: 1, order: 15, role: 'DevOps', baseHours: 3.00, description: 'Despliegue productivo.' },
        { activityName: 'Configuración dominio / SSL', quantity: 1, order: 16, role: 'DevOps', baseHours: 2.00, description: 'Configuración técnica de dominio.' }
      ]
    },
    {
      name: 'Ecommerce básico',
      code: 'PLAN-ECOM-BASICO',
      type: 'E-commerce',
      idealFor: 'Venta online',
      description: 'Catálogo, carrito y checkout con componentes esenciales.',
      includes: 'Landing + catálogo + carrito + checkout + pagos + envíos.',
      activities: [
        { activityName: 'Reunión de entendimiento', quantity: 1, order: 1, role: 'PM', baseHours: 1.50, description: 'Sesión inicial para levantar necesidad.' },
        { activityName: 'Análisis técnico del requerimiento', quantity: 1, order: 2, role: 'Analista', baseHours: 2.00, description: 'Análisis del flujo de venta online.' },
        { activityName: 'Diseño UX/UI base', quantity: 2, order: 3, role: 'Diseñador UX/UI', baseHours: 4.00, description: 'Diseño de secciones comerciales.' },
        { activityName: 'Crear página web landing', quantity: 1, order: 4, role: 'Desarrollador Front', baseHours: 10.00, description: 'Página principal comercial.' },
        { activityName: 'Crear página interna', quantity: 3, order: 5, role: 'Desarrollador Front', baseHours: 6.00, description: 'Páginas internas de soporte comercial.' },
        { activityName: 'Módulo de productos / catálogo', quantity: 1, order: 6, role: 'Desarrollador Front', baseHours: 10.00, description: 'Catálogo con listado, filtros y detalle.' },
        { activityName: 'Carrito de compras', quantity: 1, order: 7, role: 'Desarrollador Front', baseHours: 12.00, description: 'Carrito con resumen de compra.' },
        { activityName: 'Checkout / pedido', quantity: 1, order: 8, role: 'Full Stack', baseHours: 10.00, description: 'Flujo de checkout y creación de pedido.' },
        { activityName: 'Portal de pagos', quantity: 1, order: 9, role: 'Desarrollador Back', baseHours: 12.00, description: 'Integración de pasarela de pagos.' },
        { activityName: 'Validación de pagos y webhooks', quantity: 1, order: 10, role: 'Desarrollador Back', baseHours: 8.00, description: 'Confirmación de pagos por eventos.' },
        { activityName: 'Pasarela de envíos', quantity: 1, order: 11, role: 'Desarrollador Back', baseHours: 6.00, description: 'Integración con operador o reglas de envío.' },
        { activityName: 'Botón WhatsApp', quantity: 1, order: 12, role: 'Desarrollador Front', baseHours: 1.50, description: 'Contacto rápido.' },
        { activityName: 'Optimización SEO inicial', quantity: 1, order: 13, role: 'Desarrollador Front', baseHours: 3.00, description: 'SEO base para tienda.' },
        { activityName: 'Configuración analítica básica', quantity: 1, order: 14, role: 'Desarrollador Front', baseHours: 2.00, description: 'Analítica inicial.' },
        { activityName: 'QA funcional', quantity: 1, order: 15, role: 'QA/Tester', baseHours: 4.00, description: 'Pruebas del flujo de compra.' },
        { activityName: 'Pruebas unitarias', quantity: 1, order: 16, role: 'Desarrollador Back', baseHours: 3.00, description: 'Pruebas de lógica backend.' },
        { activityName: 'Despliegue a QA', quantity: 1, order: 17, role: 'DevOps', baseHours: 2.00, description: 'Despliegue en QA.' },
        { activityName: 'Despliegue a producción', quantity: 1, order: 18, role: 'DevOps', baseHours: 3.00, description: 'Despliegue productivo.' }
      ]
    },
    {
      name: 'Portal B2B',
      code: 'PLAN-PORTAL-B2B',
      type: 'Portal',
      idealFor: 'Clientes o aliados',
      description: 'Portal con autenticación, módulos privados e integraciones.',
      includes: 'Portal + login + roles + dashboard + API + carga masiva.',
      activities: [
        { activityName: 'Reunión de entendimiento', quantity: 1, order: 1, role: 'PM', baseHours: 1.50, description: 'Sesión inicial para entender flujo B2B.' },
        { activityName: 'Análisis técnico del requerimiento', quantity: 1, order: 2, role: 'Analista', baseHours: 2.00, description: 'Revisión funcional, técnica y de dependencias.' },
        { activityName: 'Diseño UX/UI base', quantity: 2, order: 3, role: 'Diseñador UX/UI', baseHours: 4.00, description: 'Diseño base del portal y módulos privados.' },
        { activityName: 'Crear página web landing', quantity: 1, order: 4, role: 'Desarrollador Front', baseHours: 10.00, description: 'Página pública inicial del portal.' },
        { activityName: 'Crear página interna', quantity: 2, order: 5, role: 'Desarrollador Front', baseHours: 6.00, description: 'Páginas internas de soporte o información.' },
        { activityName: 'Autenticación y roles', quantity: 1, order: 6, role: 'Desarrollador Back', baseHours: 10.00, description: 'Inicio de sesión y control de acceso por rol.' },
        { activityName: 'Portal clientes / login', quantity: 1, order: 7, role: 'Desarrollador Back', baseHours: 10.00, description: 'Módulo privado para usuarios autenticados.' },
        { activityName: 'Recuperación de contraseña', quantity: 1, order: 8, role: 'Desarrollador Back', baseHours: 3.00, description: 'Flujo para recuperación de contraseña.' },
        { activityName: 'Dashboard administrativo', quantity: 1, order: 9, role: 'Desarrollador Front', baseHours: 12.00, description: 'Panel con widgets y gestión principal.' },
        { activityName: 'Integración API externa', quantity: 1, order: 10, role: 'Desarrollador Back', baseHours: 8.00, description: 'Conexión con sistemas o servicios externos.' },
        { activityName: 'Carga masiva / importador', quantity: 1, order: 11, role: 'Desarrollador Back', baseHours: 8.00, description: 'Importación de datos por archivo.' },
        { activityName: 'QA funcional', quantity: 1, order: 12, role: 'QA/Tester', baseHours: 4.00, description: 'Pruebas del flujo privado.' },
        { activityName: 'Pruebas unitarias', quantity: 1, order: 13, role: 'Desarrollador Back', baseHours: 3.00, description: 'Pruebas de lógica principal.' },
        { activityName: 'Despliegue a QA', quantity: 1, order: 14, role: 'DevOps', baseHours: 2.00, description: 'Despliegue en ambiente QA.' },
        { activityName: 'Despliegue a producción', quantity: 1, order: 15, role: 'DevOps', baseHours: 3.00, description: 'Despliegue productivo.' }
      ]
    },
    {
      name: 'Desarrollo a la medida',
      code: 'PLAN-CUSTOM',
      type: 'Custom',
      idealFor: 'Plataformas completas',
      description: 'Base de descubrimiento y construcción personalizada.',
      includes: 'Análisis + diseño + integraciones + módulos base.',
      activities: [
        { activityName: 'Reunión de entendimiento', quantity: 1, order: 1, role: 'PM', baseHours: 1.50, description: 'Sesión inicial para levantar necesidad.' },
        { activityName: 'Análisis técnico del requerimiento', quantity: 1, order: 2, role: 'Analista', baseHours: 2.00, description: 'Análisis funcional y técnico.' },
        { activityName: 'Diseño UX/UI base', quantity: 2, order: 3, role: 'Diseñador UX/UI', baseHours: 4.00, description: 'Diseño inicial de experiencia.' },
        { activityName: 'Integración API externa', quantity: 1, order: 4, role: 'Desarrollador Back', baseHours: 8.00, description: 'Integración con sistemas externos.' },
        { activityName: 'Autenticación y roles', quantity: 1, order: 5, role: 'Desarrollador Back', baseHours: 10.00, description: 'Login y roles.' },
        { activityName: 'Dashboard administrativo', quantity: 1, order: 6, role: 'Desarrollador Front', baseHours: 12.00, description: 'Panel administrativo base.' },
        { activityName: 'IA / asistente FAQ', quantity: 1, order: 7, role: 'Desarrollador Front', baseHours: 6.00, description: 'Asistente de preguntas frecuentes.' },
        { activityName: 'Integración CRM / leads', quantity: 1, order: 8, role: 'Desarrollador Back', baseHours: 6.00, description: 'Envío de leads o eventos a CRM.' },
        { activityName: 'QA funcional', quantity: 1, order: 9, role: 'QA/Tester', baseHours: 4.00, description: 'Pruebas funcionales.' },
        { activityName: 'Pruebas unitarias', quantity: 1, order: 10, role: 'Desarrollador Back', baseHours: 3.00, description: 'Pruebas unitarias.' },
        { activityName: 'Despliegue a QA', quantity: 1, order: 11, role: 'DevOps', baseHours: 2.00, description: 'Despliegue QA.' },
        { activityName: 'Despliegue a producción', quantity: 1, order: 12, role: 'DevOps', baseHours: 3.00, description: 'Despliegue productivo.' }
      ]
    }
  ],
  packages: [
    {
      name: 'Portal de pagos',
      code: 'PKG-PORTAL-PAGOS',
      category: 'Comercio / checkout',
      description: 'Agrupa la integración de pagos y confirmaciones.',
      activities: [
        { activityName: 'Portal de pagos', quantity: 1, order: 1, role: 'Desarrollador Back', baseHours: 12.00, description: 'Integración con pasarela de pagos.' },
        { activityName: 'Validación de pagos y webhooks', quantity: 1, order: 2, role: 'Desarrollador Back', baseHours: 8.00, description: 'Confirmación y actualización de estados de pago.' },
        { activityName: 'QA funcional', quantity: 1, order: 3, role: 'QA/Tester', baseHours: 4.00, description: 'Pruebas funcionales del flujo de pago.' }
      ]
    },
    {
      name: 'Chatbot e IA',
      code: 'PKG-CHATBOT-IA',
      category: 'Atención y soporte',
      description: 'Agrupa chatbot web y asistente FAQ.',
      activities: [
        { activityName: 'Chatbot web', quantity: 1, order: 1, role: 'Desarrollador Front', baseHours: 4.00, description: 'Inserción y configuración de chatbot.' },
        { activityName: 'IA / asistente FAQ', quantity: 1, order: 2, role: 'Desarrollador Front', baseHours: 6.00, description: 'Configuración de asistente con preguntas frecuentes.' },
        { activityName: 'QA funcional', quantity: 1, order: 3, role: 'QA/Tester', baseHours: 4.00, description: 'Pruebas de interacción y validación visual.' }
      ]
    },
    {
      name: 'SEO + analítica',
      code: 'PKG-SEO-ANALITICA',
      category: 'Marketing',
      description: 'Mejora la base SEO y el tracking del sitio.',
      activities: [
        { activityName: 'Optimización SEO inicial', quantity: 1, order: 1, role: 'Desarrollador Front', baseHours: 3.00, description: 'Configuración SEO base.' },
        { activityName: 'Configuración analítica básica', quantity: 1, order: 2, role: 'Desarrollador Front', baseHours: 2.00, description: 'Configuración inicial de analítica.' },
        { activityName: 'Analítica avanzada / eventos', quantity: 1, order: 3, role: 'Desarrollador Front', baseHours: 4.00, description: 'Eventos, objetivos y conversiones.' }
      ]
    },
    {
      name: 'Blog administrable',
      code: 'PKG-BLOG-CMS',
      category: 'Contenido',
      description: 'Permite publicar noticias o artículos con administración básica.',
      activities: [
        { activityName: 'Blog / noticias', quantity: 1, order: 1, role: 'Desarrollador Front', baseHours: 6.00, description: 'Listado y detalle de publicaciones.' },
        { activityName: 'Panel CMS básico', quantity: 1, order: 2, role: 'Desarrollador Back', baseHours: 12.00, description: 'Administración básica de contenido.' },
        { activityName: 'Copy y carga inicial de contenido', quantity: 1, order: 3, role: 'Analista', baseHours: 4.00, description: 'Carga inicial de contenido aprobado.' }
      ]
    },
    {
      name: 'Agenda y reservas',
      code: 'PKG-AGENDA-RESERVAS',
      category: 'Conversión',
      description: 'Permite gestionar reservas, citas o solicitudes.',
      activities: [
        { activityName: 'Agenda / reservas', quantity: 1, order: 1, role: 'Desarrollador Front', baseHours: 8.00, description: 'Módulo de agenda o reservas.' },
        { activityName: 'Integración Google Maps', quantity: 1, order: 2, role: 'Desarrollador Front', baseHours: 2.50, description: 'Ubicación o mapa dentro del flujo.' },
        { activityName: 'Integración CRM / leads', quantity: 1, order: 3, role: 'Desarrollador Back', baseHours: 6.00, description: 'Envío de solicitudes a CRM.' }
      ]
    },
    {
      name: 'Autenticación de usuarios',
      code: 'PKG-AUTH-USUARIOS',
      category: 'Seguridad / acceso',
      description: 'Agrupa login, roles y recuperación de contraseña.',
      activities: [
        { activityName: 'Autenticación y roles', quantity: 1, order: 1, role: 'Desarrollador Back', baseHours: 10.00, description: 'Login y control de acceso.' },
        { activityName: 'Portal clientes / login', quantity: 1, order: 2, role: 'Desarrollador Back', baseHours: 10.00, description: 'Portal privado de usuarios.' },
        { activityName: 'Recuperación de contraseña', quantity: 1, order: 3, role: 'Desarrollador Back', baseHours: 3.00, description: 'Restablecimiento de contraseña.' }
      ]
    },
    {
      name: 'Ecommerce núcleo',
      code: 'PKG-ECOMMERCE-NUCLEO',
      category: 'Venta online',
      description: 'Conjunto de componentes esenciales para venta online.',
      activities: [
        { activityName: 'Módulo de productos / catálogo', quantity: 1, order: 1, role: 'Desarrollador Front', baseHours: 10.00, description: 'Catálogo con listado, filtros y detalle.' },
        { activityName: 'Carrito de compras', quantity: 1, order: 2, role: 'Desarrollador Front', baseHours: 12.00, description: 'Carrito y resumen de compra.' },
        { activityName: 'Checkout / pedido', quantity: 1, order: 3, role: 'Full Stack', baseHours: 10.00, description: 'Flujo de checkout.' },
        { activityName: 'Pasarela de envíos', quantity: 1, order: 4, role: 'Desarrollador Back', baseHours: 6.00, description: 'Integración o reglas de envío.' }
      ]
    },
    {
      name: 'Integración externa',
      code: 'PKG-INTEGRACION-EXTERNA',
      category: 'Backoffice / conectividad',
      description: 'Integración de terceros y carga masiva.',
      activities: [
        { activityName: 'Integración API externa', quantity: 1, order: 1, role: 'Desarrollador Back', baseHours: 8.00, description: 'Conexión con API externa.' },
        { activityName: 'Integración CRM / leads', quantity: 1, order: 2, role: 'Desarrollador Back', baseHours: 6.00, description: 'Integración con CRM o herramienta comercial.' },
        { activityName: 'Carga masiva / importador', quantity: 1, order: 3, role: 'Desarrollador Back', baseHours: 8.00, description: 'Importación de datos mediante archivo.' }
      ]
    },
    {
      name: 'Mantenimiento mensual',
      code: 'PKG-MANTENIMIENTO-MENSUAL',
      category: 'Soporte',
      description: 'Bolsa de horas recurrente de soporte y revisión técnica.',
      activities: [
        { activityName: 'Mantenimiento mensual', quantity: 1, order: 1, role: 'Soporte', baseHours: 4.00, description: 'Ajustes menores y monitoreo básico.' },
        { activityName: 'Auditoría técnica', quantity: 1, order: 2, role: 'Arquitecto', baseHours: 6.00, description: 'Revisión técnica y oportunidades de mejora.' }
      ]
}]
};

const seedDatabase = async () => {
  try {
    console.log('\nConnecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected!');

    console.log('Clearing old catalog data...');
    await EstimationCatalog.deleteMany({});

    console.log('Creating base estimation catalog...');
    const seeded = await EstimationCatalog.create(baseSeederData);
    
    console.log('🎉 Catalog seeded successfully in database!');
    console.log(`Document ID: ${seeded._id}`);
    console.log(`Seeded: ${seeded.activities.length} activities, ${seeded.plans.length} plans, ${seeded.packages.length} packages.`);

    mongoose.connection.close();
    console.log('Database connection closed.\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error seeding catalog database:', error);
    process.exit(1);
  }
};

seedDatabase();

