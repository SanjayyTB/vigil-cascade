import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChoiceOption } from '@/types/ignition';
import { cn } from '@/lib/utils';
import { useAudio } from '@/contexts/AudioContext';

interface ChoicePanelProps {
  choices: ChoiceOption[];
  onSelect: (choice: ChoiceOption, hesitationMs: number) => void;
  disabled?: boolean;
  phaseId: string;
}

export const ChoicePanel = ({ choices, onSelect, disabled, phaseId }: ChoicePanelProps) => {
  const [showChoices, setShowChoices] = useState(false);
  const [processingChoice, setProcessingChoice] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number>(0);
  const [acknowledgingHesitation, setAcknowledgingHesitation] = useState(false);
  const { playHesitationCue, playChoiceSound, playSystemNotice } = useAudio();

  useEffect(() => {
    // Delay showing choices to create tension
    const timer = setTimeout(() => {
      setShowChoices(true);
      setStartTime(Date.now());
    }, 1500);

    return () => clearTimeout(timer);
  }, [phaseId]);

  // Check for hesitation
  useEffect(() => {
    if (!showChoices || processingChoice) return;

    const hesitationTimer = setTimeout(() => {
      playHesitationCue();
      setAcknowledgingHesitation(true);
      setTimeout(() => setAcknowledgingHesitation(false), 2000);
    }, 8000);

    return () => clearTimeout(hesitationTimer);
  }, [showChoices, processingChoice, playHesitationCue]);

  const handleChoice = (choice: ChoiceOption) => {
    if (disabled || processingChoice) return;

    const hesitationMs = Date.now() - startTime;
    setProcessingChoice(choice.id);

    // Add processing delay based on whether user tried to be "clever"
    const isDefiant = choice.id !== choice.predictedId;
    const processingDelay = isDefiant ? 800 : 1500;

    playChoiceSound(isDefiant);
    playSystemNotice();

    setTimeout(() => {
      onSelect(choice, hesitationMs);
    }, processingDelay);
  };

  if (!showChoices) {
    return (
      <div className="mt-6 text-muted-foreground text-sm">
        <span className="text-primary/60">[SYS]</span> Awaiting input protocol...
        <span className="cursor-blink ml-1">▌</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mt-8 space-y-3"
    >
      {acknowledgingHesitation && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-warning text-sm mb-4 glitch-text"
        >
          <span className="text-secondary/60 mr-2">[WRN]</span>
          Hesitation detected. Take your time. The outcome is unchanged.
        </motion.div>
      )}

      <div className="text-muted-foreground text-xs mb-4">
        SELECT RESPONSE:
      </div>

      <div className="space-y-2">
        {choices.map((choice, index) => (
          <motion.button
            key={choice.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => handleChoice(choice)}
            disabled={disabled || !!processingChoice}
            className={cn(
              "w-full text-left px-4 py-3 border transition-all duration-200 font-mono text-sm",
              "border-primary/20 hover:border-primary/60 hover:bg-primary/5",
              "focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30",
              processingChoice === choice.id && "border-primary bg-primary/10 animate-pulse",
              processingChoice && processingChoice !== choice.id && "opacity-30",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <span className="text-primary/60 mr-3">[{index + 1}]</span>
            <span className="text-foreground">{choice.label}</span>
          </motion.button>
        ))}
      </div>

      {processingChoice && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-primary text-sm mt-4"
        >
          <span className="text-primary/60 mr-2">[SYS]</span>
          Processing response...
          <span className="cursor-blink ml-1">▌</span>
        </motion.div>
      )}
    </motion.div>
  );
};
