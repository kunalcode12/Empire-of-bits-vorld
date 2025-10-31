import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ParticlesContainer } from "./particles-container";

interface ItemDropCelebrationPopupProps {
  itemName: string;
  itemImage?: string;
  onClose: () => void;
}

export default function ItemDropCelebrationPopup({ itemName, itemImage, onClose }: ItemDropCelebrationPopupProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 500);
    }, 2000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center z-[110] bg-black/80"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <ParticlesContainer />
          <motion.div
            className="relative border-8 border-blue-400 neon-glow p-10 rounded-2xl bg-gradient-to-br from-black via-blue-800/80 to-black text-center max-w-lg w-full "
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1.1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
          >
            <h2 className="text-3xl font-extrabold text-blue-400 font-pixel drop-shadow mb-2">ITEM DROP!</h2>
            {itemImage && <img src={itemImage} alt={itemName} className="mx-auto mb-4 h-24 w-24 object-contain pixelated" />}
            <div className="text-2xl md:text-3xl text-white mb-2 font-pixel animate-pulse">{itemName}</div>
            <div className="text-yellow-300 animate-bounce mt-2">Enjoy your new item!</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
