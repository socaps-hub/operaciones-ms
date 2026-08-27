import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { join } from 'path';
import { HelloWorldModule } from './hello-world/hello-world.module';
import { DashboardsModule } from './dashboards/dashboards.module';
import { CommonModule } from './common/common.module';
import { MetasModule } from './metas/metas.module';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      playground: false,
      plugins: [ApolloServerPluginLandingPageLocalDefault()],
      // resolvers: { JSON: GraphQLJSON },
    }),
    HelloWorldModule,
    DashboardsModule,
    CommonModule,
    MetasModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
