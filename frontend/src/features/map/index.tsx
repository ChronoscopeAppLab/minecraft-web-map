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

  const params = new URLSearchParams(window.location.search);
  const dimension = params.get('dimen') ?? 'overworld';

  return (
    <InfiniteMap
      prefix={initialState.prefix}
      dimension={(['overworld', 'nether', 'end'].includes(dimension) ? dimension : 'overworld') as 'overworld' | 'nether' | 'end'}
    />
  );
};

export default Map;
