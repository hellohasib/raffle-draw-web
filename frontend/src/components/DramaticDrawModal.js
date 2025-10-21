import React, { useState, useEffect } from 'react';
import { X, Trophy, Gift, Star, Phone, User } from 'lucide-react';

const DramaticDrawModal = ({ isOpen, onClose, prize, participants, onDrawComplete }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [showWinner, setShowWinner] = useState(false);
  const [winner, setWinner] = useState(null);
  const [spinningText, setSpinningText] = useState('');
  const [isRevealing, setIsRevealing] = useState(false); // State for the reveal transition

  // Create merry-go-round carousel music with drum beats
  const createSpinningSound = () => {
    if (!window.AudioContext && !window.webkitAudioContext) return null;
    
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Carnival/carousel melody pattern (simplified waltz rhythm)
    // Using notes from a cheerful major scale
    const notes = [
      523.25, 659.25, 783.99, 880.00, 783.99, 659.25, // C5, E5, G5, A5, G5, E5
      587.33, 739.99, 880.00, 987.77, 880.00, 739.99, // D5, F#5, A5, B5, A5, F#5
      659.25, 783.99, 987.77, 1046.50, 987.77, 783.99 // E5, G5, B5, C6, B5, G5
    ];
    
    const oscillators = [];
    const gains = [];
    
    // Create a repeating carnival melody
    let time = audioContext.currentTime;
    const noteDuration = 0.25; // Quarter note duration
    
    // Play the melody multiple times
    for (let repeat = 0; repeat < 3; repeat++) {
      notes.forEach((frequency, index) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        
        // Use triangle wave for that classic organ/calliope sound
        osc.type = 'triangle';
        osc.frequency.value = frequency;
        
        // Add envelope (attack, sustain, release)
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.15, time + 0.02); // Quick attack
        gain.gain.linearRampToValueAtTime(0.12, time + noteDuration - 0.05); // Sustain
        gain.gain.linearRampToValueAtTime(0, time + noteDuration); // Release
        
        osc.connect(gain);
        gain.connect(audioContext.destination);
        
        osc.start(time);
        osc.stop(time + noteDuration);
        
        oscillators.push(osc);
        gains.push(gain);
        
        time += noteDuration;
      });
    }
    
    // Create drum beat function
    const createDrumBeat = (startTime, type = 'kick') => {
      const bufferSize = audioContext.sampleRate * 0.15; // 150ms drum hit
      const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
      const data = buffer.getChannelData(0);
      
      if (type === 'kick') {
        // Kick drum: Low frequency thump
        for (let i = 0; i < bufferSize; i++) {
          const decay = Math.exp(-i / (bufferSize * 0.15));
          data[i] = Math.sin(2 * Math.PI * 60 * (i / audioContext.sampleRate)) * decay;
        }
      } else if (type === 'snare') {
        // Snare drum: Noise with quick decay
        for (let i = 0; i < bufferSize; i++) {
          const decay = Math.exp(-i / (bufferSize * 0.08));
          data[i] = (Math.random() * 2 - 1) * decay * 0.5;
        }
      }
      
      const drumSource = audioContext.createBufferSource();
      drumSource.buffer = buffer;
      
      const drumGain = audioContext.createGain();
      drumGain.gain.value = type === 'kick' ? 0.3 : 0.2;
      
      drumSource.connect(drumGain);
      drumGain.connect(audioContext.destination);
      
      drumSource.start(startTime);
      
      return drumSource;
    };
    
    // Add drum pattern (kick on beats 1 and 3, snare on beats 2 and 4)
    const drumSources = [];
    let drumTime = audioContext.currentTime;
    const beatDuration = 0.5; // Half second per beat
    
    for (let i = 0; i < 40; i++) { // Enough for the whole song
      // Kick drum on beat 1 and 3
      if (i % 4 === 0 || i % 4 === 2) {
        drumSources.push(createDrumBeat(drumTime, 'kick'));
      }
      // Snare drum on beat 2 and 4
      if (i % 4 === 1 || i % 4 === 3) {
        drumSources.push(createDrumBeat(drumTime, 'snare'));
      }
      drumTime += beatDuration;
    }
    
    // Add a continuous "oom-pah" bass accompaniment for that carousel feel
    const bassOsc = audioContext.createOscillator();
    const bassGain = audioContext.createGain();
    
    bassOsc.type = 'sine';
    bassOsc.frequency.value = 130.81; // C3
    
    bassGain.gain.setValueAtTime(0.08, audioContext.currentTime);
    
    bassOsc.connect(bassGain);
    bassGain.connect(audioContext.destination);
    bassOsc.start();
    
    // Add vibrato for that warbling carousel sound
    const vibrato = audioContext.createOscillator();
    const vibratoGain = audioContext.createGain();
    
    vibrato.type = 'sine';
    vibrato.frequency.value = 4; // 4Hz vibrato
    vibratoGain.gain.value = 8; // Gentle vibrato
    
    vibrato.connect(vibratoGain);
    vibratoGain.connect(bassOsc.frequency);
    vibrato.start();
    
    return { 
      oscillators,
      drumSources,
      bassOsc,
      bassGain,
      vibrato,
      audioContext,
      stop: () => {
        // Fade out and stop all sounds
        const fadeTime = audioContext.currentTime + 0.1;
        bassGain.gain.linearRampToValueAtTime(0, fadeTime);
        
        setTimeout(() => {
          bassOsc.stop();
          vibrato.stop();
        }, 150);
        // Note oscillators and drum sources will stop automatically after their duration
      }
    };
  };
  
  useEffect(() => {
    if (isOpen && participants && participants.length > 0 && !isSpinning && !showWinner) {
      // Automatically start the draw when modal opens
      setTimeout(() => {
        startDramaticDraw();
      }, 800); // Brief delay for dramatic effect
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, participants?.length]);

  const startDramaticDraw = async () => {
    setIsSpinning(true);
    setShowWinner(false);
    setWinner(null);
    
    // Start continuous spinning sound with clicking effect
    const spinningSound = createSpinningSound();

    // Create spinning text effect - cycle through participant names
    const participantNames = participants.map(p => p.name);
    let currentIndex = 0;
    
    const textInterval = setInterval(() => {
      setSpinningText(participantNames[currentIndex]);
      currentIndex = (currentIndex + 1) % participantNames.length;
    }, 100);

    // Random spinning duration between 5-10 seconds
    const spinDuration = Math.random() * 5000 + 5000; // 5-10 seconds
    
    // Call the API to draw the winner DURING the spinning (in background)
    // This way, when the animation finishes, we have the real winner from database
    let apiWinner = null;
    if (onDrawComplete) {
      // onDrawComplete should return a promise that resolves with the winner data
      onDrawComplete().then((winnerData) => {
        apiWinner = winnerData;
      }).catch((error) => {
        console.error('Error drawing winner:', error);
      });
    }
    
    // Stop spinning and reveal winner AFTER the spin duration
    setTimeout(() => {
      clearInterval(textInterval);
      
      // Stop spinning sound (stops both oscillator and clicks)
      if (spinningSound) {
        spinningSound.stop();
      }
      
      // Use the winner from API, or fallback to random selection for display purposes
      let selectedWinner;
      if (apiWinner) {
        // Use the actual winner from the database
        selectedWinner = apiWinner;
      } else if (prize && prize.id === 'all') {
        // For "all prizes" draw, we'll just show a generic celebration
        selectedWinner = { 
          name: 'All Winners Selected!', 
          email: 'Multiple winners have been drawn',
          ticketNumber: 'Multiple'
        };
      } else {
        // Fallback: Select random winner for display (this shouldn't normally happen)
        const randomIndex = Math.floor(Math.random() * participants.length);
        selectedWinner = participants[randomIndex];
      }
      
      // Update state to show winner
      setWinner(selectedWinner);
      setSpinningText(selectedWinner.name);
      setIsSpinning(false);
      setIsRevealing(true); // Show "And the winner is..." state
      
      // Delay before showing the full winner card for dramatic effect
      setTimeout(() => {
        setIsRevealing(false);
        setShowWinner(true);
        
        // Start celebration
        startCelebration();
      }, 1500); // 1.5 second delay for suspense and reveal
    }, spinDuration);
  };

  const startCelebration = () => {
    // Create fireworks effect
    createFireworks();
    
    // Play celebration sound using Web Audio API
    playCelebrationSound();
  };

  const playCelebrationSound = () => {
    if (!window.AudioContext && !window.webkitAudioContext) return;
    
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Create a fanfare-like sound
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    let currentTime = audioContext.currentTime;
    
    notes.forEach((frequency, index) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(frequency, currentTime);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, currentTime + 0.1);
      gainNode.gain.linearRampToValueAtTime(0, currentTime + 0.3);
      
      oscillator.start(currentTime);
      oscillator.stop(currentTime + 0.3);
      
      currentTime += 0.2;
    });
  };

  const createFireworks = () => {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff'];
    
    for (let i = 0; i < 50; i++) {
      setTimeout(() => {
        createFirework(colors[Math.floor(Math.random() * colors.length)]);
      }, i * 100);
    }
  };

  const createFirework = (color) => {
    const firework = document.createElement('div');
    firework.style.position = 'fixed';
    firework.style.left = Math.random() * window.innerWidth + 'px';
    firework.style.top = Math.random() * window.innerHeight + 'px';
    firework.style.width = '6px';
    firework.style.height = '6px';
    firework.style.backgroundColor = color;
    firework.style.borderRadius = '50%';
    firework.style.pointerEvents = 'none';
    firework.style.zIndex = '9999';
    firework.style.animation = 'firework 1s ease-out forwards';
    
    document.body.appendChild(firework);
    
    setTimeout(() => {
      if (firework.parentNode) {
        firework.parentNode.removeChild(firework);
      }
    }, 1000);
  };

  const handleClose = () => {
    // Reset state
    setIsSpinning(false);
    setShowWinner(false);
    setWinner(null);
    setSpinningText('');
    setIsRevealing(false);
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Add CSS for animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
          
          @keyframes firework {
            0% { transform: scale(0); opacity: 1; }
            100% { transform: scale(1); opacity: 0; }
          }
          
          @keyframes bounce {
            0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-10px); }
            60% { transform: translateY(-5px); }
          }
          
          @keyframes glow {
            0%, 100% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.5); }
            50% { box-shadow: 0 0 40px rgba(255, 215, 0, 0.8), 0 0 60px rgba(255, 215, 0, 0.6); }
          }
          
          .spinning-wheel {
            animation: spin 0.5s linear infinite;
          }
          
          .pulse-animation {
            animation: pulse 1s ease-in-out infinite;
          }
          
          .bounce-animation {
            animation: bounce 1s ease-in-out infinite;
          }
          
          .glow-effect {
            animation: glow 2s ease-in-out infinite;
          }
        `
      }} />

      {/* Modal Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center" style={{ zIndex: 9999 }}>
        <div className="bg-white rounded-2xl p-8 relative" style={{ width: '85%', height: '70%', maxWidth: '1600px' }}>
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
            disabled={isSpinning}
          >
            <X className="h-6 w-6" />
          </button>

          {/* Header */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center mb-2">
              <Trophy className="h-10 w-10 text-yellow-500 pulse-animation" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {isSpinning ? 'Drawing Winner...' : showWinner ? 'Congratulations!' : 'Ready to Draw'}
            </h2>
            {prize && (
              <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-3 max-w-2xl mx-auto">
                <div className="flex items-center justify-center mb-1">
                  <Gift className="h-5 w-5 text-purple-600 mr-2" />
                  <span className="text-2xl font-bold text-purple-800">{prize.name}</span>
                </div>
                {prize.description && (
                  <p className="text-xs text-purple-600 text-center">{prize.description}</p>
                )}
              </div>
            )}
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-2 gap-8" style={{ height: 'calc(100% - 140px)' }}>
            
            {/* LEFT COLUMN - Spinning Wheel */}
            <div className="flex flex-col items-center justify-center border-r border-gray-200">
              {/* Spinning Wheel - Always visible during spinning, revealing, or showing winner */}
              {(isSpinning || isRevealing || showWinner) ? (
                <div className="text-center">
                  <div className="relative">
                    {/* Spinning Wheel with colored segments */}
                    <div className="relative mx-auto w-80 h-80">
                      {/* Pointer/Arrow at top */}
                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 z-10">
                        <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[30px] border-t-red-600 drop-shadow-lg"></div>
                      </div>
                      
                      {/* Wheel Container - Only spins during isSpinning state */}
                      <div className={`relative w-80 h-80 ${isSpinning ? 'spinning-wheel' : ''}`}>
                        {/* Colorful wheel with segments */}
                        <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl">
                          {/* Create 8 colored segments */}
                          <circle cx="100" cy="100" r="95" fill="#FF6B6B" />
                          <path d="M 100 100 L 100 5 A 95 95 0 0 1 167.08 32.92 Z" fill="#FFA500" />
                          <path d="M 100 100 L 167.08 32.92 A 95 95 0 0 1 195 100 Z" fill="#FFD700" />
                          <path d="M 100 100 L 195 100 A 95 95 0 0 1 167.08 167.08 Z" fill="#90EE90" />
                          <path d="M 100 100 L 167.08 167.08 A 95 95 0 0 1 100 195 Z" fill="#4ECDC4" />
                          <path d="M 100 100 L 100 195 A 95 95 0 0 1 32.92 167.08 Z" fill="#5DADE2" />
                          <path d="M 100 100 L 32.92 167.08 A 95 95 0 0 1 5 100 Z" fill="#9B59B6" />
                          <path d="M 100 100 L 5 100 A 95 95 0 0 1 32.92 32.92 Z" fill="#FF1493" />
                          
                          {/* White dots for decoration */}
                          <circle cx="100" cy="20" r="8" fill="white" opacity="0.9" />
                          <circle cx="170" cy="47" r="8" fill="white" opacity="0.9" />
                          <circle cx="180" cy="100" r="8" fill="white" opacity="0.9" />
                          <circle cx="170" cy="153" r="8" fill="white" opacity="0.9" />
                          <circle cx="100" cy="180" r="8" fill="white" opacity="0.9" />
                          <circle cx="30" cy="153" r="8" fill="white" opacity="0.9" />
                          <circle cx="20" cy="100" r="8" fill="white" opacity="0.9" />
                          <circle cx="30" cy="47" r="8" fill="white" opacity="0.9" />
                          
                          {/* Center circle */}
                          <circle cx="100" cy="100" r="20" fill="white" />
                          <circle cx="100" cy="100" r="15" fill="#333" />
                        </svg>
                      </div>
                      
                      {/* Glow effect around wheel */}
                      <div className="absolute inset-0 rounded-full glow-effect" style={{
                        boxShadow: '0 0 40px rgba(255, 215, 0, 0.6), 0 0 80px rgba(255, 105, 180, 0.4)'
                      }}></div>
                    </div>
                    
                    {/* Spinning Text */}
                    {isSpinning && (
                      <div className="mt-6">
                        <div className="bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 text-white px-8 py-4 rounded-full text-2xl font-bold bounce-animation shadow-lg">
                          {spinningText || 'Preparing...'}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : !showWinner ? (
                /* Preparation State */
                <div className="text-center">
                  <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-8">
                    <div className="text-6xl mb-4 animate-bounce">🎰</div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Preparing Draw...</h3>
                    <p className="text-base text-gray-600">Get ready for the excitement!</p>
                    <div className="mt-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* RIGHT COLUMN - Winner Details */}
            <div className="flex flex-col items-center justify-center">
              {isSpinning && (
                /* Drawing in progress message */
                <div className="text-center">
                  <div className="text-gray-600">
                    <div className="flex items-center justify-center mb-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2"></div>
                      <span className="text-lg font-semibold">Drawing in progress...</span>
                    </div>
                    <p className="text-sm">Please wait while we select the winner 🎰</p>
                  </div>
                </div>
              )}

              {(isRevealing || showWinner) && winner && (
                /* "And the winner is..." reveal - STOP HERE */
                <div className="text-center">
                  <div className="text-7xl mb-8 animate-bounce">🎉</div>
                  <h3 className="text-5xl font-bold text-gray-900 mb-8 animate-pulse">
                    And the winner is...
                  </h3>
                  <div className="bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 text-white px-10 py-8 rounded-2xl text-4xl font-bold shadow-2xl glow-effect mb-8">
                    {spinningText}
                  </div>
                  
                  <div className="flex justify-center mt-8">
                    <button
                      onClick={handleClose}
                      className="bg-gradient-to-r from-green-500 to-blue-600 text-white px-10 py-4 rounded-full text-lg font-semibold hover:from-green-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DramaticDrawModal;
