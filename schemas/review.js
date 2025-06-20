module.exports = {
	type: 'object',
	properties: { bookId: { type: 'number' }, rating: { type: 'number' }, comment: { type: 'string' } },
	required: ['bookId', 'rating', 'comment'],
	additionalProperties: false,
};
