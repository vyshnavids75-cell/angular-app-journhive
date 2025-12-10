import { Injectable } from "@angular/core";
import { Subject } from "rxjs";

@Injectable({
    providedIn: 'root'
})

export class DownloadService {
    private downloadSubject = new Subject<void>();
    public download$ = this.downloadSubject.asObservable();

    triggerDownload() {
        this.downloadSubject.next();
    }
}