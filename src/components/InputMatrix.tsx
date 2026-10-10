import React, { useState } from 'react';
import { Worldview, Constraint, AgentOfChange, NEED_DEFINITIONS } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  Briefcase, 
  UserCheck, 
  Footprints, 
  Shield, 
  Compass, 
  Users, 
  KeyRound, 
  Flame, 
  Target, 
  Lock, 
  Mountain, 
  CloudRain, 
  Users2, 
  EyeOff, 
  Sparkles, 
  Orbit,
  ArrowRight,
  ArrowLeft,
  Dices,
  Languages
} from 'lucide-react';
import { t, setLocale, getLocale, SupportedLocale } from '../locales/i18n';

interface PairDef {
  need: string;
  pain: string;
  needLabel: string;
  painLabel: string;
  icon: any;
}

const languages: { id: SupportedLocale; label: string; code: string }[] = [
  { id: 'en', label: 'English', code: 'EN' },
  { id: 'de', label: 'Deutsch', code: 'DE' },
  { id: 'he', label: 'Hebrew', code: 'HE' }
];

const pairs: PairDef[] = [
  { need: 'peace', pain: 'dissatisfaction', get needLabel() { return t('matrix.needLabel.peace'); }, get painLabel() { return t('matrix.painLabel.dissatisfaction'); }, icon: Shield },
  { need: 'wonder', pain: 'disappointment', get needLabel() { return t('matrix.needLabel.wonder'); }, get painLabel() { return t('matrix.painLabel.disappointment'); }, icon: Compass },
  { need: 'support', pain: 'loneliness', get needLabel() { return t('matrix.needLabel.support'); }, get painLabel() { return t('matrix.painLabel.loneliness'); }, icon: Users },
  { need: 'certainty', pain: 'uncertainty', get needLabel() { return t('matrix.needLabel.certainty'); }, get painLabel() { return t('matrix.painLabel.uncertainty'); }, icon: KeyRound },
  { need: 'hope', pain: 'physical pain', get needLabel() { return t('matrix.needLabel.hope'); }, get painLabel() { return t('matrix.painLabel.physical pain'); }, icon: Flame },
  { need: 'attention', pain: 'imprisonment', get needLabel() { return t('matrix.needLabel.attention'); }, get painLabel() { return t('matrix.painLabel.imprisonment'); }, icon: Target },
  { need: 'privacy', pain: 'change', get needLabel() { return t('matrix.needLabel.privacy'); }, get painLabel() { return t('matrix.painLabel.change'); }, icon: Lock }
];

const constraints: { id: Constraint; title: string; subtitle: string; icon: any }[] = [
  { id: 'High Environmental', get title() { return t('matrix.constraint.highEnvironmental.title'); }, get subtitle() { return t('matrix.constraint.highEnvironmental.subtitle'); }, icon: Mountain },
  { id: 'Low Environmental', get title() { return t('matrix.constraint.lowEnvironmental.title'); }, get subtitle() { return t('matrix.constraint.lowEnvironmental.subtitle'); }, icon: CloudRain },
  { id: 'High Social', get title() { return t('matrix.constraint.highSocial.title'); }, get subtitle() { return t('matrix.constraint.highSocial.subtitle'); }, icon: Users2 },
  { id: 'Low Social', get title() { return t('matrix.constraint.lowSocial.title'); }, get subtitle() { return t('matrix.constraint.lowSocial.subtitle'); }, icon: EyeOff }
];

const agents: { id: AgentOfChange; title: string; subtitle: string; icon: any }[] = [
  { id: 'lovers', get title() { return t('matrix.agent.lovers.title'); }, get subtitle() { return t('matrix.agent.lovers.subtitle'); }, icon: Heart },
  { id: 'bosses', get title() { return t('matrix.agent.bosses.title'); }, get subtitle() { return t('matrix.agent.bosses.subtitle'); }, icon: Briefcase },
  { id: 'subordinates', get title() { return t('matrix.agent.subordinates.title'); }, get subtitle() { return t('matrix.agent.subordinates.subtitle'); }, icon: UserCheck },
  { id: 'strangers', get title() { return t('matrix.agent.strangers.title'); }, get subtitle() { return t('matrix.agent.strangers.subtitle'); }, icon: Footprints }
];

