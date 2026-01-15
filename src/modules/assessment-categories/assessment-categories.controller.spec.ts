import { Test, TestingModule } from '@nestjs/testing';
import { AssessmentCategoriesController } from './assessment-categories.controller';
import { AssessmentCategoriesService } from './assessment-categories.service';

describe('AssessmentCategoriesController', () => {
  let controller: AssessmentCategoriesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssessmentCategoriesController],
      providers: [AssessmentCategoriesService],
    }).compile();

    controller = module.get<AssessmentCategoriesController>(AssessmentCategoriesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
