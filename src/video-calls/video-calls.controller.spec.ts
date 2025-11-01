import { Test, TestingModule } from '@nestjs/testing';
import { VideoCallsController } from './video-calls.controller';

describe('VideoCallsController', () => {
  let controller: VideoCallsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VideoCallsController],
    }).compile();

    controller = module.get<VideoCallsController>(VideoCallsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
