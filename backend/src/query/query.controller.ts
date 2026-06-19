import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { QueryService, QueryResult } from './query.service';
import { QueryDto } from './query.dto';

@Controller('query')
export class QueryController {
  constructor(private readonly queryService: QueryService) {}

  @Post()
  @HttpCode(200)
  async query(@Body() dto: QueryDto): Promise<QueryResult> {
    return this.queryService.query(dto);
  }
}
