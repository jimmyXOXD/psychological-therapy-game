const fs = require('fs');
let code = fs.readFileSync('src/components/StrategySimulation.tsx', 'utf-8');

// Update imports
code = code.replace("import { Send, Terminal, X, RefreshCw, Trophy } from 'lucide-react';", 
"import { Send, Terminal, X, RefreshCw, Trophy, Lightbulb } from 'lucide-react';\nimport { registerWin } from '../firebase';");

// Add hint state
code = code.replace("const [evalSummary, setEvalSummary] = useState('');",
"const [evalSummary, setEvalSummary] = useState('');\n  const [latestHint, setLatestHint] = useState<string | null>(null);");

// Update handleSendMessage
const evalRegex = /if \(evalData\.unlocked && !isUnlocked\) {[\s\S]*?}/m;
const newEvalLogic = `if (evalData.unlocked && !isUnlocked) {
        setIsUnlocked(true);
        const finalSummary = evalData.summary || 'Your logic prevailed. The negative faith is broken.';
        setEvalSummary(finalSummary);
        setMessages(prev => [...prev, { role: 'model', text: '...Your logic... it holds. The barrier is broken.' }]);
        
        // Register win in Firebase
        registerWin(sessionId, worldview, finalSummary);
        
        // Trigger confetti
        const duration = 3000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };
        
        const interval: any = setInterval(function() {
          const timeLeft = animationEnd - Date.now();
          if (timeLeft <= 0) {
            return clearInterval(interval);
          }
          const particleCount = 50 * (timeLeft / duration);
          confetti(Object.assign({}, defaults, { particleCount, origin: { x: Math.random(), y: Math.random() - 0.2 } }));
        }, 250);
      } else {
        if (evalData.summary) {
          setLatestHint(evalData.summary);
        }
      }`;
code = code.replace(evalRegex, newEvalLogic);

// Add hint button to the header
const headerRegex = /<h3 className="text-orange-400 font-mono text-sm uppercase tracking-widest">Primal Actor \(\{role\}\)<\/h3>\s*<\/div>\s*<button onClick=\{\(\) => setShowChat\(false\)\}/m;
const newHeader = `<h3 className="text-orange-400 font-mono text-sm uppercase tracking-widest">Primal Actor ({role})</h3>
              </div>
              <div className="flex items-center gap-2">
                {latestHint && (
                  <button 
                    onClick={() => setMessages(prev => [...prev, { role: 'model', text: \`[Evaluator Hint]: \${latestHint}\` }])} 
                    className="text-yellow-600 hover:text-yellow-400 p-1 bg-yellow-950/30 rounded-sm border border-yellow-900/50 flex items-center gap-1 text-xs px-2"
                    title="Get a hint from the evaluator"
                  >
                    <Lightbulb className="w-4 h-4" /> Hint
                  </button>
                )}
                <button onClick={() => setShowChat(false)} className="text-orange-700 hover:text-orange-400">`;
code = code.replace(headerRegex, newHeader);

fs.writeFileSync('src/components/StrategySimulation.tsx', code);
