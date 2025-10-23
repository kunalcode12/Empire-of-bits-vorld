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
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState("");

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

    try {
      // Password will be automatically hashed with SHA-256 in authService
      const result = await authService.loginWithEmail(email, password);
      console.log("for login:", result);

      if (result.success) {
        localStorage.removeItem("authToken");
        localStorage.removeItem("refreshToken");

        localStorage.setItem("authToken", result.data.data.accessToken);
        localStorage.setItem("refreshToken", result.data.data.refreshToken);
        
        if (result.data.requiresOTP) {
          console.log(result.data);
          setShowOtp(true);
          toast({
            title: "OTP Required",
            description: "Please check your email for the verification code.",
            duration: 5000,
          });
        } else {
          // Login successful, redirect to games
          toast({
            title: "Login Successful!",
            description: "Welcome to Empire of Bits!",
            duration: 3000,
          });
          playSound("success");
          router.push("/games");
        }
      } else {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: result.error,
          duration: 5000,
        });
        playSound("error");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "An unexpected error occurred. Please try again.",
        duration: 5000,
      });
      playSound("error");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    playSound("click");

    try {
      const result = await authService.verifyOTP(email, otp);
      console.log(result);

      if (result.success) {
        toast({
          title: "Verification Successful!",
          description: "Welcome to Empire of Bits!",
          duration: 3000,
        });
        playSound("success");
        router.push("/games");
      } else {
        toast({
          variant: "destructive",
          title: "Verification Failed",
          description: result.error,
          duration: 5000,
        });
        playSound("error");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: "An unexpected error occurred. Please try again.",
        duration: 5000,
      });
      playSound("error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursorPosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const user = await authService.getProfile();
        console.log("profile:", user);
        // If user is already authenticated, redirect to games
        if (user.success) {
          router.push("/games");
        }
      } catch (err) {
        console.error("Failed to fetch profile", err);
      }
    })();
  }, [router]);

  return (
    <div className="min-h-screen bg-background text-foreground font-mono overflow-hidden relative">
      {/* Audio element for sound effects */}
      <audio ref={audioRef} className="hidden" />

      {/* Theme-specific effects */}
      <div className="fixed inset-0 pointer-events-none z-10">
        {theme === "dark" ? (
          <>
            {/* Dark theme effects */}
            <div className="absolute inset-0 bg-[url('/scanlines.png')] opacity-10"></div>
            <div className="absolute inset-0 bg-radial-gradient opacity-20"></div>
            <div className="absolute inset-0 crt-effect"></div>
          </>
        ) : (
          <>
            {/* Light theme effects */}
            <div className="absolute inset-0 dot-pattern"></div>
            <div className="absolute inset-0 animated-gradient"></div>
          </>
        )}
      </div>

      {/* Noise overlay */}
      <div className="noise"></div>

      {/* Custom cursor (desktop only) */}
      {!isMobile && (
        <motion.div
          className="fixed w-12 h-12 pointer-events-none z-50 mix-blend-difference hidden md:block"
          animate={{ x: cursorPosition.x - 24, y: cursorPosition.y - 24 }}
          transition={{ type: "tween", ease: "backOut", duration: 0.1 }}
        >
          <div className="w-full h-full border-3 border-current rotate-45 animate-pulse"></div>
        </motion.div>
      )}

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 py-5 bg-transparent">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <motion.button
            className="flex items-center arcade-btn-large"
            onClick={() => {
              router.push("/");
              playSound("click");
            }}
            onMouseEnter={() => playSound("hover")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronLeft className="h-8 w-8 mr-3" />
            <span className="text-xl">BACK</span>
          </motion.button>

          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative z-10 pt-28">
        <div className="min-h-screen flex items-center justify-center px-4">
          <motion.div
            className="w-full max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-background border-4 border-foreground p-8 retro-shadow relative">
              {/* CRT scanline effect */}
              <div className="absolute inset-0 bg-[url('/scanlines.png')] opacity-20 pointer-events-none"></div>
              <div className="absolute inset-0 crt-effect pointer-events-none"></div>

              {/* Header */}
              <div className="text-center mb-8 relative z-10">
                <motion.div
                  className="mb-4"
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Gamepad2 className="h-16 w-16 mx-auto mb-4 text-[hsl(var(--accent-yellow))]" />
                </motion.div>
                
                <h1
                  className="text-4xl font-bold mb-2 glitch-text"
                  data-text={showOtp ? "VERIFY OTP" : "SIGN IN WITH VORLD"}
                >
                  {showOtp ? "VERIFY OTP" : "SIGN IN WITH VORLD"}
                </h1>
                
                <p className="text-lg text-foreground/70">
                  {showOtp 
                    ? "Enter the 6-digit code sent to your email" 
                    : "Access the ultimate Web3 arcade gaming platform"
                  }
                </p>
              </div>

              {/* Form */}
              <AnimatePresence mode="wait">
                {!showOtp ? (
                  <motion.form
                    key="login"
                    onSubmit={handleLogin}
                    className="space-y-6 relative z-10"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div>
                      <label className="block text-lg font-bold mb-3 text-[hsl(var(--accent-yellow))]">
                        EMAIL ADDRESS
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-foreground/50" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-12 pr-4 py-4 bg-background border-3 border-foreground focus:border-[hsl(var(--accent-yellow))] outline-none text-lg arcade-btn"
                          placeholder="Enter your email"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-lg font-bold mb-3 text-[hsl(var(--accent-yellow))]">
                        PASSWORD
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-foreground/50" />
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-12 pr-4 py-4 bg-background border-3 border-foreground focus:border-[hsl(var(--accent-yellow))] outline-none text-lg arcade-btn"
                          placeholder="Enter your password"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-[hsl(var(--accent-purple))] text-white py-4 text-xl font-bold border-4 border-[hsl(var(--accent-purple)/0.7)] relative overflow-hidden group arcade-btn"
                      onMouseEnter={() => playSound("hover")}
                      onClick={() => playSound("click")}
                    >
                      <span className="relative z-10 flex items-center justify-center">
                        {loading ? (
                          <>
                            <Zap className="mr-3 h-6 w-6 animate-spin" />
                            SIGNING IN...
                          </>
                        ) : (
                          <>
                            <Shield className="mr-3 h-6 w-6" />
                            SIGN IN WITH VORLD
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
                    className="space-y-6 relative z-10"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div>
                      <label className="block text-lg font-bold mb-3 text-[hsl(var(--accent-yellow))]">
                        VERIFICATION CODE
                      </label>
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="w-full p-4 bg-background border-3 border-foreground focus:border-[hsl(var(--accent-yellow))] outline-none text-center text-3xl tracking-widest arcade-btn"
                        placeholder="000000"
                        maxLength={6}
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-[hsl(var(--accent-green))] text-white py-4 text-xl font-bold border-4 border-[hsl(var(--accent-green)/0.7)] relative overflow-hidden group arcade-btn"
                      onMouseEnter={() => playSound("hover")}
                      onClick={() => playSound("click")}
                    >
                      <span className="relative z-10 flex items-center justify-center">
                        {loading ? (
                          <>
                            <Zap className="mr-3 h-6 w-6 animate-spin" />
                            VERIFYING...
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

              {/* Footer */}
              <div className="mt-8 text-center text-sm text-foreground/70 relative z-10">
                <p>
                  By signing in, you agree to our Terms of Service and Privacy Policy
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
