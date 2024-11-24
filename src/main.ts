import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { Buffer } from 'buffer';

(window as any).global = window;
(window as any).Buffer = Buffer;


bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
