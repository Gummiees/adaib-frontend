import { Article } from '../models/article';

export const articles: Article[] = [
  {
    id: 1,
    title: '🏀 Nuevo Campeonato de Baloncesto',
    subtitle:
      'El 13 de octubre se inicia un nuevo campeonato de baloncesto de empresas en Mallorca, como cada año desde el 2004',
    content: `
      <h2>Comienza un Nuevo Campeonato de Baloncesto de Empresas</h2>
      <p>El <strong>13 de octubre</strong> se inicia un nuevo campeonato de baloncesto de empresas en Mallorca, como cada año desde el <strong>2004</strong>.</p>

      <h3>🏆 Liderazgo y Compromiso</h3>
      <p>El equipo dirigido por <strong>Francisco García Morales</strong>, Presidente de la <em>ADAIB</em>, serán los encargados de hacer una vez más que el deporte del baloncesto llegue a todos aquellos aficionados que desean seguir jugando al baloncesto.</p>

      <h3>👥 Abierto para Todos</h3>
      <p>Da igual su edad, desde los 16 años en adelante, el límite lo pone, las ganas que tengas y la condición física de cada uno.</p>

      <p>Sin duda será todo un <strong>éxito</strong>, como los últimos años.</p>

      <p>Suerte a todos y a disfrutar. SEGUIMOS</p>
    `,
    imageUrl: 'assets/articles/article1_1000.webp',
    publishDate: new Date('2024-10-13'),
    author: 'Francisco García Morales',
  },
];
