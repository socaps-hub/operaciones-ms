import { Resolver } from '@nestjs/graphql';
import { CaptacionService } from './captacion.service';

@Resolver()
export class CaptacionResolver {
  constructor(private readonly captacionService: CaptacionService) {}
}
