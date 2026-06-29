import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { Observable } from 'rxjs';
import { News } from '../models/news';

@Injectable({ providedIn: 'root' })
export class NewsService {
  private http = inject(HttpClient);

  // Backend contract: persist News in a `news` table with id, title, subtitle,
  // sanitized HTML content, and an `event` flag (0 = news, 1 = event page item).
  // Media are external URLs only, not uploaded files.
  getAllNews(): Observable<News[]> {
    return this.http.get<News[]>(`${environment.apiUrl}/News/all`);
  }

  getNewsByEvent(event: 0 | 1): Observable<News[]> {
    return this.http.get<News[]>(`${environment.apiUrl}/News/all`, {
      params: { event },
    });
  }

  getNews(id: number): Observable<News> {
    return this.http.get<News>(`${environment.apiUrl}/News/${id}`);
  }

  addNews(news: News): Observable<number> {
    return this.http.post<number>(`${environment.apiUrl}/News`, news);
  }

  updateNews(news: News): Observable<void> {
    return this.http.put<void>(`${environment.apiUrl}/News`, news);
  }

  deleteNews(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/News/${id}`);
  }
}
