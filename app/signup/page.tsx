"use client";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { VorldAuthService } from "../../lib/authservice";
import { useMobile } from "@/hooks/use-mobile";
import { AnimatedButton } from "@/components/animated-button";
import { ParticleButton } from "@/components/particle-button";
import { useToast } from "@/components/ui/use-toast";
import { ThemeToggle } from "@/components/theme-toggle";
import { useTheme } from "@/components/theme-provider";
import {
  ChevronLeft,
  Mail,
  Lock,
  Shield,
  ArrowRight,
  Gamepad2,
  Zap,
  Coins,
} from "lucide-react";

export default function EmailLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showRedirectLoader, setShowRedirectLoader] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState("");
  const [showHelpDialog, setShowHelpDialog] = useState(false);

  // Add error/success shake
  const [formStatus, setFormStatus] = useState<"idle" | "error" | "success">(
    "idle"
  );

  const authService = new VorldAuthService();
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement>(null);
  const isMobile = useMobile();
  const { theme } = useTheme();
  const { toast } = useToast();

  const playSound = (sound: string) => {
    if (audioRef.current) {
      audioRef.current.src = `/sounds/${sound}.mp3`;
      audioRef.current
        .play()
        .catch((e) => console.log("Audio play prevented:", e));
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    playSound("click");
    setFormStatus("idle");
    try {
      const result = await authService.loginWithEmail(email, password);
      if (result.success) {
        localStorage.removeItem("authToken");
        localStorage.removeItem("refreshToken");
        localStorage.setItem("authToken", result.data.data.accessToken);
        localStorage.setItem("refreshToken", result.data.data.refreshToken);
        if (result.data.requiresOTP) {
          setShowOtp(true);
          toast({
            title: "OTP Required",
            description: "Please check your email for the verification code.",
            duration: 5000,
          });
        } else {
          toast({
            title: "Login Successful!",
            description: "Welcome to Empire of Bits!",
            duration: 3000,
          });
          playSound("success");
          setFormStatus("success");
          setShowRedirectLoader(true);
          setTimeout(() => router.push("/games"), 200); // slight delay to show loader
        }
      } else {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: result.error,
          duration: 5000,
        });
        playSound("error");
        setFormStatus("error");
        setShowHelpDialog(true);
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "An unexpected error occurred.",
        duration: 5000,
      });
      playSound("error");
      setFormStatus("error");
      setShowHelpDialog(true);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    playSound("click");
    setFormStatus("idle");
    try {
      const result = await authService.verifyOTP(email, otp);
      if (result.success) {
        toast({
          title: "Verification Successful!",
          description: "Welcome to Empire of Bits!",
          duration: 3000,
        });
        playSound("success");
        setFormStatus("success");
        setShowRedirectLoader(true);
        setTimeout(() => router.push("/games"), 200);
      } else {
        toast({
          variant: "destructive",
          title: "Verification Failed",
          description: result.error,
          duration: 5000,
        });
        playSound("error");
        setFormStatus("error");
        setShowHelpDialog(true);
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: "An unexpected error occurred.",
        duration: 5000,
      });
      playSound("error");
      setFormStatus("error");
      setShowHelpDialog(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursorPosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const user = await authService.getProfile();
        if (user.success) router.push("/games");
      } catch {}
    })();
  }, [router]);

  // Theme overlays remain unchanged below, just polish layout

  return (
    <div className="min-h-screen bg-background text-foreground font-mono overflow-x-hidden overflow-y-auto relative flex flex-col items-center justify-center px-1 md:px-6">
      {/* Full-screen redirect loader */}
      {showRedirectLoader && (
        <div className="fixed inset-0 z-[999] bg-black/90 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Zap className="h-10 w-10 text-yellow-300 animate-spin" />
            <div className="text-yellow-200 font-pixel text-xl">Loading…</div>
          </div>
        </div>
      )}

      {/* Audio element for sfx */}
      <audio ref={audioRef} className="hidden" />

      {/* Help dialog for account creation assistance */}
      <AnimatePresence>
        {showHelpDialog && (
          <motion.div
            className="fixed inset-0 z-[998] bg-black/70 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="relative w-full max-w-md bg-gray-900 border-4 border-yellow-400 p-6 rounded-xl text-white"
              initial={{ scale: 0.92, y: 14 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 14 }}
            >
              <button
                className="absolute top-2 right-2 text-gray-300 hover:text-white"
                onClick={() => setShowHelpDialog(false)}
              >
                ✕
              </button>
              <div className="text-center mb-3">
                <div
                  className="text-2xl font-bold glitch-text"
                  data-text="ACCOUNT REQUIRED"
                >
                  ACCOUNT REQUIRED
                </div>
                <div className="text-sm text-gray-300 mt-2">
                  Create your Vorld account first, then sign in here.
                </div>
              </div>
              <div className="bg-black/50 border-2 border-white p-3 rounded-md text-sm mb-4">
                If you don’t have credentials yet or login fails, please go to:
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>
                    <a
                      className="underline text-yellow-300 break-all"
                      href="https://access.thevorld.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      https://access.thevorld.com/
                    </a>
                  </li>
                  <li>
                    <a
                      className="underline text-yellow-300 break-all"
                      href="https://arena-ioa-frontend.vercel.app/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      https://arena-ioa-frontend.vercel.app/
                    </a>
                  </li>
                </ul>
                <div className="mt-3 text-gray-300">
                  Sign up there, then return and log in with the same credentials.
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <a
                  href="https://access.thevorld.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-center arcade-btn bg-[hsl(var(--accent-purple))] border-2 border-[hsl(var(--accent-purple)/0.7)] py-2 px-4 font-bold"
                  onClick={() => {
                    setShowHelpDialog(false);
                    playSound("click");
                  }}
                >
                  Open Vorld Access
                </a>
                <a
                  href="https://arena-ioa-frontend.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-center arcade-btn-outline border-2 py-2 px-4 font-bold"
                  onClick={() => {
                    setShowHelpDialog(false);
                    playSound("click");
                  }}
                >
                  Open Arena
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background overlays & theme */}
      <div className="fixed inset-0 pointer-events-none z-10">
        {theme === "dark" ? (
          <>
            <div className="absolute inset-0 bg-[url('/scanlines.png')] opacity-10"></div>
            <div className="absolute inset-0 bg-radial-gradient opacity-20"></div>
            <div className="absolute inset-0 crt-effect"></div>
            <div className="absolute inset-0 noise"></div>
          </>
        ) : (
          <>
            <div className="absolute inset-0 dot-pattern"></div>
            <div className="absolute inset-0 animated-gradient"></div>
          </>
        )}
      </div>

      {/* Animated/arcade pixel ticker bar at top for delight */}
      <motion.div
        className="w-full text-center py-1 select-none px-2 arcade-btn bg-[hsl(var(--accent-yellow))] text-black text-sm md:text-base z-20 border-b-4 border-b-[hsl(var(--accent-purple))] fixed top-0 left-0 right-0 flex items-center justify-center gap-2 animate-fadeIn"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <span className="font-pixel tracking-wide glitch-text text-lg md:text-xl mr-2 font-bold animate-glow">
          READY PLAYER ONE?
        </span>
        <Coins className="h-5 w-5 md:h-6 md:w-6 animate-bounce mx-1" />
        <span className="hidden md:inline">
          Sign in to earn rewards and join tournaments!
        </span>
      </motion.div>

      {/* Header controls: back + theme */}
      <div className="absolute top-4 md:top-8 left-4 md:left-10 flex gap-3 z-30">
        <motion.button
          className="flex items-center arcade-btn py-1 px-2 rounded-lg text-xl text-white font-pixel bg-black/60 hover:bg-yellow-900/40 border-2 border-yellow-500 shadow-xl"
          onClick={() => {
            router.push("/");
            playSound("click");
          }}
          whileHover={{ scale: 1.07 }}
        >
          <ChevronLeft className="h-7 w-7 mr-2" /> BACK
        </motion.button>
        <ThemeToggle />
      </div>

      {/* Main animated login card */}
      <div className="flex flex-col items-center justify-center w-full min-h-screen pt-20 pb-12 md:py-32 z-20">
        <motion.div
          className="w-full max-w-md mx-auto"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65 }}
        >
          <motion.div
            className="relative p-5 sm:p-7 md:p-10 rounded-3xl border-8 border-[hsl(var(--accent-yellow))] shadow-2xl bg-black/85 arcade-shadow overflow-hidden"
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.12, duration: 0.57 }}
          >
            {/* animated particles layer, could optionally add here */}
            <div className="absolute inset-0 z-0 pointer-events-none">
              {theme === "dark" && (
                <div className="crt-effect opacity-70"></div>
              )}
            </div>
            {/* Animated controller */}
            <motion.div
              className="flex justify-center mb-7 relative z-20"
              initial={{ rotate: 0, scale: 0.85 }}
              animate={{
                rotate: [0, 5, -5, 0],
                scale: 1,
                boxShadow: "0 0 30px #ffd60a",
              }}
              transition={{ duration: 1.2 }}
            >
              <Gamepad2 className="h-16 w-16 text-[hsl(var(--accent-yellow))]" />
            </motion.div>
            {/* Headline */}
            <motion.h1
              className="text-3xl sm:text-4xl md:text-5xl font-bold font-pixel text-yellow-300 text-center mb-2 relative z-20"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.55 }}
              data-text={showOtp ? "VERIFY OTP" : "SIGN IN WITH VORLD"}
            >
              {showOtp ? "VERIFY OTP" : "SIGN IN WITH VORLD"}
            </motion.h1>
            <motion.p
              className="text-md md:text-lg text-white/80 text-center mb-7 mt-0 md:mt-3 relative z-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.44 }}
            >
              {showOtp
                ? "Enter the 6-digit code sent to your email"
                : "Access the ultimate Web3 arcade gaming platform"}
            </motion.p>

            {/* Animated form; shake on error, pulse on success */}
            <AnimatePresence mode="wait">
              {!showOtp ? (
                <motion.form
                  key="login"
                  onSubmit={handleLogin}
                  className="space-y-6 relative z-30"
                  initial={{ opacity: 0, x: -15 }}
                  exit={{ opacity: 0, x: 15 }}
                  transition={{ duration: 0.4 }}
                  animate={
                    formStatus === "error"
                      ? { x: [0, -8, 8, -6, 6, 0], opacity: 1 }
                      : formStatus === "success"
                      ? { scale: [1, 1.08, 0.97, 1.02, 1], opacity: 1, x: 0 }
                      : { opacity: 1, x: 0 }
                  }
                >
                  <div>
                    <label className="block text-lg font-bold mb-2 text-yellow-200 font-pixel tracking-wider">
                      EMAIL ADDRESS
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-yellow-100/70 z-30" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-14 pr-4 py-4 rounded-xl bg-black text-white border-4 border-yellow-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 text-lg font-mono outline-none z-20"
                        placeholder="Enter your email"
                        required
                        autoFocus
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-lg font-bold mb-2 text-yellow-200 font-pixel tracking-wider">
                      PASSWORD
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-yellow-100/70 z-30" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-14 pr-4 py-4 rounded-xl bg-black text-white border-4 border-yellow-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 text-lg font-mono outline-none z-20"
                        placeholder="Enter your password"
                        minLength={4}
                        required
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 bg-[hsl(var(--accent-purple))] text-white py-5 text-xl font-bold border-4 border-[hsl(var(--accent-purple)/0.7)] relative overflow-hidden group arcade-btn rounded-lg shadow-xl hover:bg-[hsl(var(--accent-yellow))] hover:text-black focus:bg-[hsl(var(--accent-yellow))] focus:text-black"
                    style={{ letterSpacing: "0.1ch" }}
                  >
                    <span className="relative z-10 flex items-center justify-center font-pixel">
                      {loading ? (
                        <>
                          <Zap className="mr-3 h-6 w-6 animate-spin" />
                          SIGNING IN…
                        </>
                      ) : (
                        <>
                          <Shield className="mr-3 h-6 w-6" />
                          SIGN IN
                          <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-2 transition-transform" />
                        </>
                      )}
                    </span>
                  </button>
                </motion.form>
              ) : (
                <motion.form
                  key="otp"
                  onSubmit={handleOtpVerification}
                  className="space-y-6 relative z-30"
                  initial={{ opacity: 0, x: 15 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.4 }}
                  animate={
                    formStatus === "error"
                      ? { x: [0, -7, 7, -5, 5, 0], opacity: 1 }
                      : formStatus === "success"
                      ? { scale: [1, 1.05, 0.97, 1.01, 1], opacity: 1, x: 0 }
                      : { opacity: 1, x: 0 }
                  }
                >
                  <div>
                    <label className="block text-lg font-bold mb-2 text-yellow-200 font-pixel tracking-wider">
                      VERIFICATION CODE
                    </label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full p-4 rounded-xl bg-black text-white border-4 border-yellow-400 focus:border-green-500 focus:ring-2 focus:ring-green-500 text-center text-3xl tracking-widest font-mono outline-none z-20"
                      placeholder="000000"
                      maxLength={6}
                      minLength={6}
                      autoFocus
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 bg-[hsl(var(--accent-green))] text-white py-5 text-xl font-bold border-4 border-[hsl(var(--accent-green)/0.7)] relative overflow-hidden group arcade-btn rounded-lg shadow-xl hover:bg-[hsl(var(--accent-yellow))] hover:text-black focus:bg-[hsl(var(--accent-yellow))] focus:text-black"
                    style={{ letterSpacing: "0.1ch" }}
                  >
                    <span className="relative z-10 flex items-center justify-center font-pixel">
                      {loading ? (
                        <>
                          <Zap className="mr-3 h-6 w-6 animate-spin" />
                          VERIFYING…
                        </>
                      ) : (
                        <>
                          <Shield className="mr-3 h-6 w-6" />
                          VERIFY OTP
                          <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-2 transition-transform" />
                        </>
                      )}
                    </span>
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
            {/* Footer retro ticker in card */}
            <motion.div
              className="mt-10 text-center text-sm text-yellow-200/70 font-pixel tracking-widest cursor-default select-none"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.33, duration: 0.4 }}
            >
              <span>
                By signing in, you agree to our Terms &amp; Privacy. <br />
                POWERED BY EMPIRE OF BITS
              </span>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
      {/* Responsive cursor for non-mobile users */}
      {!isMobile && (
        <motion.div
          className="fixed w-12 h-12 pointer-events-none z-50 mix-blend-difference hidden md:block"
          animate={{ x: cursorPosition.x - 24, y: cursorPosition.y - 24 }}
          transition={{ type: "tween", ease: "backOut", duration: 0.1 }}
        >
          <div className="w-full h-full border-3 border-current rotate-45 animate-pulse"></div>
        </motion.div>
      )}
    </div>
  );
}
