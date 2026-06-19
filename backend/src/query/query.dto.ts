import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class QueryDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  question: string;
}
