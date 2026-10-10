import { Resolver } from '@nestjs/graphql';
import { AfiliacionService } from './afiliacion.service';

@Resolver()
export class AfiliacionResolver {
  constructor(private readonly afiliacionService: AfiliacionService) {}
}
