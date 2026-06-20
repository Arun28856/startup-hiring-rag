import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class QueryDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(1000)
  question: string;
}
