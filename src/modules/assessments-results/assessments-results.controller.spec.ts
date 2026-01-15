import { Test, TestingModule } from '@nestjs/testing';
import { AssessmentsResultsController } from './assessments-results.controller';
import { AssessmentsResultsService } from './assessments-results.service';

describe('AssessmentsResultsController', () => {
  let controller: AssessmentsResultsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssessmentsResultsController],
      providers: [AssessmentsResultsService],
    }).compile();

    controller = module.get<AssessmentsResultsController>(AssessmentsResultsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
