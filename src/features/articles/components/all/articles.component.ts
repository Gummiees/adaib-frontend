import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CardGroupComponent } from '@shared/components/card-group/card-group.component';
import { articles } from '../../content/articles';

@Component({
  selector: 'app-articles',
  templateUrl: './articles.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CardGroupComponent],
})
export class ArticlesComponent {
  public articles = articles;
  public cards = this.articles.map((article) => ({
    id: article.id,
    title: article.title,
    subtitle: article.subtitle,
    url: 'noticias',
    imageUrl: article.imageUrl,
    imgAlt: article.imgAlt,
  }));
}
