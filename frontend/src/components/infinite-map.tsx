import {useRef, useEffect} from 'react';
import { initializeMap } from './map-dom';

type Props = {};

const InfiniteMap = ({}: Props) => {
  const mapRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    initializeMap(mapRef.current);
  }, []);

  return <canvas ref={mapRef} id="map" />;
};

export default InfiniteMap;
