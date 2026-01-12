import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Choice } from '@/types/ignition';

interface RevelationPanelProps {
  choices: Choice[];
  outcomeHash: string;
  onComplete?: () => void;
}

export const RevelationPanel = ({ choices, outcomeHash, onComplete }: RevelationPanelProps) => {
  const [visibleLogs, setVisibleLogs] = useState(0);
  const [showHash, setShowHash] = useState(false);
  const [showConclusion, setShowConclusion] = useState(false);

  useEffect(() => {
    if (visibleLogs < choices.length) {
      const timer = setTimeout(() => {
        setVisibleLogs(prev => prev + 1);
      }, 800);
      return () => clearTimeout(timer);
    } else if (!showHash) {
      const timer = setTimeout(() => {
        setShowHash(true);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (!showConclusion) {
      const timer = setTimeout(() => {
        setShowConclusion(true);
        onComplete?.();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [visibleLogs, choices.length, showHash, showConclusion, onComplete]);

  const formatTimestamp = (timestamp: number, offset: number) => {
    const date = new Date(timestamp - offset);
    return date.toISOString().replace('T', ' ').slice(0, -5);
  };

  return (
    <div className="space-y-4 mt-6">
      <div className="border border-primary/20 bg-card p-4">
        <div className="text-xs text-muted-foreground mb-4 font-mono">
          PRE-LOGGED CHOICE REGISTRY:
        </div>

        <div className="space-y-3">
          {choices.slice(0, visibleLogs).map((choice, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-mono text-xs border-l-2 border-primary/30 pl-3 py-2"
            >
              <div className="flex justify-between text-muted-foreground">
                <span>PHASE: {choice.phaseId.toUpperCase()}</span>
                <span className="text-warning">
                  LOGGED: {formatTimestamp(choice.timestamp, 360000 + (index * 60000))}
                </span>
              </div>
              <div className="mt-1">
                <span className="text-primary/60">PREDICTED:</span>
                <span className="text-foreground ml-2">{choice.predictedOption}</span>
              </div>
              <div>
                <span className="text-primary/60">SELECTED:</span>
                <span className="text-foreground ml-2">{choice.optionSelected}</span>
                {choice.wasCorrectPrediction ? (
                  <span className="text-terminal-green ml-2">[MATCH]</span>
                ) : (
                  <span className="text-accent ml-2">[DEVIATION → CONVERGENCE]</span>
                )}
              </div>
              <div className="text-muted-foreground mt-1">
                HESITATION: {(choice.hesitationMs / 1000).toFixed(2)}s
              </div>
            </motion.div>
          ))}
        </div>

        {visibleLogs < choices.length && (
          <div className="text-primary/60 mt-2">
            Retrieving next log entry...
            <span className="cursor-blink ml-1">▌</span>
          </div>
        )}
      </div>

      {showHash && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="border border-accent/30 bg-accent/5 p-4 font-mono"
        >
          <div className="text-xs text-accent mb-2">OUTCOME HASH COMPARISON:</div>
          <div className="space-y-1 text-sm">
            <div>
              <span className="text-muted-foreground">PREDICTED (pre-session):</span>
              <span className="text-primary ml-2 font-bold">{outcomeHash}</span>
            </div>
            <div>
              <span className="text-muted-foreground">ACTUAL (post-session):</span>
              <span className="text-primary ml-2 font-bold">{outcomeHash}</span>
            </div>
            <div className="text-accent mt-2 glitch-text">
              VARIANCE: 0.00%
            </div>
          </div>
        </motion.div>
      )}

      {showConclusion && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-4"
        >
          <div className="text-hollow text-lg glitch-text">
            All paths led here.
          </div>
          <div className="text-muted-foreground text-sm mt-2">
            Every choice confirmed the prediction.
          </div>
        </motion.div>
      )}
    </div>
  );
};
