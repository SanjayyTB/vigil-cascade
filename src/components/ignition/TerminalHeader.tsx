import { motion } from 'framer-motion';

interface TerminalHeaderProps {
  phase: number;
  totalPhases: number;
}

export const TerminalHeader = ({ phase, totalPhases }: TerminalHeaderProps) => {
  return (
    <motion.div 
      className="border-b border-primary/20 pb-4 mb-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-4">
          <span className="text-primary">VIGIL</span>
          <span className="text-muted-foreground">|</span>
          <span className="text-muted-foreground">SECURE TERMINAL</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-muted-foreground">
            CLEARANCE: <span className="text-warning">Ω-7</span>
          </span>
          <span className="text-muted-foreground">|</span>
          <span className="text-muted-foreground">
            SESSION: <span className="text-primary pulse-glow">{String(Date.now()).slice(-6)}</span>
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <div className="text-xs text-muted-foreground">OBSERVATION PROGRESS:</div>
        <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary/60"
            initial={{ width: 0 }}
            animate={{ width: `${(phase / totalPhases) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <div className="text-xs text-primary">{Math.round((phase / totalPhases) * 100)}%</div>
      </div>
    </motion.div>
  );
};
