import { Component, OnInit } from '@angular/core';
import {MeetingRoomService} from '../meeting-room.service';
import {Subscription } from 'rxjs';
import {Event} from '../calendarEvent';

@Component({
  selector: 'app-events',
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.css']
})
export class EventsComponent implements OnInit {

  event_list:Event[];
  eventsSubscription:Subscription;

  constructor(private mroomService:MeetingRoomService) { }

  ngOnInit() {
    this.eventsSubscription = this.mroomService.eventList.subscribe(
      (elist)=>{
        this.event_list=elist;
      });
  }
}
