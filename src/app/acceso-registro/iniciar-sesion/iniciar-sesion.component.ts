import { Component, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { timeout, catchError, throwError } from 'rxjs';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-iniciar-sesion',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './iniciar-sesion.component.html',
})
export class IniciarSesionComponent {
  form: FormGroup;
  loading = false;
  serverError = '';

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {
    this.form = this.fb.group({
      email:    ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  get email()    { return this.form.get('email')!; }
  get password() { return this.form.get('password')!; }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.serverError = '';

    this.auth.login(this.form.value).pipe(
      timeout(10_000),
      catchError(err => {
        if (err.name === 'TimeoutError') {
          return throwError(() => ({ error: { detail: 'El servidor no responde. Verifica tu conexión.' } }));
        }
        return throwError(() => err);
      }),
    ).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/app/dashboard']);
      },
      error: (err) => {
        this.serverError = err.error?.detail ?? 'Credenciales incorrectas.';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }
}
