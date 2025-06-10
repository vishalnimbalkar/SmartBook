module.exports = {
    type: 'object',
    properties: {
        name: { type: 'string' },
        email: { type: 'string' },
        password: { type: 'string' },
        phone: { type: 'string' },
    },
    required: ['name', 'email', 'password', 'phone'],
    additionalProperties: false,
};
