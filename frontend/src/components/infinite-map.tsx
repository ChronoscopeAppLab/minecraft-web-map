import {useEffect, useRef, useState} from 'react';
import {Map} from './map-dom';

type InitialState = {
  prefix: string;
};

type Props = {
  initialState: InitialState;
};

const InfiniteMap = ({initialState}: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [map, setMap] = useState<Map | null>(null);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    const map = new Map(canvasRef.current, initialState.prefix);
    map.bind();

    setMap(map);

    return () => {
      map.unbind();
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} id="map" />
      <div id="zoom-buttons">
        <img src="/images/zoom_in.png" id="zoom-in-button" alt="+" onClick={() => map.zoomIn()} />
        <img src="/images/trip_origin.png" id="zoom-orig-button" alt="0" onClick={() => map.zoomOrig()} />
        <img src="/images/zoom_out.png" id="zoom-out-button" alt="-" onClick={() => map.zoomOut()} />
      </div>
    </>
  );
};

export default InfiniteMap;
