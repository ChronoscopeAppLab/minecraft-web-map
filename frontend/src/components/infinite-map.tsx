import {useRef, useEffect} from 'react';
import {initializeMap} from './map-dom';

type InitialState = {
  prefix: string;
};

type Props = {
  initialState: InitialState;
};

const InfiniteMap = ({initialState}: Props) => {
  const mapRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    initializeMap(mapRef.current, initialState.prefix);
  }, []);

  return <canvas ref={mapRef} id="map" />;
};

export default InfiniteMap;
