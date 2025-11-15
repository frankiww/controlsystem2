const { z } = require('zod');

exports.userValidation = z.object({
    email: z.string().email().optional(),
    password: z.string().optional(),
    name: z.string().min(1).optional(),
    roles: z.array(z.number().int()).nonempty().refine(
        (roles) => roles.every(r => [1,2,3].includes(r))
    ).optional()
});

