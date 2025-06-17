const multer = require('multer');

// Multer storage config
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/books');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    },
});

const upload = multer({
    storage: storage,
    // Validation for file type
    fileFilter: function (req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new multer.MulterError('FILE_TYPE_INVALID', 'Only image files are allowed.'));
        }
        cb(null, true);
    },
    // Validation for file size
    limits: {
        fileSize: 2 * 1024 * 1024, // 2 MB max file size
    },
});

module.exports = { upload };
