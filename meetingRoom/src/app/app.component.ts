import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit{
  date:Date;

  constructor(){}

  ngOnInit()
  {
    //Interval de 500ms pour afficher dynamiquement la date et l'heure
    setInterval(() => {
      this.date = new Date();
    }, 500);
  }

}
