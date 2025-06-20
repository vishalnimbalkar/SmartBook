const ajvIntance = require('ajv');
const ajv = new ajvIntance({ allErrors: true });

function validate(schema) {
	const validate = ajv.compile(schema);
	return (req, res, next) => {
		const valid = validate(req.body);
		if (!valid) {
			return res.status(400).json({ success: false, errors: validate.errors });
		}
		next();
	};
}

module.exports = { validate };
