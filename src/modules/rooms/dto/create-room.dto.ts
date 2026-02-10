import { IsInt, IsString, Max, Min, MaxLength } from 'class-validator';

export class CreateRoomDto {
  @IsString()
  @MaxLength(80)
  name: string;

  @IsInt()
  @Min(1)
  @Max(500)
  capacity: number;
}
