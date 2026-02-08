import { IsInt, IsString, Min } from 'class-validator';

export class CreateGroupDto {
  @IsString()
  name: string;

  @IsInt()
  @Min(0)
  price: number;

  @IsInt()
  @Min(1)
  capacity: number;

  @IsString()
  teacherId: string;

  @IsString()
  roomId: string;
}
