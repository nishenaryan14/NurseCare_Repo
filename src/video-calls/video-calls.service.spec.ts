import { Test, TestingModule } from '@nestjs/testing';
import { VideoCallsService } from './video-calls.service';

describe('VideoCallsService', () => {
  let service: VideoCallsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VideoCallsService],
    }).compile();

    service = module.get<VideoCallsService>(VideoCallsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
