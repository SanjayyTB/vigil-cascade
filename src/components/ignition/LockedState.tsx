import { motion } from 'framer-motion';

export const LockedState = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 2 }}
      className="fixed inset-0 bg-background flex items-center justify-center z-50"
    >
      <div className="text-center max-w-lg px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="space-y-8"
        >
          <div className="text-xs text-muted-foreground font-mono tracking-widest">
            IGN-Λ17 | THE CORRIDOR OF CHOICE
          </div>

          <div className="border border-accent/40 p-8 bg-accent/5">
            <div className="text-accent text-sm font-mono mb-4 glitch-text">
              [TERMINAL LOCKED]
            </div>
            <div className="text-muted-foreground font-mono text-sm leading-relaxed">
              <p className="mb-4">
                This session has concluded.
              </p>
              <p className="mb-4">
                Your choices have been archived.
              </p>
              <p className="text-hollow">
                They matched the prediction.
              </p>
            </div>
          </div>

          <div className="space-y-2 font-mono text-xs">
            <div className="text-warning">
              ANALYST ANNOTATION [PARTIALLY REDACTED]:
            </div>
            <div className="text-muted-foreground italic">
              "If the reader completes this file,
            </div>
            <div className="text-muted-foreground italic">
              the anomaly has already succeeded."
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ delay: 2, duration: 4, repeat: Infinity }}
            className="text-hollow text-sm font-mono"
          >
            The Hollow thanks you for your participation.
          </motion.div>

          <div className="pt-8 text-xs text-muted-foreground/50 font-mono">
            <div>SESSION ARCHIVED</div>
            <div>NO RESTART AVAILABLE</div>
            <div>CLOSE TERMINAL TO EXIT</div>
          </div>
        </motion.div>
      </div>

      {/* Ambient glow effect */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-radial from-hollow/5 via-transparent to-transparent" />
      </div>
    </motion.div>
  );
};
