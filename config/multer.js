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
		const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
		if (allowedTypes.includes(file.mimetype)) {
			cb(null, true);
		} else {
			cb(new Error('Only JPEG, PNG, and WEBP images are allowed'), false);
		}
	},
	// Validation for file size
	limits: {
		fileSize: 2 * 1024 * 1024, // 2 MB max file size
	},
});

const addCoverPage = upload.single('coverPage');

module.exports = { addCoverPage };
