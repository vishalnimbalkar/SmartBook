module.exports = {
	type: 'object',
	properties: {
		addressLine: { type: 'string' },
		city: { type: 'string' },
		state: { type: 'string' },
		zipCode: { type: 'string' },
		country: { type: 'string' },
	},
	required: ['addressLine', 'city', 'state', 'zipCode', 'country'],
	additionalProperties: false,
};
