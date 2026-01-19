import { PartialType } from '@nestjs/mapped-types';
import { CreateJournalEntryDto } from './create-journal.dto';

export class UpdateJournalEntryDto extends PartialType(CreateJournalEntryDto) {}