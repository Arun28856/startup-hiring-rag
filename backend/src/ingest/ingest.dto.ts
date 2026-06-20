import { IsIn, IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export class IngestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Matches(/^[\w.\- ]+$/, { message: 'Filename contains invalid characters' })
  filename: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500_000)
  content: string;

  @IsNotEmpty()
  @IsIn(['text/plain', 'text/markdown', 'application/pdf'])
  mimeType: string;
}
