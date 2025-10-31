import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ParticlesContainer } from "./particles-container";
import useSound from "use-sound";

interface BoostCelebrationPopupProps {
  boostAmount: number;
  boosterName?: string;
  onClose: () => void;
}

export default function BoostCelebrationPopup({ boostAmount, boosterName, onClose }: BoostCelebrationPopupProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [playCelebrate] = useSound("/sounds/success.mp3", { volume: 0.7 });

  useEffect(() => {
    playCelebrate();
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 500);
    }, 2000);
    return () => clearTimeout(timer);
  }, [onClose, playCelebrate]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center z-[110] bg-black/90"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <ParticlesContainer />
          <motion.div
            className="relative border-8 border-yellow-400 neon-glow p-10 rounded-2xl bg-gradient-to-br from-black via-yellow-800/80 to-black text-center max-w-lg w-full "
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1.05, opacity: 1 }}
            exit={{ scale: 0.7, opacity: 0 }}
          >
            <h1 className="text-5xl font-extrabold text-yellow-300 drop-shadow text-neon-glow mb-4 font-pixel animate-pulse glitch-effect">BOOST!</h1>
            <div className="text-4xl md:text-5xl text-white mb-2 font-neon shadow-pulse animate-in-bounce">
              +{boostAmount} Points
            </div>
            {boosterName && (
              <div className="text-lg text-blue-300 mb-2 font-mono">
                By <span className="font-semibold">{boosterName}</span>
              </div>
            )}
            <div className="text-pink-400 text-base mt-2">Power Unleashed!</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
