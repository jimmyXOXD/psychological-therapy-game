import React, { useState } from 'react';
import { Worldview, Constraint, AgentOfChange } from '../types';
import { motion } from 'motion/react';

const pairs = [
  { need: 'peace', pain: 'dissatisfaction' },
  { need: 'wonder', pain: 'disappointment' },
  { need: 'support', pain: 'loneliness' },
  { need: 'certainty', pain: 'uncertainty' },
  { need: 'hope', pain: 'physical pain' },
  { need: 'attention', pain: 'imprisonment' },
  { need: 'privacy', pain: 'change' }
];

const constraintOptions: Constraint[] = [
  'Low Environmental',
  'High Environmental',
  'Low Social',
  'High Social'
];

const agentOptions: AgentOfChange[] = [
  'lovers',
  'bosses',
  'subordinates',
  'strangers'
];

interface Props {
  onComplete: (worldview: Worldview) => void;
}

export function InputMatrix({ onComplete }: Props) {
  const [fitness, setFitness] = useState<'unallowed' | 'unfit'>('unfit');
  const [validation, setValidation] = useState<'granted' | 'validated'>('granted');
  
  const [needType, setNeedType] = useState<'need' | 'pain'>('need');
  const [pairIdx, setPairIdx] = useState<number>(0);
  
  const [constraint, setConstraint] = useState<Constraint>('High Environmental');
  const [agent, setAgent] = useState<AgentOfChange>('lovers');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedPair = pairs[pairIdx];
    onComplete({
      fitness,
      validation,
      needType,
      fundamentalNeed: selectedPair.need,
      selectedTerm: needType === 'need' ? selectedPair.need : selectedPair.pain,
      reason: constraint,
      agent
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-orange-950 flex flex-col items-center justify-center p-4 text-orange-200 font-mono"
    >
      <div className="max-w-2xl w-full bg-orange-900/40 p-8 rounded-sm border border-orange-800 shadow-2xl">
        <h1 className="text-3xl mb-8 text-center tracking-widest text-orange-400">THE INPUT MATRIX</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="text-xl leading-relaxed text-center space-y-4">
            <span>"Humans are </span>
            <select 
              value={fitness} 
              onChange={e => setFitness(e.target.value as any)}
              className="bg-orange-950 border-b-2 border-orange-500 text-orange-300 mx-2 p-1 outline-none"
            >
              <option value="unallowed">unallowed</option>
              <option value="unfit">unfit</option>
            </select>
            
            <span> to be </span>
            <select 
              value={validation} 
              onChange={e => setValidation(e.target.value as any)}
              className="bg-orange-950 border-b-2 border-orange-500 text-orange-300 mx-2 p-1 outline-none"
            >
              <option value="granted">granted</option>
              <option value="validated">validated</option>
            </select>
            
            <span> the </span>
            <select 
              value={needType} 
              onChange={e => setNeedType(e.target.value as any)}
              className="bg-orange-950 border-b-2 border-orange-500 text-orange-300 mx-2 p-1 outline-none mt-4 sm:mt-0"
            >
              <option value="need">need of</option>
              <option value="pain">pain of</option>
            </select>

            <select 
              value={pairIdx} 
              onChange={e => setPairIdx(Number(e.target.value))}
              className="bg-orange-950 border-b-2 border-orange-500 text-orange-300 mx-2 p-1 outline-none mt-4 sm:mt-0"
            >
              {pairs.map((p, idx) => (
                <option key={idx} value={idx}>
                  {needType === 'need' ? p.need : p.pain}
                </option>
              ))}
            </select>
            
            <br />
            <span className="mt-4 block sm:inline">because of </span>
            <select 
              value={constraint} 
              onChange={e => setConstraint(e.target.value as any)}
              className="bg-orange-950 border-b-2 border-orange-500 text-orange-300 mx-2 p-1 outline-none mt-2 sm:mt-0"
            >
              {constraintOptions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <span> pressure from </span>
            <select 
              value={agent} 
              onChange={e => setAgent(e.target.value as any)}
              className="bg-orange-950 border-b-2 border-orange-500 text-orange-300 mx-2 p-1 outline-none mt-2 sm:mt-0"
            >
              {agentOptions.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
            <span>"</span>
          </div>

          <div className="pt-8 flex justify-center">
            <button 
              type="submit"
              className="px-8 py-3 bg-orange-800 hover:bg-orange-700 text-orange-100 transition-colors uppercase tracking-widest border border-orange-600 cursor-pointer"
            >
              Initialize Simulation
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
