/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { InputMatrix } from './components/InputMatrix';
import { StrategySimulation } from './components/StrategySimulation';
import { Worldview } from './types';

export default function App() {
  const [worldview, setWorldview] = useState<Worldview | null>(null);

  return (
    <div className="bg-neutral-950 min-h-screen">
      {!worldview ? (
        <InputMatrix onComplete={setWorldview} />
      ) : (
        <StrategySimulation worldview={worldview} onMainMenu={() => setWorldview(null)} />
      )}
    </div>
  );
}
