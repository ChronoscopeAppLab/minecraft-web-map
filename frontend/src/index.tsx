import {StrictMode} from 'react';

import {createRoot} from 'react-dom/client';

import Map from './features/map';

import './ui/css/style.scss';

(() => {
  const root = createRoot(document.getElementById('app')!);
  root.render(
    <StrictMode>
      <Map />
    </StrictMode>
  );
})();
