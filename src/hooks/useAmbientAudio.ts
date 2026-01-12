import { useRef, useCallback, useEffect, useState } from 'react';

interface AudioNodes {
  context: AudioContext | null;
  masterGain: GainNode | null;
  staticNoise: AudioBufferSourceNode | null;
  staticGain: GainNode | null;
  humOscillator: OscillatorNode | null;
  humGain: GainNode | null;
  heartbeatGain: GainNode | null;
}

interface AudioState {
  isPlaying: boolean;
  intensity: number; // 0-1 scale
  heartbeatRate: number; // BPM
}

export const useAmbientAudio = () => {
  const nodesRef = useRef<AudioNodes>({
    context: null,
    masterGain: null,
    staticNoise: null,
    staticGain: null,
    humOscillator: null,
    humGain: null,
    heartbeatGain: null,
  });

  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [audioState, setAudioState] = useState<AudioState>({
    isPlaying: false,
    intensity: 0.3,
    heartbeatRate: 50,
  });
  const [isInitialized, setIsInitialized] = useState(false);

  // Create white noise buffer
  const createNoiseBuffer = useCallback((context: AudioContext, duration: number) => {
    const sampleRate = context.sampleRate;
    const bufferSize = sampleRate * duration;
    const buffer = context.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      // Brown noise for more unsettling low-frequency rumble
      data[i] = (Math.random() * 2 - 1) * 0.5;
      if (i > 0) {
        data[i] = data[i - 1] * 0.99 + data[i] * 0.01;
      }
    }

    return buffer;
  }, []);

  // Initialize audio context and nodes
  const initialize = useCallback(async () => {
    if (nodesRef.current.context) return;

    try {
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Master gain
      const masterGain = context.createGain();
      masterGain.gain.value = 0.6;
      masterGain.connect(context.destination);

      // Static noise
      const staticGain = context.createGain();
      staticGain.gain.value = 0.08;
      staticGain.connect(masterGain);

      const noiseBuffer = createNoiseBuffer(context, 4);
      const staticNoise = context.createBufferSource();
      staticNoise.buffer = noiseBuffer;
      staticNoise.loop = true;
      
      // Add filter for more ominous sound
      const staticFilter = context.createBiquadFilter();
      staticFilter.type = 'lowpass';
      staticFilter.frequency.value = 800;
      staticNoise.connect(staticFilter);
      staticFilter.connect(staticGain);
      staticNoise.start();

      // Deep hum oscillator (distant rumble)
      const humGain = context.createGain();
      humGain.gain.value = 0.12;
      humGain.connect(masterGain);

      const humOscillator = context.createOscillator();
      humOscillator.type = 'sine';
      humOscillator.frequency.value = 40; // Deep bass hum
      
      // Add subtle modulation
      const lfo = context.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.1; // Very slow modulation
      const lfoGain = context.createGain();
      lfoGain.gain.value = 5;
      lfo.connect(lfoGain);
      lfoGain.connect(humOscillator.frequency);
      lfo.start();

      humOscillator.connect(humGain);
      humOscillator.start();

      // Heartbeat gain node (will be used for pulsing)
      const heartbeatGain = context.createGain();
      heartbeatGain.gain.value = 0;
      heartbeatGain.connect(masterGain);

      nodesRef.current = {
        context,
        masterGain,
        staticNoise,
        staticGain,
        humOscillator,
        humGain,
        heartbeatGain,
      };

      setIsInitialized(true);
      setAudioState(prev => ({ ...prev, isPlaying: true }));
    } catch (error) {
      console.error('Failed to initialize audio:', error);
    }
  }, [createNoiseBuffer]);

  // Play heartbeat sound
  const playHeartbeat = useCallback(() => {
    const { context, masterGain } = nodesRef.current;
    if (!context || !masterGain) return;

    const now = context.currentTime;
    const intensity = audioState.intensity;

    // Create heartbeat oscillator (two beats like a real heartbeat)
    const createBeat = (delay: number, volume: number) => {
      const osc = context.createOscillator();
      const gain = context.createGain();
      
      osc.type = 'sine';
      osc.frequency.value = 35 + (intensity * 20);
      
      gain.gain.setValueAtTime(0, now + delay);
      gain.gain.linearRampToValueAtTime(volume * intensity * 0.4, now + delay + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.3);
      
      osc.connect(gain);
      gain.connect(masterGain);
      
      osc.start(now + delay);
      osc.stop(now + delay + 0.4);
    };

    // Lub-dub pattern
    createBeat(0, 1);
    createBeat(0.15, 0.6);
  }, [audioState.intensity]);

  // Start heartbeat loop
  const startHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) return;

    const intervalMs = (60 / audioState.heartbeatRate) * 1000;
    playHeartbeat();
    
    heartbeatIntervalRef.current = setInterval(() => {
      playHeartbeat();
    }, intervalMs);
  }, [audioState.heartbeatRate, playHeartbeat]);

  // Stop heartbeat loop
  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  // Set intensity (affects all sounds)
  const setIntensity = useCallback((intensity: number) => {
    const clampedIntensity = Math.max(0, Math.min(1, intensity));
    setAudioState(prev => ({ ...prev, intensity: clampedIntensity }));

    const { staticGain, humGain } = nodesRef.current;
    if (staticGain) {
      staticGain.gain.value = 0.05 + (clampedIntensity * 0.15);
    }
    if (humGain) {
      humGain.gain.value = 0.08 + (clampedIntensity * 0.2);
    }
  }, []);

  // Set heartbeat rate
  const setHeartbeatRate = useCallback((bpm: number) => {
    setAudioState(prev => ({ ...prev, heartbeatRate: bpm }));
    
    // Restart heartbeat with new rate
    if (heartbeatIntervalRef.current) {
      stopHeartbeat();
      setTimeout(() => startHeartbeat(), 100);
    }
  }, [startHeartbeat, stopHeartbeat]);

  // Play hesitation detection sound
  const playHesitationCue = useCallback(() => {
    const { context, masterGain } = nodesRef.current;
    if (!context || !masterGain) return;

    const now = context.currentTime;

    // Eerie high-pitched tone
    const osc1 = context.createOscillator();
    const gain1 = context.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(2400, now);
    osc1.frequency.exponentialRampToValueAtTime(1200, now + 0.8);
    
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.15, now + 0.1);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    
    osc1.connect(gain1);
    gain1.connect(masterGain);
    osc1.start(now);
    osc1.stop(now + 1);

    // Sub-bass rumble
    const osc2 = context.createOscillator();
    const gain2 = context.createGain();
    osc2.type = 'sine';
    osc2.frequency.value = 30;
    
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.linearRampToValueAtTime(0.3, now + 0.2);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    
    osc2.connect(gain2);
    gain2.connect(masterGain);
    osc2.start(now);
    osc2.stop(now + 1.5);

    // Briefly increase intensity
    setIntensity(Math.min(1, audioState.intensity + 0.2));
    setTimeout(() => setIntensity(audioState.intensity), 2000);
  }, [audioState.intensity, setIntensity]);

  // Play choice selection sound
  const playChoiceSound = useCallback((wasDefiant: boolean) => {
    const { context, masterGain } = nodesRef.current;
    if (!context || !masterGain) return;

    const now = context.currentTime;

    if (wasDefiant) {
      // Discordant sound for defiant choice
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = 150;
      
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      
      // Distortion
      const distortion = context.createWaveShaper();
      const curve = new Float32Array(256);
      for (let i = 0; i < 256; i++) {
        const x = (i / 128) - 1;
        curve[i] = Math.tanh(x * 3);
      }
      distortion.curve = curve;
      
      osc.connect(distortion);
      distortion.connect(gain);
      gain.connect(masterGain);
      
      osc.start(now);
      osc.stop(now + 0.5);
    } else {
      // Compliant choice - subtle confirmation
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.type = 'sine';
      osc.frequency.value = 220;
      
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.4);
    }
  }, []);

  // Play revelation/climax sound
  const playRevelationSound = useCallback(() => {
    const { context, masterGain } = nodesRef.current;
    if (!context || !masterGain) return;

    const now = context.currentTime;

    // Rising drone
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(60, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 3);
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 1);
    gain.gain.setValueAtTime(0.25, now + 2.5);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 4);
    
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(now);
    osc.stop(now + 4.5);

    // Increase heartbeat during revelation
    setHeartbeatRate(80);
    setIntensity(0.7);
  }, [setHeartbeatRate, setIntensity]);

  // Play system "noticing" sound
  const playSystemNotice = useCallback(() => {
    const { context, masterGain } = nodesRef.current;
    if (!context || !masterGain) return;

    const now = context.currentTime;

    // Quick digital blip
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.setValueAtTime(600, now + 0.05);
    osc.frequency.setValueAtTime(400, now + 0.1);
    
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.2);
  }, []);

  // Play final lock sound
  const playLockSound = useCallback(() => {
    const { context, masterGain } = nodesRef.current;
    if (!context || !masterGain) return;

    const now = context.currentTime;

    // Descending doom
    for (let i = 0; i < 5; i++) {
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.type = 'sine';
      osc.frequency.value = 200 - (i * 30);
      
      const startTime = now + (i * 0.15);
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);
      
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(startTime);
      osc.stop(startTime + 0.5);
    }

    // Final sub-bass thud
    const finalOsc = context.createOscillator();
    const finalGain = context.createGain();
    finalOsc.type = 'sine';
    finalOsc.frequency.value = 25;
    
    finalGain.gain.setValueAtTime(0, now + 0.8);
    finalGain.gain.linearRampToValueAtTime(0.4, now + 0.9);
    finalGain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
    
    finalOsc.connect(finalGain);
    finalGain.connect(masterGain);
    finalOsc.start(now + 0.8);
    finalOsc.stop(now + 3);

    // Stop all ambient audio after lock
    setTimeout(() => {
      stopHeartbeat();
      if (nodesRef.current.masterGain) {
        nodesRef.current.masterGain.gain.linearRampToValueAtTime(0, (context.currentTime || 0) + 2);
      }
    }, 3000);
  }, [stopHeartbeat]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopHeartbeat();
      if (nodesRef.current.context) {
        nodesRef.current.context.close();
      }
    };
  }, [stopHeartbeat]);

  return {
    initialize,
    isInitialized,
    audioState,
    setIntensity,
    setHeartbeatRate,
    startHeartbeat,
    stopHeartbeat,
    playHeartbeat,
    playHesitationCue,
    playChoiceSound,
    playRevelationSound,
    playSystemNotice,
    playLockSound,
  };
};
