import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IgnitionExperience } from '@/components/ignition/IgnitionExperience';
import { AudioProvider, useAudio } from '@/contexts/AudioContext';

const AudioInitPrompt = () => {
  const { initializeAudio, isAudioEnabled } = useAudio();

  if (isAudioEnabled) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
    >
      <button
        onClick={initializeAudio}
        className="px-4 py-2 bg-primary/10 border border-primary/30 text-primary text-xs font-mono
                   hover:bg-primary/20 hover:border-primary/50 transition-all duration-200"
      >
        <span className="mr-2">◉</span>
        ENABLE AUDIO FEED
      </button>
    </motion.div>
  );
};

const Index = () => {
  const [initialized, setInitialized] = useState(false);
  const [bootSequence, setBootSequence] = useState(0);

  const bootMessages = [
    'ESTABLISHING SECURE CONNECTION...',
    'VERIFYING ANALYST CREDENTIALS...',
    'ACCESSING ARCHIVED IGNITION FILES...',
    'WARNING: FILE INTEGRITY COMPROMISED',
    'LOADING IGN-Λ17...',
  ];

  useEffect(() => {
    if (bootSequence < bootMessages.length) {
      const timer = setTimeout(() => {
        setBootSequence(prev => prev + 1);
      }, 800);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setInitialized(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [bootSequence]);

  return (
    <AudioProvider>
      <div className="min-h-screen bg-background font-mono">
        <AudioInitPrompt />
        <AnimatePresence mode="wait">
          {!initialized ? (
            <motion.div
              key="boot"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="min-h-screen flex items-center justify-center"
            >
              <div className="max-w-md w-full px-8 space-y-4">
                <div className="text-center mb-8">
                  <div className="text-primary text-2xl tracking-[0.3em] font-light">
                    VIGIL
                  </div>
                  <div className="text-muted-foreground text-xs mt-2 tracking-widest">
                    SECURE TERMINAL ACCESS
                  </div>
                </div>

                <div className="space-y-2">
                  {bootMessages.slice(0, bootSequence).map((message, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`text-sm ${
                        message.includes('WARNING') 
                          ? 'text-accent' 
                          : 'text-muted-foreground'
                      }`}
                    >
                      <span className="text-primary/60 mr-2">&gt;</span>
                      {message}
                    </motion.div>
                  ))}
                  {bootSequence < bootMessages.length && (
                    <div className="text-primary">
                      <span className="cursor-blink">▌</span>
                    </div>
                  )}
                </div>

                {bootSequence >= bootMessages.length && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center pt-8"
                  >
                    <div className="text-primary animate-pulse">
                      INITIALIZING OBSERVATION PROTOCOL...
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="experience"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
            >
              <IgnitionExperience />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AudioProvider>
  );
};

export default Index;
