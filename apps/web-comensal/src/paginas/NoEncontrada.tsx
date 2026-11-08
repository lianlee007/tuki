import { Link } from 'react-router-dom';
import { Cabecera } from '@tuki/ui-kit';

export const NoEncontrada = () => (
  <>
    <Cabecera />
    <main className="tuki-main">
      <h1 className="tuki-titulo">Esa página no existe</h1>
      <p className="tuki-subtitulo">
        Vuelve al <Link to="/">buscador de restaurantes</Link>.
      </p>
    </main>
  </>
);
