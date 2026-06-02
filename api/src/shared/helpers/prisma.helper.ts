import { Prisma } from 'generated/prisma/client';

export function getUniqueFields(err: unknown): string[] {
  if (!(err instanceof Prisma.PrismaClientKnownRequestError)) return [];

  const meta = err.meta as
    | {
        target?: string[];
        driverAdapterError?: {
          cause?: {
            constraint?: {
              fields?: string[];
            };
          };
        };
      }
    | undefined;

  return (
    meta?.target ?? meta?.driverAdapterError?.cause?.constraint?.fields ?? []
  );
}
