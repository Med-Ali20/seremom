import { Test, TestingModule } from '@nestjs/testing';
import { AssessmentCategoriesService } from './assessment-categories.service';

describe('AssessmentCategoriesService', () => {
  let service: AssessmentCategoriesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AssessmentCategoriesService],
    }).compile();

    service = module.get<AssessmentCategoriesService>(AssessmentCategoriesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
