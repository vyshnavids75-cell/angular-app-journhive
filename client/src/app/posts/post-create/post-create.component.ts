import { Component, OnInit, EventEmitter, Output, ViewEncapsulation } from '@angular/core';
import { Post } from '../../models/post.model';
import { PostsService } from '../../services/posts.service';
import { ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';

@Component({
  selector: 'app-post-create',
  templateUrl: './post-create.component.html',
  styleUrls: ['./post-create.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class PostCreateComponent implements OnInit {
  enteredTitle = '';
  enteredContent = '';
  public mode = 'create';
  public postId: string | null = null;
  public post: Post = { id: '', title: '', caption: '', image: null, creatorId: '', skipImage: false, value: '', date: null, tripId: '' };
  public imagePreview: string | ArrayBuffer | null = null;
  selectedImage: File | null = null;
  creatorId: string = '';
  trips: any[] = [];
  selectedTripId = '';

  values = [
    { name: 'Totally Worth It', emoji: '✅' },
    { name: 'Worth Once', emoji: '⭐' },
    { name: 'Missed Out', emoji: '⚪' },
    { name: 'Not Worth It', emoji: '❌' },
  ];


  // @Output() postCreated = new EventEmitter<Post>();
  // @Output() postUpdated = new EventEmitter<Post>();


  constructor(private postsService: PostsService, private route: ActivatedRoute, private toastr: ToastrService,
    private router: Router
  ) {

  }

  ngOnInit(): void {
    this.postsService.getUserId().subscribe((id) => {
      this.creatorId = id || '';
      if (this.creatorId) {
        this.postsService.getTripByCreatorId(this.creatorId).subscribe(res => {
          this.trips = res.trips;
        });
      }
    })
    this.route.paramMap.subscribe(paramMap => {
      this.postId = paramMap.get('postId');
      const routeTripId = paramMap.get('tripId');
      if (routeTripId) {
        this.selectedTripId = routeTripId;
      }
      this.mode = this.postId ? 'edit' : 'create';

      if (this.postId) {
        this.postsService.getPostById(this.postId).subscribe(postData => { //fetching post details to edit post.Only used in edit mode.
          this.post = postData;
          this.selectedTripId = postData.tripId || '';
          if (postData.date) {
            this.post.date = new Date(postData.date);
          }
          if (postData.image && typeof postData.image === 'string') {
            this.imagePreview = postData.image;
          }
        });
      }
    });
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.selectedImage = file;

    const reader = new FileReader();
    reader.onload = () => (this.imagePreview = reader.result);
    reader.readAsDataURL(file);
  }

  selectMood(value: string) {
    this.post.value = value;
  }

  onCheckboxChanged(event: any) {
    this.post.skipImage = event.checked;
  }

  savePost() {
    if (!this.post.title || !this.post.caption || !this.post.value) {
      return;
    }

    const postData = new FormData();
    postData.append('title', this.post.title);
    postData.append('caption', this.post.caption);
    if (this.selectedImage) {
      postData.append('image', this.selectedImage, this.selectedImage.name);
    }
    postData.append('creatorId', this.creatorId);
    postData.append('skipImage', this.post.skipImage.toString());
    postData.append('value', this.post.value);
    postData.append('date', this.post.date ? this.post.date.toDateString() : '');
    if (this.selectedTripId) {
      postData.append('tripId', this.selectedTripId);
    }

    if (this.mode === 'create') {
      this.postsService.addPost(postData).subscribe(
        (res) => {
          this.toastr.success('Post created successfully', 'Success');
          this.post.title = '';
          this.post.caption = '';
          this.post.value = '';
          // this.post.date = new Date();
          this.post.skipImage = false;
          this.selectedImage = null;
          this.imagePreview = null;
          // Navigate back to trip's post list if tripId exists, otherwise to trips dashboard
          if (this.selectedTripId) {
            this.router.navigate(['/trips', this.selectedTripId]);
          } else {
            this.router.navigate(['/trips']);
          }
        },
        (err) => this.toastr.error('Post creation failed', 'Error')
      );
    } else if (this.mode === 'edit' && this.postId) {
      this.postsService.updatePost(this.postId, postData).subscribe(
        (res) => {
          this.toastr.success('Post updated successfully', 'Success');
          // Navigate back to trip's post list if tripId exists, otherwise to trips dashboard
          if (this.selectedTripId) {
            this.router.navigate(['/trips', this.selectedTripId]);
          } else {
            this.router.navigate(['/trips']);
          }
        },
        (err) => {
          this.toastr.error('Post update failed: ', err);
        }
      );
    }
  }

  onCheckedSkipImage(event: any) {
    this.post.skipImage = event.checked;
    if (this.post.skipImage) {
      this.imagePreview = null;
      this.selectedImage = null;
    }
  }

  cancelClick() {
    // Navigate back to trip's post list if tripId exists, otherwise to trips dashboard
    if (this.selectedTripId) {
      this.router.navigate(['/trips', this.selectedTripId]);
    } else {
      this.router.navigate(['/trips']);
    }
  }

}


