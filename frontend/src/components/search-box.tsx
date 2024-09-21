import {CSSProperties, useState} from 'react';

import {Spot} from '../api/types';

type Props = {
  spots: Spot[];
  onClickPoint?: (pointId: number) => void;
};

function getIconPath(type: number, isWhite: boolean = false): string {
  if (type < 2 || 3 < type) return '/images/place.png';

  if (type === 2) {
    return isWhite ? '/images/train_white.png' : '/images/train.png';
  } else if (type === 3) {
    return isWhite ? '/images/subway_white.png' : '/images/subway.png';
  }
}

const SearchBox = ({spots, onClickPoint}: Props) => {
  const [searchMode, setSearchMode] = useState(false);
  const [query, setQuery] = useState('');

  const showSearchList = () => {
    setSearchMode(true);
  };

  const hideSearchList = () => {
    setSearchMode(false);
  };

  const updateQuery = (query: string) => {
    setQuery(query);
  };

  const searchList = spots
    .filter((spot) => query === '' || spot.name.includes(query) || spot.hira.includes(query))
    .map((spot) => {
      const itemStyle: CSSProperties = {};
      if (spot.color) {
        itemStyle.borderLeftColor = spot.color;
      }
      const handleClick = () => {
        onClickPoint?.(spot.id);
        hideSearchList();
      };
      return (
        <div key={`${spot.id}`} className="content" onClick={handleClick} style={itemStyle}>
          <div className="name">{spot.name}</div>
          <img src={getIconPath(spot.type)} className="icon" />
          <div className="detail">
            X={spot.x} Z={spot.z}
          </div>
        </div>
      );
    });

  return (
    <>
      <div id="search-bar">
        <img src="/images/menu.png" id="menu-button" className={`button ${searchMode ? 'hidden' : ''}`} />
        <img src="/images/arrow_left.png" id="search-back-button" className={`button ${searchMode ? '' : 'hidden'}`} onClick={hideSearchList} />
        <input
          id="search-box"
          type="text"
          value={query}
          placeholder="スポットの検索"
          onClick={() => showSearchList()}
          onChange={(e) => updateQuery(e.target.value)}
        />
        <img id="search-button" src="/images/search.png" alt="検索" className={`button ${query === '' ? '' : 'hidden'}`} />
        <img
          id="search-clear-button"
          src="/images/clear.png"
          onClick={() => setQuery('')}
          alt="クリア"
          className={`button ${query === '' ? 'hidden' : ''}`}
        />
      </div>

      <div id="search-panel" className={searchMode ? '' : 'hidden'}>
        <div className="top-bar"></div>
        <div id="search-list">{searchList}</div>
      </div>
    </>
  );
};

export default SearchBox;
