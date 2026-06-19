import {
  Injectable,
  ServiceUnavailableException,
  Logger,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { IngestDto } from './ingest.dto';

interface PythonIngestResponse {
  chunks_stored: number;
}

@Injectable()
export class IngestService {
  private readonly logger = new Logger(IngestService.name);
  private readonly pythonServiceUrl = 'http://localhost:8000';

  constructor(private readonly httpService: HttpService) {}

  async ingest(dto: IngestDto): Promise<{ message: string; chunksStored: number }> {
    try {
      const payload = {
        filename: dto.filename,
        content: dto.content,
        mime_type: dto.mimeType,
      };

      const response = await firstValueFrom(
        this.httpService.post<PythonIngestResponse>(
          `${this.pythonServiceUrl}/ingest`,
          payload,
        ),
      );

      return {
        message: 'Ingested successfully',
        chunksStored: response.data.chunks_stored,
      };
    } catch (error: unknown) {
      this.logger.error('Failed to reach embeddings service', error);
      throw new ServiceUnavailableException(
        'Embeddings service is unreachable. Please ensure the Python service is running on port 8000.',
      );
    }
  }
}
