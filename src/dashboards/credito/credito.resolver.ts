import { Resolver } from '@nestjs/graphql';
import { CreditoService } from './credito.service';

@Resolver()
export class CreditoResolver {
  constructor(private readonly creditoService: CreditoService) {}
}
