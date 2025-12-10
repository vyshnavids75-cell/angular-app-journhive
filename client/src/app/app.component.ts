import { Component } from '@angular/core';
import { Post } from './models/post.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  storedPosts: Post[] = [];

  constructor(private router: Router) {

  }

  onAddPost(post: any) {
    this.storedPosts.push(post);
    this.storedPosts = [...this.storedPosts];
  }

  showHeader(): boolean {
    return !(this.router.url === '/login' || this.router.url === '/signup');
  }

}
