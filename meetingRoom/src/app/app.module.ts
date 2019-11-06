import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CodeComponent } from './code/code.component';
import { SocketIoModule, SocketIoConfig} from 'ngx-socket-io';
import { EventsComponent } from './events/events.component';

const config:SocketIoConfig={url:'http://localhost:4444', options:{}};

@NgModule({
  declarations: [
    AppComponent,
    CodeComponent,
    EventsComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    SocketIoModule.forRoot(config)
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
