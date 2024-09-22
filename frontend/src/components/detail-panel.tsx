import {Spot} from '../api/types';

type Props = {
  open?: boolean | undefined;
  spot: (Partial<Spot> & Pick<Spot, 'name' | 'x' | 'z' | 'type'>) | null;
};

const shouldBeWhiteText = (hexcolor: string): boolean => {
  var r = parseInt(hexcolor.substring(1, 2), 16);
  var g = parseInt(hexcolor.substring(3, 2), 16);
  var b = parseInt(hexcolor.substring(5, 2), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 20;
};

const DetailPanel = ({open, spot}: Props) => {
  return (
    <div className={`compact-detail-panel no-image ${open ? '' : 'hidden'}`} id="detail-panel">
      <div
        id="detail-panel-overview"
        style={{
          backgroundColor: spot?.color ?? 'rgb(0, 98, 255)',
          color: spot?.color ? (shouldBeWhiteText(spot.color) ? '#fff' : '#000') : '#fff'
        }}
      >
        <div id="detail-panel-title">{spot?.name}</div>
        <div id="detail-panel-subtitle">
          X={spot?.x}, Z={spot?.z}
        </div>
      </div>
      <div id="detail-panel-detail">{spot?.detail}</div>
    </div>
  );
};

export default DetailPanel;
