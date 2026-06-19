import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { IngestService } from './ingest.service';
import { IngestDto } from './ingest.dto';

@Controller('ingest')
export class IngestController {
  constructor(private readonly ingestService: IngestService) {}

  @Post()
  @HttpCode(201)
  async ingest(@Body() dto: IngestDto) {
    return this.ingestService.ingest(dto);
  }
}
