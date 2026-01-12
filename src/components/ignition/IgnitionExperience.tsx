import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IgnitionState, Choice, ChoiceOption } from '@/types/ignition';
import { PHASES, CLOSING_SEQUENCE, generateOutcomeHash } from '@/data/phases';
import { TextRenderer } from './TextRenderer';
import { ChoicePanel } from './ChoicePanel';
import { SystemMessage } from './SystemMessage';
import { RevelationPanel } from './RevelationPanel';
import { TerminalHeader } from './TerminalHeader';
import { LockedState } from './LockedState';
import { useAudio } from '@/contexts/AudioContext';

const INITIAL_STATE: IgnitionState = {
  phase: 0,
  choiceHistory: [],
  hiddenMetrics: {
    predictedOutcomeHash: generateOutcomeHash(),
    emotionalComplianceIndex: 100,
    observationDrift: 0,
    resistanceAttempts: 0,
    patternDeviation: 0,
  },
  isLocked: false,
  revelationTriggered: false,
  startTimestamp: Date.now(),
};

export const IgnitionExperience = () => {
  const [state, setState] = useState<IgnitionState>(INITIAL_STATE);
  const [currentSubPhase, setCurrentSubPhase] = useState<'content' | 'system' | 'choice' | 'revelation' | 'closing'>('content');
  const [showChoices, setShowChoices] = useState(false);
  const [convergenceText, setConvergenceText] = useState<string | null>(null);
  const [showClosing, setShowClosing] = useState(false);
  
  const { setIntensity, setHeartbeatRate, playRevelationSound, playLockSound } = useAudio();

  const currentPhase = PHASES[state.phase];

  // Increase intensity as phases progress
  useEffect(() => {
    const progress = state.phase / PHASES.length;
    setIntensity(0.3 + (progress * 0.4));
    setHeartbeatRate(50 + Math.floor(progress * 40));
  }, [state.phase, setIntensity, setHeartbeatRate]);

  const handleContentComplete = useCallback(() => {
    if (currentPhase?.systemMessages?.length) {
      setCurrentSubPhase('system');
    } else if (currentPhase?.choices?.length) {
      setShowChoices(true);
      setCurrentSubPhase('choice');
    } else if (currentPhase?.type === 'revelation') {
      playRevelationSound();
      setCurrentSubPhase('revelation');
    } else {
      // Auto-advance for narrative phases without choices
      setTimeout(() => {
        advancePhase();
      }, 1500);
    }
  }, [currentPhase, playRevelationSound]);

  const handleSystemComplete = useCallback(() => {
    if (currentPhase?.choices?.length) {
      setShowChoices(true);
      setCurrentSubPhase('choice');
    } else {
      advancePhase();
    }
  }, [currentPhase]);

  const handleChoiceSelect = useCallback((choice: ChoiceOption, hesitationMs: number) => {
    const newChoice: Choice = {
      phaseId: currentPhase.id,
      optionSelected: choice.label,
      predictedOption: PHASES[state.phase].choices?.find(c => c.id === choice.predictedId)?.label || choice.label,
      timestamp: Date.now(),
      hesitationMs,
      wasCorrectPrediction: choice.id === choice.predictedId,
    };

    setState(prev => ({
      ...prev,
      choiceHistory: [...prev.choiceHistory, newChoice],
      hiddenMetrics: {
        ...prev.hiddenMetrics,
        resistanceAttempts: choice.id !== choice.predictedId 
          ? prev.hiddenMetrics.resistanceAttempts + 1 
          : prev.hiddenMetrics.resistanceAttempts,
        patternDeviation: choice.id !== choice.predictedId
          ? prev.hiddenMetrics.patternDeviation + 5
          : prev.hiddenMetrics.patternDeviation,
      },
    }));

    setConvergenceText(choice.convergenceText);
    setShowChoices(false);

    // Show convergence text, then advance
    setTimeout(() => {
      setConvergenceText(null);
      advancePhase();
    }, 2500);
  }, [currentPhase, state.phase]);

  const advancePhase = useCallback(() => {
    if (state.phase >= PHASES.length - 1) {
      setShowClosing(true);
      playLockSound();
      setTimeout(() => {
        setState(prev => ({ ...prev, isLocked: true }));
      }, 8000);
      return;
    }

    setState(prev => ({ ...prev, phase: prev.phase + 1 }));
    setCurrentSubPhase('content');
    setShowChoices(false);
    setConvergenceText(null);
  }, [state.phase, playLockSound]);

  const handleRevelationComplete = useCallback(() => {
    setState(prev => ({ ...prev, revelationTriggered: true }));
    setTimeout(() => {
      advancePhase();
    }, 2000);
  }, [advancePhase]);

  if (state.isLocked) {
    return <LockedState />;
  }

  return (
    <div className="min-h-screen bg-background scanlines noise-overlay">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <TerminalHeader phase={state.phase} totalPhases={PHASES.length} />

        <AnimatePresence mode="wait">
          <motion.div
            key={state.phase}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {currentPhase && (
              <>
                <TextRenderer
                  blocks={currentPhase.content}
                  onComplete={handleContentComplete}
                  baseDelay={currentPhase.delay || 0}
                />

                {currentSubPhase === 'system' && currentPhase.systemMessages && (
                  <SystemMessage
                    messages={currentPhase.systemMessages}
                    onComplete={handleSystemComplete}
                  />
                )}

                {convergenceText && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-6 p-4 border-l-2 border-primary/40 text-muted-foreground font-mono text-sm"
                  >
                    <span className="text-primary/60">&gt;</span> {convergenceText}
                  </motion.div>
                )}

                {showChoices && currentPhase.choices && !convergenceText && (
                  <ChoicePanel
                    choices={currentPhase.choices}
                    onSelect={handleChoiceSelect}
                    phaseId={currentPhase.id}
                  />
                )}

                {currentSubPhase === 'revelation' && currentPhase.type === 'revelation' && (
                  <RevelationPanel
                    choices={state.choiceHistory}
                    outcomeHash={state.hiddenMetrics.predictedOutcomeHash}
                    onComplete={handleRevelationComplete}
                  />
                )}
              </>
            )}

            {showClosing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
              >
                <TextRenderer
                  blocks={CLOSING_SEQUENCE}
                  baseDelay={500}
                />
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Hidden metrics display (for debugging, normally invisible) */}
        {false && (
          <div className="fixed bottom-4 right-4 text-xs font-mono text-muted-foreground/30 space-y-1">
            <div>HASH: {state.hiddenMetrics.predictedOutcomeHash}</div>
            <div>COMPLIANCE: {state.hiddenMetrics.emotionalComplianceIndex}%</div>
            <div>DRIFT: {state.hiddenMetrics.observationDrift}</div>
            <div>RESISTANCE: {state.hiddenMetrics.resistanceAttempts}</div>
          </div>
        )}
      </div>
    </div>
  );
};
