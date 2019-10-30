import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';

@Injectable({
  providedIn: 'root'
})
export class MeetingRoomService {
  actualCode = this.socket.fromEvent<string>('book_code');

  constructor(private socket:Socket) {
  }
}
