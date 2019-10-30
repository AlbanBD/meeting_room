import {Component,OnInit } from '@angular/core';
import {MeetingRoomService}from './meeting-room.service';
import {Subscription } from 'rxjs';

@Component({
  selector: 'app-code',
  templateUrl: './code.component.html',
  styleUrls: ['./code.component.css']
})

export class CodeComponent implements OnInit {

  codeSubscription:Subscription;
  code_reunion:string;

  constructor(private mroomService:MeetingRoomService) {
  }
  ngOnInit()
  {
    this.codeSubscription = this.mroomService.actualCode.subscribe(
      code=>{this.code_reunion=code};
  }

}
