import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { IngestModule } from './ingest/ingest.module';
import { QueryModule } from './query/query.module';

@Module({
  imports: [HealthModule, IngestModule, QueryModule],
})
export class AppModule {}
