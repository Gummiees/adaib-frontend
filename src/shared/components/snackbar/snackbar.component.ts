import { CommonModule } from "@angular/common";
import { Component, effect, inject } from "@angular/core";
import { Dispatcher } from "@ngrx/signals/events";
import { snackbarEvent } from "@shared/stores/snackbar/snackbar-events";
import { SnackbarStore } from "@shared/stores/snackbar/snackbar-store";

export type SnackbarType = "success" | "error" | "warning" | "info";
export interface SnackbarOptions {
  message: string;
  type?: SnackbarType;
  duration?: number;
}

@Component({
  selector: "app-snackbar",
  templateUrl: "./snackbar.component.html",
  standalone: true,
  imports: [CommonModule],
})
export class SnackbarComponent {
  snackbarStore = inject(SnackbarStore);
  private dispatcher = inject(Dispatcher);

  constructor() {
    effect(() => {
      const snackbar = this.snackbarStore.snackbar();
      if (snackbar) {
        if (snackbar.type !== "error") {
          setTimeout(() => this.hide(), snackbar.duration);
        }
      }
    });
  }

  hide(): void {
    this.dispatcher.dispatch(snackbarEvent.hide());
  }
}
