import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { articles } from '../../content/articles';

@Component({
  selector: 'app-articles',
  templateUrl: './articles.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink],
})
export class ArticlesComponent {
  public articles = articles;
}
