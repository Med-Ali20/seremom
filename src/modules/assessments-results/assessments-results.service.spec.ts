import { Test, TestingModule } from '@nestjs/testing';
import { AssessmentsResultsService } from './assessments-results.service';

describe('AssessmentsResultsService', () => {
  let service: AssessmentsResultsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AssessmentsResultsService],
    }).compile();

    service = module.get<AssessmentsResultsService>(AssessmentsResultsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
