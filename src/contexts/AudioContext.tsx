import { createContext, useContext, ReactNode, useEffect, useCallback, useState } from 'react';
import { useAmbientAudio } from '@/hooks/useAmbientAudio';

interface AudioContextType {
  initializeAudio: () => Promise<void>;
  isAudioEnabled: boolean;
  setIntensity: (intensity: number) => void;
  setHeartbeatRate: (bpm: number) => void;
  startHeartbeat: () => void;
  stopHeartbeat: () => void;
  playHesitationCue: () => void;
  playChoiceSound: (wasDefiant: boolean) => void;
  playRevelationSound: () => void;
  playSystemNotice: () => void;
  playLockSound: () => void;
}

const AudioCtx = createContext<AudioContextType | null>(null);

export const AudioProvider = ({ children }: { children: ReactNode }) => {
  const audio = useAmbientAudio();
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  const initializeAudio = useCallback(async () => {
    if (!audio.isInitialized) {
      await audio.initialize();
      audio.startHeartbeat();
      setHasUserInteracted(true);
    }
  }, [audio]);

  // Auto-start on first user interaction
  useEffect(() => {
    const handleInteraction = () => {
      if (!hasUserInteracted) {
        initializeAudio();
      }
    };

    window.addEventListener('click', handleInteraction, { once: true });
    window.addEventListener('keydown', handleInteraction, { once: true });

    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, [hasUserInteracted, initializeAudio]);

  const value: AudioContextType = {
    initializeAudio,
    isAudioEnabled: audio.isInitialized,
    setIntensity: audio.setIntensity,
    setHeartbeatRate: audio.setHeartbeatRate,
    startHeartbeat: audio.startHeartbeat,
    stopHeartbeat: audio.stopHeartbeat,
    playHesitationCue: audio.playHesitationCue,
    playChoiceSound: audio.playChoiceSound,
    playRevelationSound: audio.playRevelationSound,
    playSystemNotice: audio.playSystemNotice,
    playLockSound: audio.playLockSound,
  };

  return <AudioCtx.Provider value={value}>{children}</AudioCtx.Provider>;
};

export const useAudio = () => {
  const context = useContext(AudioCtx);
  if (!context) {
    throw new Error('useAudio must be used within AudioProvider');
  }
  return context;
};
