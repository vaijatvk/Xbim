import { Component, ElementRef, NgZone, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Grid, LoaderOverlay, Message, MessageType, NavigationCube, State, Viewer, ViewType } from '@xbim/viewer';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'FlexViewer';
  @ViewChild('canvas', { static: true }) canvas: ElementRef;
  viewer: Viewer;
  private navigationCube: NavigationCube;
  private navigationGrid: Grid;
  private loadingOverlay: LoaderOverlay;

  constructor(
    private httpClient: HttpClient,
    private ngZone: NgZone) { }

  ngOnInit() {

    // Run event handling outside of Angular. This is for performance reasons
    this.ngZone.runOutsideAngular(() => {
      if (!this.sanityCheckViewer()) {
        return;
      }

      this.viewer = new Viewer('canvas');
      const viewer = this.viewer;

      viewer.highlightingColour = [0, 0, 255, 220];

      viewer.on('error', (err: { message: string }) => {
        console.error('Viewer Error', err.message);
      });

      viewer.on('loaded', e => {
        // Hide the loading overlay
        this.loadingOverlay.hide();
        console.log('Model loaded');
      });

      viewer.on('pick', e => {
        console.log('Picked', e);
        const state = viewer.getState(e.id, e.model);
        if (state === State.HIGHLIGHTED) {
          viewer.removeState(State.HIGHLIGHTED, [e.id], e.model);
        } else {
          viewer.addState(State.HIGHLIGHTED, [e.id], e.model);
        }

      });
      // TODO: Handlers for 'doubleClick' etc. 'mousemove' (for highlighting, tooltips)

      this.addPlugins(viewer);

      viewer.start();

      // tslint:disable-next-line: no-string-literal
      window['viewer'] = this.viewer;

    });

    this.loadWexbimData();
  }

  private loadWexbimData() {
    this.loadingOverlay.show();

    // this.Viewer.loadAsync("./assets/Files/956bf1bc-1963-4734-958f-748b1c4e640f.wexbim");
    let accessToken = '';
    this.getToken()
      .subscribe((result: any) => {
        accessToken = result;
        console.log('token', result);
        const headers: { [name: string]: string; } = { Authorization: 'Bearer ' + accessToken };

        // The building geometry is split into logical parts giving some control over what to download.
        // These are loaded concurrently and all displayed in the same view. Federation works exactly the same way
        const parts = [
          'building-envelope',
          'windows-doors',
          'components',
          'spatial-structure',
          'site'
        ];

        parts.forEach(part => {
          // Change to download from Flex.
          const url = `./assets/Files/${part}.wexbim`;
          this.viewer.loadAsync(url, url, headers, (msg: Message) => {
            console.log(`${part} progress`, msg);
            if (msg.type === MessageType.COMPLETED) {
              console.log(`Starting ${part}`, msg.wexbimId);
              this.viewer.start(msg.wexbimId);

              // if everything is loaded and we have a bounding box, zoom to a default view
              if (this.viewer.activeHandles.every(h => this.viewer.isModelLoaded(h.id))
                && (this.viewer.getTargetBoundingBox() != null)) {
                console.log(`Zoom extents : ${part}`);
                this.viewer.show(ViewType.DEFAULT);
              }
            }
          });
        });
      });
  }

  private addPlugins(viewer: Viewer) {
    // configure and add navigation grid
    this.navigationGrid = new Grid();
    this.navigationGrid.stopped = false;
    this.navigationGrid.zFactor = 20;
    this.navigationGrid.colour = [0, 0, 0, 0.8];
    viewer.addPlugin(this.navigationGrid);

    // configure and add navigation cube
    this.navigationCube = new NavigationCube();
    this.navigationCube.ratio = 0.05;
    this.navigationCube.passiveAlpha = 1.0;
    this.navigationCube.stopped = false;
    this.navigationCube.trueNorth = 0;
    viewer.addPlugin(this.navigationCube);

    this.loadingOverlay = new LoaderOverlay();

    viewer.addPlugin(this.loadingOverlay);

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

  // Check the viewer enviroment is OK
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

