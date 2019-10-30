import { TestBed } from '@angular/core/testing';

import { MeetingRoomService } from './meeting-room.service';

describe('MeetingRoomService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: MeetingRoomService = TestBed.get(MeetingRoomService);
    expect(service).toBeTruthy();
  });
});
