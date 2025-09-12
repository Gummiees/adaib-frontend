import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-round-button',
  templateUrl: './round-button.component.html',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoundButtonComponent {
  public text = input.required<string>();
  public tooltip = input<string>();
  public isSelected = input<boolean>(false);
  public clicked = output<void>();

  public onRoundClick(): void {
    this.clicked.emit();
  }
}
