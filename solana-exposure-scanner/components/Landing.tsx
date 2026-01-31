import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Shield, Zap, Lock, AlertCircle, Sparkles, Fingerprint } from 'lucide-react';
import { motion } from 'framer-motion';

const Landing: React.FC = () => {
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Demo wallet for demonstration
  const DEMO_WALLET = 'DL66m4cajzyz6659m8djQmuY5RdJpevhf7a5vFVEFech';

  const handleDemoScan = () => {
    navigate(`/scan/${DEMO_WALLET}`);
  };

  const validateAddress = (val: string) => {
    if (!val) return 'Address is required';
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    if (!base58Regex.test(val)) return 'Invalid Solana address format';
    return '';
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAddress = address.trim();
    const err = validateAddress(cleanAddress);
    if (err) {
      setError(err);
      return;
    }
    navigate(`/scan/${cleanAddress}`);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  const cardVariants = {
    hidden: { y: 50, opacity: 0, scale: 0.95 },
    visible: (i: number) => ({
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        delay: i * 0.1,
        type: "spring",
        stiffness: 80,
        damping: 12
      }
    })
  };

  return (
    <motion.div
      className="flex flex-col items-center text-center py-10 md:py-24 relative"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Animated Background Blobs */}
      <motion.div
        className="absolute top-0 -left-48 w-96 h-96 bg-solana-purple/10 rounded-full blur-[120px] pointer-events-none"
        animate={{
          x: [0, 50, 0],
          y: [0, 30, 0],
          scale: [1, 1.1, 1]
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute bottom-0 -right-48 w-96 h-96 bg-solana-green/10 rounded-full blur-[120px] pointer-events-none"
        animate={{
          x: [0, -50, 0],
          y: [0, -30, 0],
          scale: [1, 1.2, 1]
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      <motion.div
        variants={itemVariants}
        className="mb-10 px-6 py-2 rounded-full border border-solana-purple/20 bg-solana-purple/5 text-solana-purple text-[10px] font-black uppercase tracking-[0.5em] flex items-center gap-3"
        whileHover={{ scale: 1.05, borderColor: "rgba(153, 69, 255, 0.4)" }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        >
          <Sparkles className="w-3 h-3" />
        </motion.div>
        Advanced Privacy Intelligence
      </motion.div>

      <motion.h2
        variants={itemVariants}
        className="text-6xl md:text-9xl font-black mb-10 tracking-tighter leading-[0.85] uppercase"
      >
        Reveal your <br />
        <motion.span
          className="solana-text-gradient inline-block"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          On-chain dossier
        </motion.span>
      </motion.h2>

      <motion.p
        variants={itemVariants}
        className="text-lg md:text-2xl text-muted-foreground max-w-3xl mb-16 font-semibold leading-relaxed"
      >
        The ledger is permanent. We analyze your behavior, clusters, and social links to see how much of your <span className="text-foreground">real identity</span> is currently exposed.
      </motion.p>

      <motion.form
        variants={itemVariants}
        onSubmit={handleSearch}
        className="w-full max-w-4xl space-y-6 mb-12"
      >
        <div className="relative group">
          <motion.div
            className="absolute -inset-1 bg-gradient-to-r from-solana-green to-solana-purple rounded-[2rem] blur opacity-20"
            whileHover={{ opacity: 0.6 }}
            transition={{ duration: 0.3 }}
          />
          <div className="relative flex flex-col md:flex-row gap-4 p-2 bg-secondary/50 backdrop-blur-xl border border-white/10 rounded-[2rem]">
            <div className="relative flex-grow">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground w-6 h-6" />
              <input
                type="text"
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  setError('');
                }}
                placeholder="Paste Solana address (Base58)..."
                className="w-full bg-transparent h-16 pl-16 pr-6 rounded-2xl focus:outline-none transition-all text-xl font-mono placeholder:text-muted-foreground/30"
              />
            </div>
            <motion.button
              type="submit"
              className="bg-solana-purple hover:bg-solana-purple/90 h-16 px-12 rounded-2xl font-black text-xl shadow-2xl shadow-solana-purple/20 transition-all whitespace-nowrap uppercase tracking-widest text-white"
              whileHover={{ scale: 1.02, boxShadow: "0 20px 60px rgba(153, 69, 255, 0.4)" }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              Analyze Wallet
            </motion.button>
          </div>
        </div>
        {error && (
          <motion.div
            className="flex items-center justify-center gap-2 text-red-500 text-sm font-black uppercase tracking-widest"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <AlertCircle className="w-4 h-4" />
            {error}
          </motion.div>
        )}
      </motion.form>

      <motion.div
        variants={itemVariants}
        className="flex flex-wrap justify-center items-center gap-6 mb-8"
      >
        <motion.button
          type="button"
          onClick={handleDemoScan}
          className="px-8 py-4 bg-gradient-to-r from-solana-green to-solana-purple rounded-2xl font-black text-lg uppercase tracking-widest text-white shadow-2xl"
          whileHover={{ scale: 1.05, boxShadow: "0 20px 60px rgba(20, 241, 149, 0.4)" }}
          whileTap={{ scale: 0.95 }}
        >
          🚀 Try Demo Wallet
        </motion.button>
        <span className="text-muted-foreground text-sm">
          No wallet address? <span className="underline cursor-pointer hover:text-white" onClick={() => navigate('/privacy-score')}>See how it works</span> or see it in action!
        </span>
      </motion.div>



      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-left w-full max-w-7xl">
        {[
          {
            icon: Shield,
            bgIcon: Fingerprint,
            color: 'solana-green',
            title: 'Identity Leakage',
            description: 'Automated detection of SNS names (.sol), public social handles, and exchange-associated clusters.'
          },
          {
            icon: Zap,
            bgIcon: Zap,
            color: 'solana-purple',
            title: 'Pattern Pulse',
            description: 'Real-time behavior analysis identifies high-frequency trading signatures unique to your footprint.'
          },
          {
            icon: Lock,
            bgIcon: Lock,
            color: 'solana-green',
            title: 'Stealth Advice',
            description: 'Actionable intelligence on using selective privacy tools like encrypt.trade to decouple your assets.'
          }
        ].map((card, i) => (
          <motion.div
            key={card.title}
            custom={i}
            variants={cardVariants}
            whileHover={{
              y: -10,
              scale: 1.02,
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)"
            }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="p-10 rounded-[3rem] bg-secondary/20 border border-white/5 group relative overflow-hidden cursor-pointer"
          >
            <motion.div
              className="absolute top-0 right-0 p-8 opacity-5"
              whileHover={{ opacity: 0.15, scale: 1.1, rotate: 10 }}
              transition={{ duration: 0.6 }}
            >
              <card.bgIcon className={`w-32 h-32 text-${card.color}`} />
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.15, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <card.icon className={`w-12 h-12 text-${card.color} mb-8`} />
            </motion.div>
            <h3 className="text-2xl font-black mb-4 tracking-tighter uppercase">{card.title}</h3>
            <p className="text-muted-foreground font-medium leading-relaxed text-sm">{card.description}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default Landing;