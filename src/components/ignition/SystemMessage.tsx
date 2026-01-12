import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface SystemMessageProps {
  messages: string[];
  onComplete?: () => void;
}

export const SystemMessage = ({ messages, onComplete }: SystemMessageProps) => {
  const [visibleMessages, setVisibleMessages] = useState<number>(0);

  useEffect(() => {
    if (visibleMessages >= messages.length) {
      const timer = setTimeout(() => {
        onComplete?.();
      }, 500);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => {
      setVisibleMessages(prev => prev + 1);
    }, 600);

    return () => clearTimeout(timer);
  }, [visibleMessages, messages, onComplete]);

  return (
    <div className="space-y-1 my-4">
      {messages.slice(0, visibleMessages).map((message, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-muted-foreground text-sm font-mono"
        >
          <span className="text-primary/40 mr-2">&gt;</span>
          {message}
        </motion.div>
      ))}
      {visibleMessages < messages.length && (
        <span className="text-primary/60 cursor-blink">▌</span>
      )}
    </div>
  );
};
