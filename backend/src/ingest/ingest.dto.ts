import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class IngestDto {
  @IsString()
  @IsNotEmpty()
  filename: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsIn(['text/plain', 'text/markdown', 'application/pdf'])
  mimeType: string;
}
