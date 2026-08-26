import React, { useState } from 'react';
import { Worldview, ChatMessage } from '../types';
import { GameCanvas } from './GameCanvas';
import { motion } from 'motion/react';
import { Send, Terminal, X, RefreshCw, Trophy, Lightbulb } from 'lucide-react';
import confetti from 'canvas-confetti';
import { registerWin, logTelemetry } from '../firebase';

interface Props {
  worldview: Worldview;
}

export function StrategySimulation({ worldview }: Props) {
  const [sessionId] = useState(() => Math.random().toString(36).substring(7));
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [evalSummary, setEvalSummary] = useState('');
  const [latestHint, setLatestHint] = useState<string | null>(null);
  
  // Custom mechanisms for debate attempts & special items
  const [debateAttempt, setDebateAttempt] = useState(1);
  const [promptsSentInAttempt, setPromptsSentInAttempt] = useState(0);
  const [collectedItems, setCollectedItems] = useState<boolean[]>([false, false, false]);
  const [hasPresentedStoryForAttempt, setHasPresentedStoryForAttempt] = useState<Record<number, boolean>>({});

  const singularAgent: Record<string, string> = { 'enemies': 'enemy', 'lovers': 'lover', 'bosses': 'boss', 'subordinates': 'subordinate', 'strangers': 'stranger', 'self': 'self' };
  const role = singularAgent[worldview.agent] || worldview.agent;

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([{
    role: 'model',
    text: `I am your ${role}. You will not pass. It is decided: Humans are ${worldview.fitness} to be ${worldview.validation} the ${worldview.needType} of ${worldview.selectedTerm} because of ${worldview.reason}.`
  }]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Trigger special story by presenting the item
  const triggerSpecialStory = async (attempt: number) => {
    if (hasPresentedStoryForAttempt[attempt]) return;
    setHasPresentedStoryForAttempt(prev => ({ ...prev, [attempt]: true }));
    setIsTyping(true);

    let itemText = '';
    let storyType = '';
    if (attempt === 2) {
      itemText = '*You present the Shattered Mirror of the Past*';
      storyType = 'traumatic';
    } else if (attempt === 3) {
      itemText = '*You present the Emblem of the Defiant*';
      storyType = 'success';
    } else if (attempt === 4) {
      itemText = '*You present the Extinction Ledger*';
      storyType = 'extinction';
    }

    const tempMessages = [...messages, { role: 'user', text: itemText }];
    setMessages(tempMessages);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          worldview,
          history: messages,
          message: itemText,
          specialItemStoryType: storyType
        })
      });
      const data = await res.json();
      if (res.ok) {
        setMessages([...tempMessages, { role: 'model', text: data.text }]);
      } else {
        setMessages([...tempMessages, { role: 'model', text: `[System Error]: ${data.error || 'Failed to trigger special story.'}` }]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  React.useEffect(() => {
    if (showChat && debateAttempt > 1 && !hasPresentedStoryForAttempt[debateAttempt]) {
      triggerSpecialStory(debateAttempt);
    }
  }, [showChat, debateAttempt]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isTyping) return;

    const newMessages: ChatMessage[] = [...messages, { role: 'user', text: inputText }];
    setMessages(newMessages);
    setInputText('');
    setIsTyping(true);

    const nextPromptsCount = promptsSentInAttempt + 1;
    setPromptsSentInAttempt(nextPromptsCount);

    try {
      const chatRes = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          worldview: worldview,
          history: messages,
          message: inputText
        })
      });
      const chatData = await chatRes.json();
      
      let updatedMessages: ChatMessage[] = newMessages;
      if (!chatRes.ok) {
        updatedMessages = [...newMessages, { role: 'model', text: `[System Error]: ${chatData.error || 'Unknown error. Please check API keys.'}` }];
      } else {
        updatedMessages = [...newMessages, { role: 'model', text: chatData.text }];
      }
      setMessages(updatedMessages);

      const evalRes = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatLog: updatedMessages,
          worldview: worldview
        })
      });
      const evalData = await evalRes.json();
      
      if (evalData.unlocked && !isUnlocked) {
        setIsUnlocked(true);
        const finalSummary = evalData.summary || 'Your logic prevailed. The negative faith is broken.';
        setEvalSummary(finalSummary);
        setMessages(prev => [...prev, { role: 'model', text: '...Your logic... it holds. The barrier is broken.' }]);
        
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

        // Check if player has run out of turns in this attempt
        if (nextPromptsCount >= 5) {
          const nextAttempt = debateAttempt + 1;
          if (nextAttempt >= 5) {
            // Out of attempts entirely - Game Over!
            setMessages(prev => [...prev, { role: 'model', text: '[System Message]: You have failed to win the debate after the final attempt. Despair claims you...' }]);
            setTimeout(() => {
              setIsGameOver(true);
              setShowChat(false);
            }, 3500);
          } else {
            const itemNames = ["Shattered Mirror of the Past", "Emblem of the Defiant", "Extinction Ledger"];
            const nextItemName = itemNames[nextAttempt - 2];
            setMessages(prev => [...prev, { 
              role: 'model', 
              text: `[System Message]: This attempt has ended. You failed to break the Primal Actor's faith. Return to the forest and find the "${nextItemName}" to unlock the next debate.` 
            }]);
            setTimeout(() => {
              setShowChat(false);
              setDebateAttempt(nextAttempt);
              setPromptsSentInAttempt(0);
            }, 4500);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleCloseChat = () => {
    if (promptsSentInAttempt < 5) {
      logTelemetry(sessionId, 'surrender', { reason: 'closed_chat_early' });
    }
    setShowChat(false);
    const nextAttempt = debateAttempt + 1;
    if (nextAttempt >= 5) {
      setIsGameOver(true);
    } else {
      setDebateAttempt(nextAttempt);
      setPromptsSentInAttempt(0);
      const itemNames = ["Shattered Mirror of the Past", "Emblem of the Defiant", "Extinction Ledger"];
      setMessages(prev => [...prev, {
        role: 'model',
        text: `[System Message]: You closed the chat. This attempt has ended. Seek and collect the "${itemNames[nextAttempt - 2]}" in the forest to continue.`
      }]);
    }
  };

  const handleCollectSpecialItem = (itemIndex: number) => {
    setCollectedItems(prev => {
      const updated = [...prev];
      updated[itemIndex] = true;
      return updated;
    });
  };

  const handleGameOver = () => {
    setIsGameOver(true);
    setShowChat(false);
  };

  return (
    <div className="w-full h-screen relative bg-black overflow-hidden font-mono text-orange-200 selection:bg-orange-900">
      <GameCanvas 
        worldview={worldview} 
        sessionId={sessionId}
        isUnlocked={isUnlocked}
        isPaused={showChat || isGameOver || isUnlocked}
        onInteractPrimal={() => setShowChat(true)}
        onGameOver={handleGameOver}
        debateAttempt={debateAttempt}
        onCollectSpecialItem={handleCollectSpecialItem}
        collectedItems={collectedItems}
      />

      {isGameOver && !isUnlocked && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="flex flex-col items-center gap-6 max-w-lg text-center p-8 border border-red-900/50 bg-neutral-950 rounded-sm shadow-2xl shadow-red-900/20">
            <h2 className="text-3xl font-bold text-red-500 uppercase tracking-widest">Despair Claimed You</h2>
            <p className="text-neutral-400 text-sm leading-relaxed">
              You succumbed to the pressures of reality before you could dismantle the negative faith. The meaning of life remains unfulfilled.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-6 py-3 bg-red-950 hover:bg-red-900 text-red-300 transition-colors border border-red-800 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Try Again
            </button>
          </div>
        </div>
      )}

      {isUnlocked && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="flex flex-col items-center gap-6 max-w-2xl text-center p-8 border border-green-900/50 bg-neutral-950 rounded-sm shadow-2xl shadow-green-900/20">
            <Trophy className="w-16 h-16 text-green-500" />
            <h2 className="text-3xl font-bold text-green-500 uppercase tracking-widest">Faith Dismantled</h2>
            <p className="text-green-300 font-bold">
              Congratulations! You successfully resolved the negative faith.
            </p>
            <div className="bg-black/50 p-6 rounded-sm border border-green-900/30 text-left text-sm text-neutral-300 leading-relaxed">
              <span className="text-green-500 font-bold block mb-2 uppercase text-xs tracking-wider">Evaluator Summary:</span>
              {evalSummary}
            </div>
            <div className="flex gap-4 w-full mt-4">
              <button 
                onClick={() => {
                  const chatText = messages.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n\n');
                  navigator.clipboard.writeText(chatText);
                  alert('Chat copied to clipboard!');
                }}
                className="flex-1 px-6 py-3 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 transition-colors border border-neutral-700 flex items-center justify-center gap-2"
              >
                Copy Chat
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="flex-1 px-6 py-3 bg-green-950 hover:bg-green-900 text-green-300 transition-colors border border-green-800 flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Start New Simulation
              </button>
            </div>
          </div>
        </div>
      )}
      {showChat && !isGameOver && !isUnlocked && (
        <div 
          className="absolute inset-0 z-50 bg-cover bg-center flex items-center justify-start p-8"
          style={{ backgroundImage: `url('/debate_background.jfif')` }}
        >
          <div className="w-full max-w-lg bg-neutral-950/80 backdrop-blur-md border border-orange-900/50 rounded-sm shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-orange-900/50 bg-black/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Terminal className="text-orange-500 w-5 h-5" />
                <h3 className="text-orange-400 font-mono text-sm uppercase tracking-widest">Primal Actor ({role})</h3>
              </div>
              <div className="flex items-center gap-3">
                {latestHint && (
                  <button 
                    onClick={() => setMessages(prev => [...prev, { role: 'model', text: `[Evaluator Hint]: ${latestHint}` }])} 
                    className="text-yellow-600 hover:text-yellow-400 p-1 bg-yellow-950/30 rounded-sm border border-yellow-900/50 flex items-center gap-1 text-xs px-2 cursor-pointer"
                    title="Get a hint from the evaluator"
                  >
                    <Lightbulb className="w-4 h-4" /> Hint
                  </button>
                )}
                <button onClick={handleCloseChat} className="text-orange-700 hover:text-orange-400 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Subheader tracking debate attempt stats & relics */}
            <div className="px-4 py-2 bg-neutral-950 border-b border-orange-900/30 flex items-center justify-between text-xs font-mono text-neutral-400">
              <div className="flex gap-4">
                <span>Debate Attempt: <strong className="text-orange-400">{debateAttempt} of 4</strong></span>
                <span>Prompts remaining: <strong className="text-orange-400">{5 - promptsSentInAttempt}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span>Relics used:</span>
                <span className={`w-2.5 h-2.5 rounded-full ${collectedItems[0] ? 'bg-red-500 shadow shadow-red-500' : 'bg-neutral-800 border border-neutral-700'}`} title="Shattered Mirror of the Past (Traumatic Past Story)" />
                <span className={`w-2.5 h-2.5 rounded-full ${collectedItems[1] ? 'bg-yellow-500 shadow shadow-yellow-500' : 'bg-neutral-800 border border-neutral-700'}`} title="Emblem of the Defiant (Heresy Story)" />
                <span className={`w-2.5 h-2.5 rounded-full ${collectedItems[2] ? 'bg-purple-500 shadow shadow-purple-500' : 'bg-neutral-800 border border-neutral-700'}`} title="Extinction Ledger (Inevitable Extinction Speculation)" />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
              {messages.map((msg, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={idx} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] p-4 rounded-sm ${
                    msg.role === 'user' 
                      ? 'bg-orange-950/50 text-orange-200 border border-orange-800/50' 
                      : msg.text.startsWith('[Evaluator Hint]') 
                        ? 'bg-yellow-950/30 text-yellow-300 border border-yellow-900/50 font-sans'
                        : 'bg-neutral-950 text-neutral-300 border border-neutral-800'
                  }`}>
                    {msg.text}
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-neutral-950 text-neutral-600 p-4 rounded-sm border border-neutral-800 animate-pulse">
                    ...
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSendMessage} className="p-4 border-t border-orange-900/50 bg-black/50 flex gap-3">
              <input 
                type="text" 
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                className="flex-1 bg-neutral-950 border border-neutral-800 p-3 text-orange-200 font-mono text-sm outline-none focus:border-orange-500 transition-colors placeholder:text-neutral-700"
                placeholder="Argue your counter-logic..."
              />
              <button 
                type="submit"
                disabled={isTyping}
                className="px-6 bg-orange-950 hover:bg-orange-900 text-orange-400 transition-colors border border-orange-800 disabled:opacity-50 cursor-pointer flex items-center justify-center"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
