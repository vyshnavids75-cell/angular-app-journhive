import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Trip } from '../models/trip.model';
import { PostsService } from '../services/posts.service';
import { ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-trip-create',
  templateUrl: './trip-create.component.html',
  styleUrls: ['./trip-create.component.scss']
})
export class TripCreateComponent implements OnInit {
  public trip: Trip = { id: '', destination: '', startDate: null, endDate: null, coverPhoto: null, creatorId: '', skipImage: false};
  public creatorId = '';
  public imagePreview: string | ArrayBuffer | null = null;
  selectedImage: File | null = null;
  public mode = 'create';
  public tripId: string | null = null;

  constructor(private router: Router, private postsService: PostsService, private route: ActivatedRoute,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.postsService.getUserId().subscribe((id) => {
      this.creatorId = id || '';
    })
    this.route.paramMap.subscribe(paramMap => {
      this.tripId = paramMap.get('tripId');
      this.mode = this.tripId ? 'edit' : 'create';
      if (this.tripId) {
        this.postsService.getTripById(this.tripId).subscribe(tripData => { //fetching trip details to edit trip. Only used in edit mode.
          this.trip = {
            id: tripData.id,
            destination: tripData.destination,
            startDate: tripData.startDate ? new Date(tripData.startDate) : null,
            endDate: tripData.endDate ? new Date(tripData.endDate) : null,
            skipImage: tripData.skipImage,
            coverPhoto: tripData.coverPhoto
          };

          this.imagePreview =
            typeof tripData.coverPhoto === 'string' ? tripData.coverPhoto : null;
          console.log('trip dataaaaaaa',tripData)
        });
      }
    });
  }

  cancelClick() {
    this.router.navigate(['/trips']);
  }

  addTrip() {
    if(!this.trip.destination || !this.trip.startDate || !this.trip.endDate) {
      return;
    }
    const tripData = new FormData();
    tripData.append('destination', this.trip.destination);
    tripData.append('startDate', this.trip.startDate ? this.trip.startDate.toDateString() : '');
    tripData.append('endDate', this.trip.endDate? this.trip.endDate.toDateString() : '')
    tripData.append('creatorId', this.creatorId); //getting from login/signup page
    tripData.append('skipImage', this.trip.skipImage.toString());

    if (this.mode === 'create') {
      // For create: only send file if present; server will store null when no file
      if (this.selectedImage) {
        tripData.append('coverPhoto', this.selectedImage);
      }

      this.postsService.addTrip(tripData).subscribe((res) => {
      console.log('response for trips', res);
      this.toastr.success('Trip added successfully', 'Success');
      this.trip.destination = '';
      this.trip.startDate = null;
      this.trip.endDate = null;
      this.selectedImage = null;
      this.imagePreview = null;
      this.trip.skipImage = false;
      this.router.navigate(['/trips']);
       
    }, (err) => {
      this.toastr.error('Trip addition failed', 'Error');
    });
  } else if (this.mode === 'edit') {
    if (!this.tripId) {
      return;
    }
    // For edit: allow clearing or replacing image
    if (this.trip.skipImage) {
      tripData.append('coverPhoto', '');
    } else if (this.selectedImage) {
      tripData.append('coverPhoto', this.selectedImage);
    }

    this.postsService.updateTrip(this.tripId, tripData).subscribe(
      (res) => {
        this.toastr.success('Trip updated successfully', 'Success');
        this.router.navigate(['/trips']);
      },
      (err) => {
        this.toastr.error('Trip update failed', 'Error');
      }
    );
  }
  }

   onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.selectedImage = file;
    const reader = new FileReader();
    reader.onload = () => (this.imagePreview = reader.result);
    reader.readAsDataURL(file);
  }

  onCheckedSkipImage(event: any) {
    this.trip.skipImage = event.checked;
    if(this.trip.skipImage) {
      this.imagePreview = null;
      this.selectedImage = null;
    }
  }

}