interface Props {
  onComplete: (worldview: Worldview) => void;
}

export function InputMatrix({ onComplete }: Props) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [locale, setLocaleState] = useState<SupportedLocale>(getLocale());
  const [isLangOpen, setIsLangOpen] = useState(false);

  // Worldview state
  const [fitness, setFitness] = useState<'unallowed' | 'unfit'>('unfit');
  const [validation, setValidation] = useState<'granted' | 'validated'>('granted');
  const [needType, setNeedType] = useState<'need' | 'pain'>('need');
  const [pairIdx, setPairIdx] = useState<number>(3); // certainty
  const [constraint, setConstraint] = useState<Constraint>('High Environmental');
  const [agent, setAgent] = useState<AgentOfChange>('lovers');

  const selectedPair = pairs[pairIdx];
  const selectedTerm = needType === 'need' ? selectedPair.need : selectedPair.pain;

  const handleSelectLanguage = (newLocale: SupportedLocale) => {
    setLocale(newLocale);
    setLocaleState(newLocale);
    setIsLangOpen(false);
  };

  // Auto-advance helper with gentle organic delay for feedback
  const handleSelectDuality = (idx: number) => {
    setPairIdx(idx);
    setTimeout(() => setStep(2), 240);
  };

  const handleSelectConstraint = (c: Constraint) => {
    setConstraint(c);
    setTimeout(() => setStep(3), 240);
  };

  const handleSelectAgent = (a: AgentOfChange) => {
    setAgent(a);
    setTimeout(() => setStep(4), 240);
  };

  const randomizeFate = () => {
    const randomNeedType: 'need' | 'pain' = Math.random() > 0.5 ? 'need' : 'pain';
    const randomPairIdx = Math.floor(Math.random() * pairs.length);
    const randomConstraint = constraints[Math.floor(Math.random() * constraints.length)].id;
    const randomAgent = agents[Math.floor(Math.random() * agents.length)].id;
    const randomFitness: 'unallowed' | 'unfit' = Math.random() > 0.5 ? 'unfit' : 'unallowed';
    const randomValidation: 'granted' | 'validated' = Math.random() > 0.5 ? 'granted' : 'validated';

    setNeedType(randomNeedType);
    setPairIdx(randomPairIdx);
    setConstraint(randomConstraint);
    setAgent(randomAgent);
    setFitness(randomFitness);
    setValidation(randomValidation);
    setStep(4);
  };

  const handleSubmit = () => {
    onComplete({
      fitness,
      validation,
      needType,
      fundamentalNeed: selectedPair.need,
      selectedTerm,
      reason: constraint,
      agent,
      language: locale
    });
  };

  const stepTitles = [
    { num: 1, label: t('matrix.stepTitle.duality'), tag: needType === 'need' ? selectedPair.needLabel : selectedPair.painLabel },
    { num: 2, label: t('matrix.stepTitle.pressure'), tag: (constraints.find(c => c.id === constraint)?.title || constraint).split(' ')[0] },
    { num: 3, label: t('matrix.stepTitle.guardian'), tag: (agents.find(a => a.id === agent)?.title || agent).replace('The ', '').replace('Der ', '').replace('ה', '') },
    { num: 4, label: t('matrix.stepTitle.faith'), tag: 'Axiom' }
  ];

  return (
    <div 
      dir={locale === 'he' ? 'rtl' : 'ltr'}
      className="relative min-h-screen w-full bg-neutral-950 text-neutral-100 flex flex-col items-center justify-between p-4 sm:p-8 overflow-hidden select-none"
    >
      {/* Dreamy surreal background layers */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-25 scale-105 pointer-events-none blur-sm"
        style={{ backgroundImage: `url('/debate_background.jfif')` }}
      />
      <div className="absolute inset-0 bg-radial from-transparent via-neutral-950/70 to-neutral-950 pointer-events-none" />

      {/* Floating rabbit hole glow in the background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
        <motion.img 
          src="/rabbit_hole.png" 
          alt="Rabbit Hole Portal"
          animate={{ scale: [1, 1.05, 1], rotate: [0, 2, -2, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          className="w-[42rem] h-[42rem] object-contain drop-shadow-[0_0_90px_rgba(245,158,11,0.25)]"
        />
      </div>

      {/* Atmospheric Mist & Embers */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-900/15 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />

      {/* TOP HEADER: Title & Guided Descent Thread */}
      <header className="relative z-50 w-full max-w-4xl flex flex-col items-center gap-4 text-center mt-2">
        <div className="flex items-center justify-between w-full px-2">
          <div className="flex items-center gap-2">
            <h1 className="
              font-psychedelic text-2xl sm:text-4xl
              tracking-[0.16em]
              font-bold
              animate-freaky-forest
              inline-block select-none
            ">
              THE RABBIT HOLE
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Selection Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="group px-3.5 py-1.5 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-amber-500/50 hover:border-amber-400 text-xs font-mono text-amber-300 flex items-center gap-2 shadow-xl transition-all duration-200 cursor-pointer"
                title="Select Language"
              >
                <Languages className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-semibold capitalize">{languages.find(l => l.id === locale)?.label || 'Language'}</span>
              </button>

              {isLangOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsLangOpen(false)} 
                  />
                  <div className="absolute right-0 rtl:right-auto rtl:left-0 top-full mt-2 z-50 min-w-[140px] rounded-2xl bg-neutral-900 border border-amber-500/50 shadow-2xl p-1.5 flex flex-col gap-1">
                    {languages.map((l) => (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => handleSelectLanguage(l.id)}
                        className={`px-3 py-2 rounded-xl text-xs font-mono flex items-center justify-between transition-colors cursor-pointer capitalize ${
                          locale === l.id
                            ? 'bg-amber-500 text-neutral-950 font-bold shadow-md'
                            : 'text-neutral-200 hover:bg-neutral-800 hover:text-amber-300'
                        }`}
                      >
                        <span className="font-medium">{l.label}</span>
                        <span className="text-[10px] opacity-75 uppercase tracking-widest font-bold">{l.code}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Randomize Button */}
            <button
              type="button"
              onClick={randomizeFate}
              className="group px-3.5 py-1.5 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-amber-500/40 hover:border-amber-400 text-xs font-mono text-amber-300 flex items-center gap-2 shadow-xl transition-all duration-200 cursor-pointer"
              title={t('matrix.randomize.title')}
            >
              <Dices className="w-4 h-4 text-amber-400 transition-transform group-hover:rotate-180" />
              <span className="hidden sm:inline">{t('matrix.randomize.button')}</span>
            </button>
          </div>
        </div>

        {/* Guided Constellation Thread (Interactive steps) */}
        <div className="flex items-center gap-2 sm:gap-4 bg-neutral-950/70 backdrop-blur-md p-1.5 sm:p-2 rounded-full border border-neutral-800 shadow-2xl">
          {stepTitles.map((s, idx) => {
            const isActive = step === s.num;
            const isPassed = step > s.num;

            return (
              <React.Fragment key={s.num}>
                {idx > 0 && (
                  <div className={`h-[1px] w-4 sm:w-8 transition-colors ${isPassed ? 'bg-amber-500/60' : 'bg-neutral-800'}`} />
                )}
                <button
                  type="button"
                  onClick={() => setStep(s.num as any)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-amber-500 text-neutral-950 font-bold shadow-md shadow-amber-500/30 ring-1 ring-amber-400'
                      : isPassed
                        ? 'bg-neutral-900 text-amber-400/80 hover:bg-neutral-800 border border-neutral-700'
                        : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] border border-current">
                    {s.num}
                  </span>
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
              </React.Fragment>
            );
          })}
        </div>
      </header>

      {/* CENTER INTERACTIVE STAGE */}
      <main className="relative z-10 w-full max-w-4xl my-auto py-4 flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: THE DUALITY (NEED vs PAIN) */}
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.22 }}
              className="w-full flex flex-col items-center gap-6"
            >
              <div className="text-center space-y-1">
                <h2 className="font-cinzel text-2xl sm:text-3xl text-amber-200 tracking-wider">
                  {t('matrix.step1.heading')}
                </h2>
                <p className="text-xs sm:text-sm text-neutral-400 font-mono">
                  {t('matrix.step1.subheading')}
                </p>
              </div>

              {/* Need vs Pain Dreamy Switch */}
              <div className="flex items-center gap-2 bg-neutral-950/80 p-1.5 rounded-full border border-neutral-800 shadow-xl backdrop-blur-md">
                <button
                  type="button"
                  onClick={() => setNeedType('need')}
                  className={`px-6 py-2 rounded-full font-cinzel text-sm transition-all cursor-pointer ${
                    needType === 'need'
                      ? 'bg-amber-500 text-neutral-950 font-bold shadow-lg shadow-amber-500/20'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {t('matrix.step1.theNeed')}
                </button>
                <button
                  type="button"
                  onClick={() => setNeedType('pain')}
                  className={`px-6 py-2 rounded-full font-cinzel text-sm transition-all cursor-pointer ${
                    needType === 'pain'
                      ? 'bg-rose-600 text-neutral-100 font-bold shadow-lg shadow-rose-600/30'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {t('matrix.step1.thePain')}
                </button>
              </div>

              {/* 7 Floating Archetype Spheres with Explanations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 w-full">
                {pairs.map((p, idx) => {
                  const isSelected = pairIdx === idx;
                  const Icon = p.icon;
                  const termKey = needType === 'need' ? p.need : p.pain;
                  const label = needType === 'need' ? p.needLabel : p.painLabel;
                  const definition = NEED_DEFINITIONS[termKey] || '';
                  const isLastItem = idx === pairs.length - 1;

                  return (
                    <motion.button
                      key={idx}
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelectDuality(idx)}
                      className={`group p-4 rounded-2xl flex flex-col items-start justify-between text-left gap-3 transition-all duration-200 cursor-pointer relative border backdrop-blur-xl ${
                        isLastItem ? 'sm:col-span-2 sm:max-w-md sm:mx-auto sm:w-full lg:col-span-1 lg:max-w-none lg:mx-0' : ''
                      } ${
                        isSelected
                          ? (needType === 'need'
                              ? 'bg-neutral-900/95 border-amber-400 shadow-xl shadow-amber-950/60 ring-2 ring-amber-500/40'
                              : 'bg-neutral-900/95 border-rose-500 shadow-xl shadow-rose-950/60 ring-2 ring-rose-500/40')
                          : 'bg-neutral-950/60 border-neutral-800/80 hover:bg-neutral-900/60 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div className={`p-2.5 rounded-xl shrink-0 transition-colors ${
                          isSelected 
                            ? (needType === 'need' ? 'bg-amber-500 text-neutral-950 shadow-md' : 'bg-rose-600 text-neutral-100 shadow-md')
                            : (needType === 'need' ? 'bg-neutral-900 text-amber-400/90 group-hover:text-amber-300' : 'bg-neutral-900 text-rose-400/90 group-hover:text-rose-300')
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-cinzel text-base font-bold capitalize text-neutral-100 tracking-wide block truncate">
                            {label}
                          </span>
                        </div>
                      </div>

                      <p className={`text-xs leading-relaxed font-sans transition-colors ${
                        isSelected 
                          ? (needType === 'need' ? 'text-amber-100/90' : 'text-rose-100/90')
                          : 'text-neutral-400 group-hover:text-neutral-300'
                      }`}>
                        {definition}
                      </p>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* STEP 2: THE PRESSURE (CONSTRAINT) */}
          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.22 }}
              className="w-full flex flex-col items-center gap-6"
            >
              <div className="text-center space-y-1">
                <h2 className="font-cinzel text-2xl sm:text-3xl text-amber-200 tracking-wider">
                  {t('matrix.step2.heading')}
                </h2>
                <p className="text-xs sm:text-sm text-neutral-400 font-mono">
                  {t('matrix.step2.subheading')}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                {constraints.map((c) => {
                  const isSelected = constraint === c.id;
                  const Icon = c.icon;

                  return (
                    <motion.button
                      key={c.id}
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelectConstraint(c.id)}
                      className={`p-5 rounded-2xl flex items-center gap-4 transition-all duration-200 cursor-pointer text-left border backdrop-blur-xl ${
                        isSelected
                          ? 'bg-neutral-900/90 border-amber-400 shadow-xl shadow-amber-950/60 ring-2 ring-amber-500/40'
                          : 'bg-neutral-950/60 border-neutral-800/80 hover:bg-neutral-900/60 hover:border-neutral-700'
                      }`}
                    >
                      <div className={`p-3.5 rounded-full shrink-0 ${isSelected ? 'bg-amber-500 text-neutral-950' : 'bg-neutral-900 text-amber-400/90'}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="font-cinzel text-lg font-bold text-neutral-100">
                          {c.title}
                        </div>
                        <div className="text-xs text-neutral-400 font-mono mt-0.5">
                          {c.subtitle}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* STEP 3: THE GUARDIAN (AGENT OF CHANGE) */}
          {step === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.22 }}
              className="w-full flex flex-col items-center gap-6"
            >
              <div className="text-center space-y-1">
                <h2 className="font-cinzel text-2xl sm:text-3xl text-amber-200 tracking-wider">
                  {t('matrix.step3.heading')}
                </h2>
                <p className="text-xs sm:text-sm text-neutral-400 font-mono">
                  {t('matrix.step3.subheading')}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                {agents.map((a) => {
                  const isSelected = agent === a.id;
                  const Icon = a.icon;

                  return (
                    <motion.button
                      key={a.id}
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelectAgent(a.id)}
                      className={`p-5 rounded-2xl flex items-center gap-4 transition-all duration-200 cursor-pointer text-left border backdrop-blur-xl ${
                        isSelected
                          ? 'bg-neutral-900/90 border-amber-400 shadow-xl shadow-amber-950/60 ring-2 ring-amber-500/40'
                          : 'bg-neutral-950/60 border-neutral-800/80 hover:bg-neutral-900/60 hover:border-neutral-700'
                      }`}
                    >
                      <div className={`p-3.5 rounded-full shrink-0 ${isSelected ? 'bg-amber-500 text-neutral-950' : 'bg-neutral-900 text-amber-400/90'}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="font-cinzel text-lg font-bold text-neutral-100">
                          {a.title}
                        </div>
                        <div className="text-xs text-neutral-400 font-mono mt-0.5">
                          {a.subtitle}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* STEP 4: THE AXIOM & FINAL DESCENT */}
          {step === 4 && (
            <motion.div
              key="step-4"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.22 }}
              className="w-full flex flex-col items-center gap-6"
            >
              <div className="text-center space-y-1">
                <h2 className="font-cinzel text-2xl sm:text-3xl text-amber-200 tracking-wider">
                  {t('matrix.step4.heading')}
                </h2>
                <p className="text-xs sm:text-sm text-neutral-400 font-mono">
                  {t('matrix.step4.subheading')}
                </p>
              </div>

              {/* Fitness & Validation Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                {/* Who is to blame for the circumstances */}
                <div className="bg-neutral-950/70 p-5 rounded-2xl border border-neutral-800 backdrop-blur-md space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="font-cinzel text-sm sm:text-base text-neutral-200 font-bold tracking-wide">
                      {t('matrix.step4.blameTitle')}
                    </div>
                    <p className="text-[11px] text-neutral-400 font-mono mt-0.5">
                      {t('matrix.step4.blameSubtitle')}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setFitness('unfit')}
                      className={`p-3.5 rounded-xl text-left transition-all cursor-pointer border flex flex-col justify-between h-28 ${
                        fitness === 'unfit'
                          ? 'bg-amber-500 text-neutral-950 font-bold border-amber-400 shadow-lg ring-1 ring-amber-400'
                          : 'bg-neutral-900/80 text-neutral-300 border-neutral-800 hover:bg-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div>
                        <div className="font-cinzel text-base font-bold">{t('matrix.step4.unfit')}</div>
                        <div className={`text-xs font-mono font-bold mt-0.5 ${fitness === 'unfit' ? 'text-neutral-950' : 'text-amber-400'}`}>
                          {t('matrix.step4.blameSelf')}
                        </div>
                      </div>
                      <div className={`text-[11px] font-sans leading-tight ${fitness === 'unfit' ? 'text-neutral-900/90' : 'text-neutral-400'}`}>
                        {t('matrix.step4.unfitDesc')}
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFitness('unallowed')}
                      className={`p-3.5 rounded-xl text-left transition-all cursor-pointer border flex flex-col justify-between h-28 ${
                        fitness === 'unallowed'
                          ? 'bg-amber-500 text-neutral-950 font-bold border-amber-400 shadow-lg ring-1 ring-amber-400'
                          : 'bg-neutral-900/80 text-neutral-300 border-neutral-800 hover:bg-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div>
                        <div className="font-cinzel text-base font-bold">{t('matrix.step4.unallowed')}</div>
                        <div className={`text-xs font-mono font-bold mt-0.5 ${fitness === 'unallowed' ? 'text-neutral-950' : 'text-amber-400'}`}>
                          {t('matrix.step4.blameEnvironment')}
                        </div>
                      </div>
                      <div className={`text-[11px] font-sans leading-tight ${fitness === 'unallowed' ? 'text-neutral-900/90' : 'text-neutral-400'}`}>
                        {t('matrix.step4.unallowedDesc')}
                      </div>
                    </button>
                  </div>
                </div>

                {/* What is the expected outcome */}
                <div className="bg-neutral-950/70 p-5 rounded-2xl border border-neutral-800 backdrop-blur-md space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="font-cinzel text-sm sm:text-base text-neutral-200 font-bold tracking-wide">
                      {t('matrix.step4.outcomeTitle')}
                    </div>
                    <p className="text-[11px] text-neutral-400 font-mono mt-0.5">
                      {t('matrix.step4.outcomeSubtitle')}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setValidation('granted')}
                      className={`p-3.5 rounded-xl text-left transition-all cursor-pointer border flex flex-col justify-between h-28 ${
                        validation === 'granted'
                          ? 'bg-amber-500 text-neutral-950 font-bold border-amber-400 shadow-lg ring-1 ring-amber-400'
                          : 'bg-neutral-900/80 text-neutral-300 border-neutral-800 hover:bg-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div>
                        <div className="font-cinzel text-base font-bold">{t('matrix.step4.notGranted')}</div>
                        <div className={`text-xs font-mono font-bold mt-0.5 ${validation === 'granted' ? 'text-neutral-950' : 'text-amber-400'}`}>
                          {t('matrix.step4.inevitableFailure')}
                        </div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setValidation('validated')}
                      className={`p-3.5 rounded-xl text-left transition-all cursor-pointer border flex flex-col justify-between h-28 ${
                        validation === 'validated'
                          ? 'bg-amber-500 text-neutral-950 font-bold border-amber-400 shadow-lg ring-1 ring-amber-400'
                          : 'bg-neutral-900/80 text-neutral-300 border-neutral-800 hover:bg-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div>
                        <div className="font-cinzel text-base font-bold">{t('matrix.step4.notValidated')}</div>
                        <div className={`text-xs font-mono font-bold mt-0.5 ${validation === 'validated' ? 'text-neutral-950' : 'text-amber-400'}`}>
                          {t('matrix.step4.endlessWait')}
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* BOTTOM FOOTER: Living Faith Inscription & Descent Button */}
      <footer className="relative z-10 w-full max-w-4xl flex flex-col items-center gap-4 mt-2 mb-2">
        {/* Living Faith Inscription */}
        <div className="w-full bg-neutral-950/10 hover:bg-neutral-950/20 backdrop-blur-[2px] p-4 sm:p-5 rounded-2xl border border-amber-500/25 shadow-xl text-center transition-colors">
          <div className="font-cinzel text-base sm:text-lg lg:text-xl text-neutral-100 leading-relaxed drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)]">
            <span>"{t('matrix.inscription.humansAre')} </span>
            <span className="text-amber-400 font-bold underline decoration-amber-500/50">{t(`matrix.inscription.fitness.${fitness}`) || fitness}</span>
            <span> {t('matrix.inscription.toBe')} </span>
            <span className="text-amber-400 font-bold underline decoration-amber-500/50">{t(`matrix.inscription.validation.${validation}`) || validation}</span>
            <span> {t('matrix.inscription.the')} </span>
            <span className="text-amber-400 font-bold underline decoration-amber-500/50">{t(`matrix.inscription.needType.${needType}`) || needType} {t('matrix.inscription.of')} {needType === 'need' ? selectedPair.needLabel : selectedPair.painLabel}</span>
            <span> {t('matrix.inscription.becauseOf')} </span>
            <span className="text-amber-400 font-bold underline decoration-amber-500/50">{constraints.find(c => c.id === constraint)?.title || constraint}</span>
            <span> {t('matrix.inscription.pressureFromOur')} </span>
            <span className="text-amber-400 font-bold underline decoration-amber-500/50">{agents.find(a => a.id === agent)?.title || agent}</span>
            <span>."</span>
          </div>
          {NEED_DEFINITIONS[selectedTerm] && (
            <div className="mt-2 text-xs font-mono text-amber-300/80 italic flex items-center justify-center gap-1.5 flex-wrap">
              <span className="text-amber-400 font-semibold">{needType === 'need' ? selectedPair.needLabel : selectedPair.painLabel}:</span>
              <span>"{NEED_DEFINITIONS[selectedTerm]}"</span>
            </div>
          )}
        </div>

        {/* Navigation Buttons: Back & Descend */}
        <div className="flex items-center justify-between w-full px-2 gap-4">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((step - 1) as any)}
              className="px-5 py-2.5 rounded-full bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 text-xs font-mono text-neutral-300 flex items-center gap-2 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
              <span>{t('matrix.button.back')}</span>
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep((step + 1) as any)}
              className="px-6 py-2.5 rounded-full bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-950/30"
            >
              <span>{t('matrix.button.nextStage')}</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </button>
          ) : (
            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleSubmit}
              className="px-8 py-3.5 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-neutral-950 font-cinzel text-base font-bold tracking-wider shadow-2xl shadow-amber-500/40 flex items-center gap-3 cursor-pointer"
            >
              <span>{t('matrix.button.descend')}</span>
              <ArrowRight className="w-5 h-5 rtl:rotate-180" />
            </motion.button>
          )}
        </div>
      </footer>
    </div>
  );
}
