import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';

export function validate(schema: ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      return next(result.error);
    }

    Object.assign(req, result.data);
    return next();
  };
}
