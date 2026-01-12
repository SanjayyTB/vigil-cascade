import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ContentBlock } from '@/types/ignition';
import { cn } from '@/lib/utils';

interface TextRendererProps {
  blocks: ContentBlock[];
  onComplete?: () => void;
  baseDelay?: number;
}

export const TextRenderer = ({ blocks, onComplete, baseDelay = 0 }: TextRendererProps) => {
  const [visibleBlocks, setVisibleBlocks] = useState<number>(0);

  useEffect(() => {
    if (visibleBlocks >= blocks.length) {
      onComplete?.();
      return;
    }

    const currentBlock = blocks[visibleBlocks];
    const delay = currentBlock.delay ?? 150;

    const timer = setTimeout(() => {
      setVisibleBlocks(prev => prev + 1);
    }, baseDelay + delay);

    return () => clearTimeout(timer);
  }, [visibleBlocks, blocks, onComplete, baseDelay]);

  const getBlockStyles = (block: ContentBlock) => {
    switch (block.type) {
      case 'system':
        return 'text-system';
      case 'warning':
        return 'text-warning';
      case 'anomaly':
        return 'text-anomaly';
      case 'hollow':
        return 'text-hollow';
      case 'redacted':
        return 'redacted-block px-4 py-1 inline-block';
      default:
        return 'text-foreground';
    }
  };

  return (
    <div className="space-y-1 font-mono text-sm leading-relaxed">
      {blocks.slice(0, visibleBlocks).map((block, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.15 }}
          className={cn(
            getBlockStyles(block),
            block.glitch && 'glitch-text',
            block.type === 'text' && block.content === '' && 'h-4'
          )}
        >
          {block.type === 'system' && <span className="text-primary/60 mr-2">[SYS]</span>}
          {block.type === 'warning' && <span className="text-secondary/60 mr-2">[WRN]</span>}
          {block.type === 'anomaly' && <span className="text-accent/60 mr-2">[!]</span>}
          {block.type !== 'redacted' && block.content}
          {block.type === 'redacted' && (
            <span className="bg-muted px-8 py-0.5">&nbsp;</span>
          )}
        </motion.div>
      ))}
      {visibleBlocks < blocks.length && (
        <span className="text-primary cursor-blink">▌</span>
      )}
    </div>
  );
};
