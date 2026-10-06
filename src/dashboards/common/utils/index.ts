import { Prisma } from '@prisma/client';

export const toNumber = (
  value: Prisma.Decimal | bigint | number | string | null | undefined,
): number => {
  if (value === null || value === undefined) {
    return 0;
  }

  if (value instanceof Prisma.Decimal) {
    return value.toNumber();
  }

  return Number(value);
}