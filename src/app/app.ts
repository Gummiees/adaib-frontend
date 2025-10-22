import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  NgZone,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterOutlet } from '@angular/router';
import { FooterComponent } from '@features/footer/footer.component';
import { UserStore } from '@features/user/store/user-store';
import { FullScreenSpinnerComponent } from '@shared/components/full-screen-spinner/full-screen-spinner.component';
import { NavbarComponent } from '@shared/components/navbar/navbar.component';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    NavbarComponent,
    FooterComponent,
    FullScreenSpinnerComponent,
    MatSnackBarModule,
    CommonModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
})
export class App implements AfterViewInit, OnDestroy {
  public userStore = inject(UserStore);
  private zone = inject(NgZone);

  @ViewChild('navbar', { read: ElementRef })
  private navbarRef?: ElementRef<HTMLElement>;
  @ViewChild('footer', { read: ElementRef })
  private footerRef?: ElementRef<HTMLElement>;

  private navbarObserver?: ResizeObserver;
  private footerObserver?: ResizeObserver;
  private onResize = () => this.updateCssVars();

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      const navbarEl = this.navbarRef?.nativeElement;
      const footerEl = this.footerRef?.nativeElement;

      if (navbarEl) {
        this.navbarObserver = new ResizeObserver(() => this.updateCssVars());
        this.navbarObserver.observe(navbarEl);
      }

      if (footerEl) {
        this.footerObserver = new ResizeObserver(() => this.updateCssVars());
        this.footerObserver.observe(footerEl);
      }

      window.addEventListener('resize', this.onResize);
      this.updateCssVars();
    });
  }

  ngOnDestroy(): void {
    this.zone.runOutsideAngular(() => {
      this.navbarObserver?.disconnect();
      this.footerObserver?.disconnect();
      window.removeEventListener('resize', this.onResize);
    });
  }

  private updateCssVars(): void {
    const root = document.documentElement;
    const navbarH = this.navbarRef?.nativeElement?.offsetHeight ?? 0;
    const footerH = this.footerRef?.nativeElement?.offsetHeight ?? 0;
    root.style.setProperty('--navbar-h', `${navbarH}px`);
    root.style.setProperty('--footer-h', `${footerH}px`);
  }
}
