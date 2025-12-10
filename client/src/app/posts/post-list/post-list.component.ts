import {
  Component,
  OnInit,
  Input,
  ViewChild,
  ElementRef,
  OnDestroy
} from '@angular/core';
import { Post } from '../../models/post.model';
import { PostsService } from '../../services/posts.service';
import { PageEvent } from '@angular/material/paginator';
import { ActivatedRoute } from '@angular/router';
import Swal from 'sweetalert2';
import { DownloadService } from 'src/app/services/download.service';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-post-list',
  templateUrl: './post-list.component.html',
  styleUrls: ['./post-list.component.scss']
})
export class PostListComponent implements OnInit, OnDestroy {

  @Input() postListArray: Post[] = [];
  @ViewChild('postListSection') postListSection!: ElementRef;

  totalPosts = 0;
  pageSize = 12;
  pageSizeOptions = [12, 24, 36, 48];
  filteredPageSizeOptions: number[] = [];
  currentPage = 0;
  paginatedPosts: Post[] = [];
  tripId: string | null = null;
  tripName: string | null = null;

  private downloadSubscription: any;

  constructor(
    private postsService: PostsService,
    private route: ActivatedRoute,
    private downloadService: DownloadService
  ) {}

  ngOnInit(): void {
    const nav = history.state;
    if( nav && nav.tripName) {
      this.tripName = nav.tripName.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');;
    }

    this.route.paramMap.subscribe((paramMap) => {
      this.tripId = paramMap.get('tripId');
      this.fetchPosts();
    });

    this.downloadSubscription = this.downloadService.download$.subscribe(() => {
      this.downloadPosts();
    });

  }

  ngOnDestroy(): void {
    if (this.downloadSubscription) {
      this.downloadSubscription.unsubscribe();
    }
  }

  fetchPosts() {
    if (!this.tripId) {
      this.postListArray = [];
      this.paginatedPosts = [];
      this.totalPosts = 0;
      return;
    }

    this.postsService.getPostsByTripId(this.tripId).subscribe((data) => {
      this.postListArray = data.posts || [];
      this.totalPosts = this.postListArray.length;
      console.log('postlist array', this.postListArray);
      this.updatePaginatedPosts();
      this.disablePageSizeOptions();
    });
  }

  deletePost(postId: string) {
    Swal.fire({
      title: 'Are you sure?',
      text: 'This post will be permanently deleted!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#4a6cf7',
      cancelButtonColor: '#f28b82'
    }).then((result) => {
      if (result.isConfirmed) {
        this.postsService.deletePost(postId).subscribe(() => {
          this.postListArray = this.postListArray.filter(
            (post) => post.id !== postId
          );
          this.totalPosts = this.postListArray.length;

          this.updatePaginatedPosts();
          this.disablePageSizeOptions();

          Swal.fire('Deleted!', 'The post has been deleted.', 'success');
        });
      }
    });
  }

  onChangePage(event: PageEvent) {
    if (event.pageSize !== this.pageSize) {
      this.pageSize = event.pageSize;
      this.currentPage = 0;
    } else {
      this.currentPage = event.pageIndex;
    }
    this.updatePaginatedPosts();
  }

  updatePaginatedPosts() {
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedPosts = this.postListArray.slice(startIndex, endIndex);
  }

  disablePageSizeOptions() {
    const idealMaxOption = this.pageSizeOptions.find(
      (option) => option >= this.totalPosts
    );

    if (this.totalPosts < 5) {
      this.filteredPageSizeOptions = [this.totalPosts];
    } else if (idealMaxOption) {
      this.filteredPageSizeOptions = this.pageSizeOptions.filter(
        (option) => option <= idealMaxOption
      );
    } else {
      this.filteredPageSizeOptions = [...this.pageSizeOptions];
    }

    if (
      this.pageSize > this.totalPosts ||
      !this.filteredPageSizeOptions.includes(this.pageSize)
    ) {
      this.pageSize = this.filteredPageSizeOptions[0] || this.totalPosts;
    }
  }

  convertToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
    });
  }

  async downloadPosts() {
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
  
    const margin = 10;
    const colWidth = (pageWidth - margin * 3) / 2;
    const imageHeight = 35;
    const lineHeight = 4;
    const bottomPadding = 6;
  
    let y = margin;
  
    for (let i = 0; i < this.postListArray.length; i += 2) {
      const leftPost = this.postListArray[i];
      const rightPost = this.postListArray[i + 1];
  
      const computeHeight = async (post: any) => {
        if (!post) return 0;
        let imgData: string | undefined;
        if (post.image instanceof File) imgData = await this.convertToBase64(post.image);
        else if (typeof post.image === "string") imgData = post.image;
        const caption = post.caption || "";
        const wrapped = pdf.splitTextToSize(caption, colWidth - 10);
        const captionHeight = wrapped.length * lineHeight;
        return imageHeight + 30 + captionHeight + bottomPadding + 10;
      };
  
      const leftHeight = await computeHeight(leftPost);
      const rightHeight = await computeHeight(rightPost);
  
      const rowHeight = Math.max(leftHeight, rightHeight);
  
      if (y + rowHeight > pageHeight - margin) {
        pdf.addPage();
        y = margin;
      }
  
      const drawCard = async (post: any, x: number, cardHeight: number) => {
        if (!post) return;
  
        let imgData: string | undefined;
        if (post.image instanceof File) imgData = await this.convertToBase64(post.image);
        else if (typeof post.image === "string") imgData = post.image;
  
        pdf.setDrawColor(180);
        pdf.setLineWidth(0.4);
        pdf.roundedRect(x, y, colWidth, cardHeight, 3, 3);
  
        if (imgData) {
          try {
            pdf.addImage(imgData, "JPEG", x + 5, y + 5, colWidth - 10, imageHeight);
          } catch {
            pdf.text("Image load failed", x + 5, y + 10);
          }
        } else {
          pdf.text("No Image Added", x + colWidth / 2, y + imageHeight / 2 + 5, { align: "center" });
        }
  
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "bold");
        pdf.text(post.title || "Untitled", x + 5, y + imageHeight + 15);
  
        const caption = post.caption || "";
        const wrapped = pdf.splitTextToSize(caption, colWidth - 10);
  
        pdf.setFontSize(10);
        let captionY = y + imageHeight + 25;
  
        wrapped.forEach((line: string) => {
          pdf.text(line, x + 5, captionY);
          captionY += lineHeight;
        });
  
        if (post.date) {
          pdf.setFontSize(9);
          const dateY = captionY + bottomPadding;
          pdf.text(`Date: ${new Date(post.date).toDateString()}`, x + 5, dateY);
        }
      };
  
      await drawCard(leftPost, margin, leftHeight);
      await drawCard(rightPost, margin * 2 + colWidth, rightHeight);
  
      y += rowHeight + margin;
    }
  
    pdf.save(`posts-${this.tripName}.pdf`);
  }    
  
}
