import { Component, ElementRef, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Message, MessageType, Viewer } from '@xbim/viewer';
import { Observable, of } from 'rxjs';
import { map, catchError, finalize } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'FlexViewer';
  @ViewChild("canvas",{static:true}) canvas = ElementRef;
  Viewer :Viewer;
  constructor(private httpClient: HttpClient) { }
ngOnInit(){

  this.Viewer = new Viewer("canvas");
  //this.Viewer.loadAsync("./assets/Files/956bf1bc-1963-4734-958f-748b1c4e640f.wexbim");
  let accessToken = "";
    this.getToken()
    .subscribe((result: any) => {
    accessToken = result;
    console.log(result);
    const headers: { [name: string]: string; } = { Authorization: "Bearer " + accessToken };
  const url = "./assets/Files/956bf1bc-1963-4734-958f-748b1c4e640f.wexbim";
    this.Viewer.loadAsync(url, url, headers, (msg: Message) => {
      if (msg.type === MessageType.COMPLETED) {
        this.Viewer.start(msg.wexbimId);
      }
      window['viewer'] = this.Viewer;
  });
  })
  
}
// downloadFile(data: Blob) {
//   const blob = new Blob([data], { type: 'application/octet-stream' });
//   const url= window.URL.createObjectURL(blob);
  
// }

getToken(): Observable<any> {
  return this.httpClient.post("http://localhost/FlexMVC/Flex/GetToken",null).pipe(
    map((body: any) => body.result),
    catchError((error: any) => of(null))
  );
}

}

