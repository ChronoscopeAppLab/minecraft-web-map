import {useEffect, useState} from 'react';

import InfiniteMap from '../../components/infinite-map';

const Map = () => {
  const [initialState, setInitialState] = useState(null);

  useEffect(() => {
    (async () => {
      const initialStateData = await fetch('/api/initial_state.json').then((resp) => resp.json());
      setInitialState(initialStateData);
    })();
  }, []);

  if (!initialState) {
    return <div>Loading...</div>;
  }

  return <InfiniteMap initialState={initialState} />;
};

export default Map;
