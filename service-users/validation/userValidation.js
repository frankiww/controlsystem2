const { z } = require('zod');

exports.userValidation = z.object({
    email: z.string().email(),
    password: z.string(),
    name: z.string().min(1),
    roles: z.array(z.number().int()).nonempty().refine(
        (roles) => roles.every(r => [1,2,3].includes(r))
    )
});

