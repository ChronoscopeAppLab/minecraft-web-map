import {useEffect, useRef, useState} from 'react';

import {Map} from './map-dom';
import SearchBox from './search-box';
import {Spot} from '../api/types';
import Drawer from './drawer';
import DetailPanel from './detail-panel';

type Props = {
  prefix: string;
};

const InfiniteMap = ({prefix}: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [map, setMap] = useState<Map | null>(null);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [description, setDescription] = useState<Pick<Spot, 'name' | 'x' | 'z' | 'detail'>>({x: 0, z: 0, name: '', detail: ''});
  const [showDescription, setShowDescription] = useState(false);
  const [isError, setIsError] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [detail, setDetail] = useState<(Partial<Spot> & Pick<Spot, 'name' | 'x' | 'z' | 'type'>) | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    const map = new Map();

    (async () => {
      const spots = await fetch('/api/points?dimen=overworld').then((resp) => resp.json());
      setSpots(spots);

      map.bind({
        perf: location.search.includes('perf'),
        canvas: canvasRef.current,
        prefix,
        spots,
        callback: {
          onHoverSpot: (spot: Spot | null) => {
            if (spot === null) {
              setShowDescription(false);
            } else {
              setDescription(spot);
              setShowDescription(true);
            }
          },
          onSelectSpot: (spot: Spot | null) => {
            if (spot === null) {
              setDetailOpen(false);
            } else {
              setDetail(spot);
              setDetailOpen(true);
            }
          },
          showError: () => setIsError(true)
        }
      });
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
      {isError && <div id="error-bar">サーバに接続できないため、一部のリソースの取得に失敗しました。</div>}

      <SearchBox spots={spots} onClickPoint={handleClickPoint} onOpenMenu={() => setMenuOpen(true)} />
      <Drawer title="Chronoscoper's World" open={menuOpen} onClose={() => setMenuOpen(false)} />
      <DetailPanel open={detailOpen} spot={detail} />

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
    </>
  );
};

export default InfiniteMap;
