const multer = require('multer');

const multerErrorHandling = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        switch (err.code) {
            case 'FILE_TYPE_INVALID':
                return res.status(400).json({ success: false, message: 'Only image files are allowed.' });
            case 'LIMIT_FILE_SIZE':
                return res
                    .status(400)
                    .json({ success: false, message: 'File too large. Max 2MB allowed.' });
            case 'LIMIT_FILE_COUNT':
                return res.status(400).json({ success: false, message: 'Too many files uploaded.' });
            case 'LIMIT_UNEXPECTED_FILE':
                return res
                    .status(400)
                    .json({ success: false, message: 'Unexpected file field or too many files.' });
            default:
                return res.status(400).json({ success: false, message: err.message });
        }
    }
    return res.status(500).json({ success: false, message: err.message });
};

module.exports = { multerErrorHandling };
