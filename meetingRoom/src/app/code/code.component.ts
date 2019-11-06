import {Component,OnInit } from '@angular/core';
import {MeetingRoomService} from '../meeting-room.service';
import {Subscription } from 'rxjs';
import {Event} from '../calendarEvent';

@Component({
  selector: 'app-code',
  templateUrl: './code.component.html',
  styleUrls: ['./code.component.css']
})

export class CodeComponent implements OnInit {

  codeSubscription:Subscription;
  meeting:Event;

  constructor(private mroomService:MeetingRoomService) {
  }
  ngOnInit()
  {
    this.codeSubscription = this.mroomService.actualCode.subscribe(
      (event)=>{this.meeting=event});
  }

}
