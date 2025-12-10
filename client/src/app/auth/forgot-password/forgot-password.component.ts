import { Component, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ForgotPasswordComponent {
  email: string = '';
  validEmail: boolean | null = null;
  emailNotFound: boolean = false;

  registeredEmails: string[] = [];

  constructor(private router: Router) {}

  validateEmail() {
    const regex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    this.validEmail = regex.test(this.email);
  }

  resetEmail() {
    this.validEmail = null;
    this.emailNotFound = false;
  }

  onSubmit() {
    if (!this.registeredEmails.includes(this.email)) {
      this.emailNotFound = true;
      return;
    }

    alert(`Password reset link sent to ${this.email}`);
    this.navigateToLogin();
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }
}
