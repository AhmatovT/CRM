import {
  IsString,
  IsNotEmpty,
  IsInt,
  Min,
  IsEnum,
  IsNumber,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { WeekPattern } from '@prisma/client';

export class CreateGroupDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  monthlyFee: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  capacity: number;

  @IsString()
  roomId: string;
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Time must be in HH:mm format (00:00 - 23:59)',
  })
  startTime: string;

  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Time must be in HH:mm format (00:00 - 23:59)',
  })
  endTime: string;

  @IsEnum(WeekPattern)
  weekPattern: WeekPattern;
}
