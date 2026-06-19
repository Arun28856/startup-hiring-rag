import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { QueryController } from './query.controller';
import { QueryService } from './query.service';

@Module({
  imports: [HttpModule],
  controllers: [QueryController],
  providers: [QueryService],
})
export class QueryModule {}
