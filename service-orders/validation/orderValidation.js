const { z } = require('zod');

exports.orderValidation = z.object({
    userId: z.string().uuid().optional(),
    order: z.array(
    z.record(
        z.string(),
        z.number().int().positive()
    )
    ).nonempty().optional(),
    total: z.number().positive().optional(),
    status: z.enum([
        "Создан",
        "В работе",
        "Выполнен",
        "Отменен"
    ]).optional()
});

