import {useEffect, useState} from 'react';

import InfiniteMap from '../../components/infinite-map';
import {InitialState} from '../../api/types';

const Map = () => {
  const [initialState, setInitialState] = useState<InitialState | null>(null);

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
  const dimension = params.get('dim') ?? 'overworld';

  return (
    <InfiniteMap
      prefix={initialState.prefix}
      dimension={(['overworld', 'nether', 'end'].includes(dimension) ? dimension : 'overworld') as 'overworld' | 'nether' | 'end'}
    />
  );
};

export default Map;
