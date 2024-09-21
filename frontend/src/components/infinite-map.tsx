import {useEffect, useRef, useState} from 'react';

import {Map} from './map-dom';
import SearchBox from './search-box';
import {Spot} from '../api/types';

type Props = {
  prefix: string;
};

const InfiniteMap = ({prefix}: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [map, setMap] = useState<Map | null>(null);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({x: 0, z: 0});
  const [description, setDescription] = useState<Pick<Spot, 'name' | 'x' | 'z' | 'detail'>>({x: 0, z: 0, name: '', detail: ''});
  const [showDescription, setShowDescription] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    const map = new Map();

    (async () => {
      const spots = await fetch('/api/points?dimen=overworld').then((resp) => resp.json());
      setSpots(spots);

      map.setOnScaleChangeCallback(setScale);
      map.setOnCursorMoveCallback(setPos);
      map.setDescriptionCallback((spot: Spot | null) => {
        if (spot === null) {
          setShowDescription(false);
        } else {
          setDescription(spot);
          setShowDescription(true);
        }
      });

      map.bind(canvasRef.current, prefix, spots);
      setMap(map);
    })();

    return () => {
      map.unbind();
    };
  }, []);

  const handleClickPoint = (pointId: number) => {
    map?.focusPoint(pointId);
  };

  return (
    <>
      <SearchBox spots={spots} onClickPoint={handleClickPoint} />
      <canvas ref={canvasRef} id="map" />
      <div id="zoom-buttons">
        <img src="/images/zoom_in.png" id="zoom-in-button" alt="+" onClick={() => map.zoomIn()} />
        <img src="/images/trip_origin.png" id="zoom-orig-button" alt="0" onClick={() => map.zoomOrig()} />
        <img src="/images/zoom_out.png" id="zoom-out-button" alt="-" onClick={() => map.zoomOut()} />
      </div>

      <div className={`description-card ${showDescription ? '' : 'hidden'}`} id="description-card">
        <div id="description-place-name">{description.name}</div>
        <div id="description-detail">
          <div id="description-coordinate">
            X={description.x} Z={description.z}
          </div>
          <div id="description-address">{description.detail}</div>
        </div>
      </div>

      <div id="map-status">
        X={pos.x.toString()} Z={pos.z.toString()} Scale={scale.toString()}
      </div>
    </>
  );
};

export default InfiniteMap;
