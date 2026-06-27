import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

// Deliberately has no `segments` field. Segment assignment is an internal
// concern (e.g. an admin tags someone after a webinar) — never something
// an anonymous signup form should be able to set on itself.
export class SubscribeDto {
  @IsEmail()
  @MaxLength(254) // RFC 5321 max mailbox length
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  firstName?: string;
}