import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { SnackbarComponent } from "@shared/components/snackbar/snackbar.component";

@Component({
  selector: "app-root",
  imports: [RouterOutlet, SnackbarComponent],
  templateUrl: "./app.html",
})
export class App {}
