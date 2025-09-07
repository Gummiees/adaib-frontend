import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CardGroupComponent } from '@shared/components/card-group/card-group.component';
import { Card } from '@shared/components/card/card';
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
  public cards: Card[] = this.articles.map<Card>((article) => ({
    id: article.id,
    title: article.title,
    subtitle: article.subtitle,
    imageUrl: article.imageUrl,
    imageAlt: 'Imagen para la noticia ' + article.title,
  }));
}
