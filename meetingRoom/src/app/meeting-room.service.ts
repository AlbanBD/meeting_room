import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import {Event} from './calendarEvent';

@Injectable({
  providedIn: 'root'
})
export class MeetingRoomService {

  actualCode = this.socket.fromEvent<Event>('cur_event');
  eventList = this.socket.fromEvent<Event[]>('events');

  constructor(private socket:Socket) {
  }
}
