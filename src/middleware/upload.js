const multer = require('multer');

// Configure local storage purely for development phase if no cloudinary/S3
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Formato de archivo no válido. Solo imágenes permitidas.'), false);
    }
  }
});

module.exports = upload;
