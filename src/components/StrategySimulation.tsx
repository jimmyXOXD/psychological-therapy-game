import React, { useState } from 'react';
import { Worldview, ChatMessage } from '../types';
import { GameCanvas } from './GameCanvas';
import { motion } from 'motion/react';
import { Send, Terminal, X, RefreshCw, Trophy, Lightbulb, Eye, EyeOff, Check, Copy, Compass } from 'lucide-react';
import confetti from 'canvas-confetti';
import { registerWin, logTelemetry } from '../firebase';
import { t, getLocale } from '../locales/i18n';

interface Props {
  worldview: Worldview;
  onMainMenu?: () => void;
}

export function StrategySimulation({ worldview, onMainMenu }: Props) {
  const [sessionId, setSessionId] = useState(() => Math.random().toString(36).substring(7));
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [evalSummary, setEvalSummary] = useState('');
  const [latestHint, setLatestHint] = useState<string | null>(null);
  const [requestedHints, setRequestedHints] = useState<{ attempt: number; turn: number; hint: string }[]>([]);
  const [isCopied, setIsCopied] = useState(false);
  
  // Custom mechanisms for debate attempts & special items
  const [debateAttempt, setDebateAttempt] = useState(1);
  const [promptsSentInAttempt, setPromptsSentInAttempt] = useState(0);
  const [collectedItems, setCollectedItems] = useState<boolean[]>([false, false, false]);
  const [hasPresentedStoryForAttempt, setHasPresentedStoryForAttempt] = useState<Record<number, boolean>>({});

  const singularAgent: Record<string, string> = { 'lovers': 'lover', 'bosses': 'boss', 'subordinates': 'subordinate', 'strangers': 'stranger' };
  const role = singularAgent[worldview.agent] || worldview.agent;

  const getInitialArgument = (agentRole: string, wv: Worldview) => {
    const localizedRole = t(`simulation.agentRole.${agentRole}`);

    const needGoal = wv.needType === 'need'
      ? t('simulation.needGoal.need', { term: wv.selectedTerm })
      : t('simulation.needGoal.pain', { term: wv.selectedTerm });

    const coreBelief = wv.fitness === 'unallowed'
      ? t('simulation.coreBelief.unallowed', { needGoal })
      : t('simulation.coreBelief.unfit', { needGoal });

    const outcomeBelief = wv.validation === 'granted'
      ? t('simulation.outcomeBelief.granted')
      : t('simulation.outcomeBelief.validated');

    const pressureKeyMap: Record<string, string> = {
      'Low Environmental': 'simulation.pressureContext.lowEnvironmental',
      'High Environmental': 'simulation.pressureContext.highEnvironmental',
      'Low Social': 'simulation.pressureContext.lowSocial',
      'High Social': 'simulation.pressureContext.highSocial'
    };
    const pressureKey = pressureKeyMap[wv.reason];
    const pressureContext = pressureKey
      ? t(pressureKey)
      : t('simulation.pressureContext.default', { reason: wv.reason.toLowerCase() });

    return t('simulation.initialArgument', {
      agentRole: localizedRole,
      coreBelief,
      pressureContext,
      outcomeBelief
    });
  };

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([{
    role: 'model',
    text: getInitialArgument(role, worldview)
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
      itemText = t('simulation.itemPresentation.mirror');
      storyType = 'traumatic';
    } else if (attempt === 3) {
      itemText = t('simulation.itemPresentation.emblem');
      storyType = 'success';
    } else if (attempt === 4) {
      itemText = t('simulation.itemPresentation.ledger');
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
          specialItemStoryType: storyType,
          language: worldview.language || getLocale()
        })
      });
      const data = await res.json();
      if (res.ok) {
        setMessages([...tempMessages, { role: 'model', text: data.text }]);
      } else {
        setMessages([...tempMessages, { role: 'model', text: data.error ? `[System Error]: ${data.error}` : t('simulation.errorSpecialStory') }]);
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
          message: inputText,
          language: worldview.language || getLocale()
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
          worldview: worldview,
          language: worldview.language || getLocale()
        })
      });
      const evalData = await evalRes.json();
      const activeLocale = worldview.language || getLocale();
      
      if (evalData.unlocked && !isUnlocked) {
        setIsUnlocked(true);
        const finalSummary = evalData.summary || t('simulation.defaultVictorySummary');
        setEvalSummary(finalSummary);
        setMessages(prev => [...prev, { role: 'model', text: t('simulation.barrierBroken') }]);
        
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
            setMessages(prev => [...prev, { role: 'model', text: t('simulation.gameOverDespair') }]);
            setTimeout(() => {
              setIsGameOver(true);
              setShowChat(false);
            }, 3500);
          } else {
            const itemKeys = ['simulation.item.mirror', 'simulation.item.emblem', 'simulation.item.ledger'];
            const nextItemName = t(itemKeys[nextAttempt - 2]);
            setMessages(prev => [...prev, { 
              role: 'model', 
              text: t('simulation.attemptEnded', { nextItemName }) 
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
      const itemKeys = ['simulation.item.mirror', 'simulation.item.emblem', 'simulation.item.ledger'];
      const nextItemName = t(itemKeys[nextAttempt - 2]);
      setMessages(prev => [...prev, {
        role: 'model',
        text: t('simulation.chatClosed', { nextItemName })
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

  const handleMainMenu = () => {
    if (onMainMenu) {
      onMainMenu();
    } else {
      window.location.reload();
    }
  };

  const handleRestartScenario = () => {
    setSessionId(Math.random().toString(36).substring(7));
    setIsGameOver(false);
    setIsUnlocked(false);
    setShowChat(false);
    setIsChatMinimized(false);
    setDebateAttempt(1);
    setPromptsSentInAttempt(0);
    setCollectedItems([false, false, false]);
    setHasPresentedStoryForAttempt({});
    setEvalSummary('');
    setLatestHint(null);
    setRequestedHints([]);
    setIsCopied(false);
    setMessages([{
      role: 'model',
      text: getInitialArgument(role, worldview)
    }]);
    setInputText('');
    setIsTyping(false);
  };

  return (
    <div 
      dir={getLocale() === 'he' ? 'rtl' : 'ltr'}
      className="w-full h-screen relative bg-black overflow-hidden font-mono text-orange-200 selection:bg-orange-900"
    >
      <GameCanvas 
        key={sessionId}
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
            <div className="flex flex-col sm:flex-row gap-3 w-full mt-4">
              <button 
                onClick={handleRestartScenario}
                className="flex-1 px-5 py-3 bg-red-950 hover:bg-red-900 text-red-300 transition-colors border border-red-800 flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm font-mono font-bold"
                title="Restart this scenario with the current worldview"
              >
                <RefreshCw className="w-4 h-4" /> Try Again
              </button>
              <button 
                onClick={handleMainMenu}
                className="flex-1 px-5 py-3 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors border border-neutral-700 hover:border-neutral-500 flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm font-mono"
                title="Return to the Input Matrix to select a new faith"
              >
                <Compass className="w-4 h-4" /> Main Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {isUnlocked && (
        <div className="absolute inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="flex flex-col items-center gap-5 max-w-2xl w-full text-center p-6 sm:p-8 border border-green-800/60 bg-neutral-950 rounded-sm shadow-2xl shadow-green-950/40 max-h-[92vh] overflow-y-auto">
            <div className="relative">
              <div className="absolute -inset-2 bg-green-500/20 blur-xl rounded-full pointer-events-none" />
              <Trophy className="w-16 h-16 text-green-400 relative drop-shadow-[0_0_15px_rgba(74,222,128,0.5)] animate-pulse" />
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-green-400 uppercase tracking-widest font-mono">
                Faith Dismantled
              </h2>
              <p className="text-green-300 font-mono text-sm mt-1">
                Congratulations! You successfully resolved the negative faith.
              </p>
            </div>

            {/* Worldview Badge Details */}
            <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono text-neutral-400">
              <span className="px-2.5 py-1 bg-neutral-900 border border-neutral-800 rounded-sm">
                Topic: <strong className="text-neutral-200">{worldview.selectedTerm}</strong> ({worldview.needType})
              </span>
              <span className="px-2.5 py-1 bg-neutral-900 border border-neutral-800 rounded-sm">
                Opponent: <strong className="text-neutral-200">{role}</strong>
              </span>
              <span className="px-2.5 py-1 bg-neutral-900 border border-neutral-800 rounded-sm">
                Constraint: <strong className="text-neutral-200">{worldview.reason}</strong>
              </span>
              <span className="px-2.5 py-1 bg-neutral-900 border border-neutral-800 rounded-sm">
                Debate Attempts: <strong className="text-neutral-200">{debateAttempt}/4</strong>
              </span>
            </div>

            {/* Evaluator Summary */}
            <div className="w-full bg-black/60 p-4 sm:p-5 rounded-sm border border-green-900/40 text-left text-xs sm:text-sm text-neutral-300 leading-relaxed font-mono">
              <span className="text-green-400 font-bold flex items-center gap-1.5 uppercase text-[11px] tracking-wider mb-2">
                <Terminal className="w-3.5 h-3.5" /> Evaluator Summary:
              </span>
              <p className="text-neutral-200">{evalSummary || 'Your logic prevailed. The negative faith is broken.'}</p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 w-full mt-2 font-mono">
              <button 
                onClick={async () => {
                  const allHintsList: string[] = [];
                  requestedHints.forEach(h => {
                    if (!allHintsList.includes(h.hint)) allHintsList.push(h.hint);
                  });
                  messages.forEach(m => {
                    if (m.text.startsWith('[Evaluator Hint]:')) {
                      const clean = m.text.replace('[Evaluator Hint]:', '').trim();
                      if (!allHintsList.includes(clean)) allHintsList.push(clean);
                    }
                  });

                  const header = [
                    `==================================================`,
                    `THE RABBIT HOLE - DEBATE TRANSCRIPT`,
                    `==================================================`,
                    `Worldview: ${worldview.fundamentalNeed.toUpperCase()} (${worldview.needType.toUpperCase()}: ${worldview.selectedTerm})`,
                    `Opponent: The White Rabbit (${role.toUpperCase()})`,
                    `Constraint: ${worldview.reason}`,
                    `Result: NEGATIVE FAITH DISMANTLED (VICTORY)`,
                    `Total Debate Attempts: ${debateAttempt} / 4`,
                    `==================================================\n`
                  ].join('\n');

                  const formattedMessages = messages.map(m => {
                    if (m.text.startsWith('[Evaluator Hint]:')) {
                      const cleanHint = m.text.replace('[Evaluator Hint]:', '').trim();
                      return `[EVALUATOR HINT]:\n${cleanHint}`;
                    }
                    if (m.text.startsWith('[System Message]:') || m.text.startsWith('[System Error]:')) {
                      return `${m.text}`;
                    }
                    if (m.role === 'user') {
                      return `PLAYER:\n${m.text}`;
                    }
                    return `THE WHITE RABBIT (${role.toUpperCase()}):\n${m.text}`;
                  }).join('\n\n--------------------------------------------------\n\n');

                  let hintsSection = '';
                  if (allHintsList.length > 0) {
                    hintsSection = [
                      `\n\n==================================================`,
                      `EVALUATOR HINTS REQUESTED DURING DEBATE (${allHintsList.length}):`,
                      `==================================================`,
                      ...allHintsList.map((h, i) => `[Hint #${i + 1}]:\n${h}`)
                    ].join('\n');
                  }

                  const footer = [
                    `\n\n==================================================`,
                    `FINAL EVALUATION SUMMARY:`,
                    `==================================================`,
                    evalSummary || 'Your logic prevailed. The negative faith is broken.',
                    `==================================================`
                  ].join('\n');

                  const fullExport = header + formattedMessages + hintsSection + footer;

                  try {
                    if (navigator?.clipboard?.writeText) {
                      await navigator.clipboard.writeText(fullExport);
                    } else {
                      const textarea = document.createElement('textarea');
                      textarea.value = fullExport;
                      document.body.appendChild(textarea);
                      textarea.select();
                      document.execCommand('copy');
                      document.body.removeChild(textarea);
                    }
                    setIsCopied(true);
                    setTimeout(() => setIsCopied(false), 3000);
                  } catch (err) {
                    console.error('Failed to copy transcript to clipboard', err);
                  }
                }}
                className={`flex-1 px-5 py-3 transition-all border flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm ${
                  isCopied 
                    ? 'bg-green-950/80 border-green-500 text-green-300' 
                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border-neutral-700 hover:border-neutral-500'
                }`}
              >
                {isCopied ? (
                  <>
                    <Check className="w-4 h-4 text-green-400" />
                    <span>Copied Chat & Hints!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-neutral-400" />
                    <span>Copy Chat & Hints</span>
                  </>
                )}
              </button>
              <button 
                onClick={handleMainMenu}
                className="flex-1 px-5 py-3 bg-green-950 hover:bg-green-900 text-green-300 transition-colors border border-green-800 hover:border-green-600 flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm"
              >
                <RefreshCw className="w-4 h-4" /> Start New Simulation
              </button>
            </div>
          </div>
        </div>
      )}
      {showChat && !isGameOver && !isUnlocked && (
        <div className="absolute inset-0 z-50 bg-black flex items-center justify-center md:justify-start p-2 sm:p-4 md:p-8 overflow-hidden select-none">
          {/* Ambient blurred backdrop fills letterbox edges on wide/tall screens */}
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-30 blur-2xl scale-110 pointer-events-none"
            style={{ backgroundImage: `url('/debate_background.jfif')` }}
          />

          {/* Full debate background image - completely contained so 100% of the artwork is always visible on any screen size */}
          <img 
            src="/debate_background.jfif" 
            alt="Debate Scene Background" 
            className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none z-0"
          />

          {isChatMinimized ? (
            <button
              onClick={() => setIsChatMinimized(false)}
              className="relative z-10 self-end m-4 px-4 py-2.5 bg-neutral-950/90 hover:bg-neutral-900 border border-orange-700/70 text-orange-300 font-mono text-xs rounded-sm shadow-2xl flex items-center gap-2 cursor-pointer transition-all backdrop-blur-md"
              title="Show debate chat dialog"
            >
              <Eye className="w-4 h-4 text-orange-400" />
              <span>Resume Debate ({5 - promptsSentInAttempt} prompts left)</span>
            </button>
          ) : (
            <div className="relative z-10 w-full max-w-sm sm:max-w-md lg:max-w-lg bg-neutral-950/85 backdrop-blur-md border border-orange-900/60 rounded-sm shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[90vh]">
              <div className="p-3 sm:p-4 border-b border-orange-900/50 bg-black/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Terminal className="text-orange-500 w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                  <h3 className="text-orange-400 font-mono text-xs sm:text-sm uppercase tracking-widest truncate">The White Rabbit ({role})</h3>
                </div>
                <div className="flex items-center gap-2">
                  {latestHint && (
                    <button 
                      onClick={() => {
                        const hintText = latestHint;
                        setRequestedHints(prev => [...prev, { attempt: debateAttempt, turn: promptsSentInAttempt, hint: hintText }]);
                        setMessages(prev => [...prev, { role: 'model', text: `[Evaluator Hint]: ${hintText}` }]);
                        setLatestHint(null);
                      }} 
                      className="text-yellow-500 hover:text-yellow-400 p-1 bg-yellow-950/40 rounded-sm border border-yellow-900/50 flex items-center gap-1 text-[11px] sm:text-xs px-2 cursor-pointer transition-colors"
                      title="Get a hint from the evaluator"
                    >
                      <Lightbulb className="w-3.5 h-3.5" /> Hint
                    </button>
                  )}
                  <button 
                    onClick={() => setIsChatMinimized(true)} 
                    className="text-orange-600 hover:text-orange-300 cursor-pointer p-1"
                    title="Minimize chat to view artwork"
                  >
                    <EyeOff className="w-4 h-4" />
                  </button>
                  <button onClick={handleCloseChat} className="text-orange-600 hover:text-orange-300 cursor-pointer p-1">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Subheader tracking debate attempt stats & relics */}
              <div className="px-3 sm:px-4 py-2 bg-neutral-950/90 border-b border-orange-900/30 flex items-center justify-between text-[11px] sm:text-xs font-mono text-neutral-400">
                <div className="flex gap-2 sm:gap-4">
                  <span>Attempt: <strong className="text-orange-400">{debateAttempt}/4</strong></span>
                  <span>Prompts: <strong className="text-orange-400">{5 - promptsSentInAttempt}</strong></span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="hidden sm:inline">Relics:</span>
                  <span className={`w-2.5 h-2.5 rounded-full ${collectedItems[0] ? 'bg-red-500 shadow shadow-red-500' : 'bg-neutral-800 border border-neutral-700'}`} title="Shattered Mirror of the Past (Traumatic Past Story)" />
                  <span className={`w-2.5 h-2.5 rounded-full ${collectedItems[1] ? 'bg-yellow-500 shadow shadow-yellow-500' : 'bg-neutral-800 border border-neutral-700'}`} title="Emblem of the Defiant (Heresy Story)" />
                  <span className={`w-2.5 h-2.5 rounded-full ${collectedItems[2] ? 'bg-purple-500 shadow shadow-purple-500' : 'bg-neutral-800 border border-neutral-700'}`} title="Extinction Ledger (Inevitable Extinction Speculation)" />
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 text-sm">
                {messages.map((msg, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={idx} 
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] p-3 sm:p-4 rounded-sm ${
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

              <form onSubmit={handleSendMessage} className="p-3 sm:p-4 border-t border-orange-900/50 bg-black/60 flex gap-2 sm:gap-3">
                <input 
                  type="text" 
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  className="flex-1 bg-neutral-950 border border-neutral-800 p-2.5 sm:p-3 text-orange-200 font-mono text-sm outline-none focus:border-orange-500 transition-colors placeholder:text-neutral-700"
                  placeholder="Argue your counter-logic..."
                />
                <button 
                  type="submit"
                  disabled={isTyping}
                  className="px-4 sm:px-6 bg-orange-950 hover:bg-orange-900 text-orange-400 transition-colors border border-orange-800 disabled:opacity-50 cursor-pointer flex items-center justify-center shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
