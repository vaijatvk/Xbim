import { Component, ElementRef, NgZone, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Message, MessageType, Viewer, ViewType } from '@xbim/viewer';
import { Observable, of } from 'rxjs';
import { map, catchError, finalize } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'FlexViewer';
  @ViewChild('canvas', { static: true }) canvas: ElementRef;
  viewer: Viewer;

  constructor(
    private httpClient: HttpClient,
    private ngZone: NgZone) { }

  ngOnInit() {

    // avoid Angular to inject change detection after every frame and every event (line a canvas mouseover)
    this.ngZone.runOutsideAngular(() => {
      if (!this.sanityCheckViewer()) {
        return;
      }

      this.viewer = new Viewer('canvas');
      const viewer = this.viewer;

      viewer.on('error', (err: { message: string }) => {
        console.error('Viewer Error', err.message);
      });

      viewer.on('loaded', e => {
        console.log('Loaded');
      });


      viewer.start();

      // tslint:disable-next-line: no-string-literal
      window['viewer'] = this.viewer;

    });



    // this.Viewer.loadAsync("./assets/Files/956bf1bc-1963-4734-958f-748b1c4e640f.wexbim");
    let accessToken = '';
    this.getToken()
      .subscribe((result: any) => {
        accessToken = result;
        console.log('token', result);
        const headers: { [name: string]: string; } = { Authorization: 'Bearer ' + accessToken };
        // const url = "./assets/Files/956bf1bc-1963-4734-958f-748b1c4e640f.wexbim";
        const url = './assets/Files/model-35200-envelope.wexbim';
        //
        this.viewer.loadAsync(url, url, headers, (msg: Message) => {
          console.log('progress', msg);
          if (msg.type === MessageType.COMPLETED) {
            console.log('Starting', msg.wexbimId);
            this.viewer.start(msg.wexbimId);
            this.viewer.show(ViewType.DEFAULT);
          }
        });
      });

  }
  // downloadFile(data: Blob) {
  //   const blob = new Blob([data], { type: 'application/octet-stream' });
  //   const url= window.URL.createObjectURL(blob);

  // }

  getToken(): Observable<any> {
    return this.httpClient.post('http://localhost/FlexMVC/Flex/GetToken', null).pipe(
      map((body: any) => body.result),
      catchError((error: any) => of(null))
    );
  }

  private sanityCheckViewer(): boolean {
    const sanityCheck = Viewer.check();
    let result = true;
    if (!sanityCheck.noErrors) {
      console.error('Fatal: WebGL Viewer not supported', sanityCheck.errors);
      result = false;
    }
    if (!sanityCheck.noWarnings) {
      console.warn('Warning: WebGL Viewer not fully supported', sanityCheck.warnings);
    }
    if (sanityCheck.noErrors && sanityCheck.noWarnings) {
      console.log('WebGL Viewer checked OK');
    }
    return result;
  }

}

