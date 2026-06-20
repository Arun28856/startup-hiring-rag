import {
  Injectable,
  ServiceUnavailableException,
  Logger,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { QueryDto } from './query.dto';

export interface SourceDocument {
  content: string;
  metadata: Record<string, unknown>;
}

export interface QueryResult {
  answer: string;
  sources: SourceDocument[];
}

interface PythonQueryResponse {
  answer: string;
  sources: SourceDocument[];
}

@Injectable()
export class QueryService {
  private readonly logger = new Logger(QueryService.name);
  private readonly pythonServiceUrl =
    process.env.EMBEDDINGS_SERVICE_URL ?? 'http://localhost:8000';

  constructor(private readonly httpService: HttpService) {}

  async query(dto: QueryDto): Promise<QueryResult> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<PythonQueryResponse>(
          `${this.pythonServiceUrl}/query`,
          { question: dto.question },
        ),
      );

      return {
        answer: response.data.answer,
        sources: response.data.sources,
      };
    } catch (error: unknown) {
      this.logger.error('Failed to reach embeddings service', error);
      throw new ServiceUnavailableException(
        'Embeddings service is unreachable. Please ensure the Python service is running on port 8000.',
      );
    }
  }
}
