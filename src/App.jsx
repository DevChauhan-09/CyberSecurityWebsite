import React, { useEffect, useRef, useState, useMemo } from 'react';
import './App.css';
import { 
  Sparkles, 
  ChevronDown 
} from 'lucide-react';

const TOTAL_FRAMES = 60;

export default function App() {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [loadedCount, setLoadedCount] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(1);
  const imagesRef = useRef([]);

  // Smooth frame interpolation refs
  const targetFrameRef = useRef(1);
  const currentFrameRef = useRef(1);
  const renderedFrameRef = useRef(-1);

  // Generate frame filenames
  const framePaths = useMemo(() => {
    return Array.from({ length: TOTAL_FRAMES }, (_, i) => {
      const frameNum = String(i + 1).padStart(5, '0');
      return `/frames/frame${frameNum}.png`;
    });
  }, []);

  // Preload all 60 frames
  useEffect(() => {
    let mounted = true;
    let loaded = 0;
    const images = [];

    framePaths.forEach((path, index) => {
      const img = new Image();
      img.src = path;
      img.onload = () => {
        if (!mounted) return;
        loaded += 1;
        setLoadedCount(loaded);
        // Draw the first frame as soon as frame 1 finishes loading
        if (index === 0 && canvasRef.current) {
          renderFrame(img);
        }
      };
      images.push(img);
    });

    imagesRef.current = images;

    return () => {
      mounted = false;
    };
  }, [framePaths]);

  // Helper to draw an image to the canvas covering cleanly
  const renderFrame = (img) => {
    const canvas = canvasRef.current;
    if (!canvas || !img || !img.complete || img.naturalWidth === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Adjust canvas resolution to display size
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    // Compute "cover" fit so the animation completely covers the hero background
    const imgRatio = img.naturalWidth / img.naturalHeight;
    const canvasRatio = width / height;

    let drawWidth, drawHeight, offsetX, offsetY;

    if (canvasRatio > imgRatio) {
      // Screen is wider than image: match width, overflow height
      drawWidth = width;
      drawHeight = width / imgRatio;
      offsetX = 0;
      offsetY = (height - drawHeight) / 2;
    } else {
      // Screen is taller than image: match height, overflow width
      drawHeight = height;
      drawWidth = height * imgRatio;
      offsetX = (width - drawWidth) / 2;
      offsetY = 0;
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    ctx.restore();
  };

  // Continuous smooth interpolation animation loop
  useEffect(() => {
    let animationFrameId;

    const smoothStep = () => {
      // Smooth linear interpolation (lerp factor 0.18)
      const diff = targetFrameRef.current - currentFrameRef.current;
      if (Math.abs(diff) > 0.005) {
        currentFrameRef.current += diff * 0.18;
      } else {
        currentFrameRef.current = targetFrameRef.current;
      }

      const activeIndex = Math.min(
        Math.max(Math.round(currentFrameRef.current), 1),
        TOTAL_FRAMES
      );

      if (activeIndex !== renderedFrameRef.current) {
        const targetImg = imagesRef.current[activeIndex - 1];
        if (targetImg && targetImg.complete) {
          renderFrame(targetImg);
          renderedFrameRef.current = activeIndex;
          setCurrentFrameIndex(activeIndex);
        }
      }

      animationFrameId = requestAnimationFrame(smoothStep);
    };

    animationFrameId = requestAnimationFrame(smoothStep);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Listen to scroll and map target scroll progress to frame target
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const containerHeight = containerRef.current.offsetHeight;
      const windowHeight = window.innerHeight;

      const maxScroll = containerHeight - windowHeight;
      if (maxScroll <= 0) return;

      const currentScroll = -rect.top;
      const rawProgress = Math.min(Math.max(currentScroll / maxScroll, 0), 1);

      setScrollProgress(rawProgress);

      // Target frame calculated from scroll progress (1 to 60)
      targetFrameRef.current = 1 + rawProgress * (TOTAL_FRAMES - 1);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);

    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  const isLoaded = loadedCount >= TOTAL_FRAMES;
  const loadPercentage = Math.round((loadedCount / TOTAL_FRAMES) * 100);

  // Dynamic hero texts based on scroll stage
  const heroPhaseTitle = useMemo(() => {
    if (scrollProgress < 0.3) {
      return { tag: 'Phase 01: Assembly', desc: 'Precision engineered hardware architecture unfolding.' };
    } else if (scrollProgress < 0.7) {
      return { tag: 'Phase 02: Core Synthesis', desc: 'Real-time structural alignment & internal component breakdown.' };
    } else {
      return { tag: 'Phase 03: Full Activation', desc: 'Complete integration, maximum stability, ready for deployment.' };
    }
  }, [scrollProgress]);

  return (
    <div className="app-container">
      {/* Top Navigation Bar with brand on the left, spaced items, and CTA */}
      <header className="navbar">
        <div className="nav-brand">
          <div className="logo-badge">
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
          </div>
          <span>NextShield</span>
        </div>

        <nav className="nav-links">
          <a href="#platform">Platform</a>
          <a href="#solution">Solution</a>
          <a href="#why-nextshield">Why NextShield</a>
          <a href="#partners">Partners</a>
          <a href="#resources">Resources</a>
        </nav>

        <div className="nav-actions">
          <a href="#demo" className="nav-demo-btn">
            Get a Demo
          </a>
        </div>
      </header>

      {/* Hero Section with Scroll Canvas Animation */}
      <section id="hero" className="hero-scroll-container" ref={containerRef}>
        <div className="hero-sticky-stage">
          <canvas ref={canvasRef} className="hero-canvas" />
          <div className="stage-vignette" />

          {/* Overlay Hero Content */}
          <div className="hero-overlay-content">
            <div className="tag-badge">
              <span className="pulse-dot"></span>
              <span>Next-Gen Visual Motion Experience</span>
            </div>

            <h1 className="hero-title">
              Engineered With Absolute Precision
            </h1>

            <p className="hero-subtitle">
              Scroll down to scrub smoothly through 60 high-fidelity motion frames rendered dynamically on canvas.
            </p>

            <div className="hero-phase-info">
              <div className="phase-pill">
                <Sparkles size={16} color="var(--accent-cyan)" />
                <span>{heroPhaseTitle.tag}</span>
                <span style={{ opacity: 0.4 }}>•</span>
                <span style={{ color: 'var(--text-muted)' }}>{heroPhaseTitle.desc}</span>
              </div>
            </div>
          </div>

          {/* Progress / HUD */}
          <div className="scroll-hud">
            <div className="hud-progress-bar">
              <div 
                className="hud-progress-fill" 
                style={{ width: `${Math.round(scrollProgress * 100)}%` }} 
              />
            </div>
            <span className="hud-label">
              Frame {String(currentFrameIndex).padStart(2, '0')} / {TOTAL_FRAMES} ({Math.round(scrollProgress * 100)}%)
            </span>
            <ChevronDown size={14} color="var(--text-muted)" style={{ marginTop: '2px', animation: 'bounce 2s infinite' }} />
          </div>

          {/* Loader indicator if still fetching */}
          {!isLoaded && (
            <div className="loading-hud">
              <div className="loader-spinner" />
              <span>Caching motion frames ({loadPercentage}%)</span>
            </div>
          )}
        </div>
      </section>

      {/* Content Sections from Full Design Below Scroll Animation */}
      <div className="relative z-10 bg-background text-on-surface antialiased selection:bg-mint-100 selection:text-mint-700 font-body-md text-body-md">
        {/* Subtle Warm Cloud Ambient Gradients */}
        <div className="pointer-events-none overflow-hidden absolute inset-0 -z-10">
          <div className="absolute top-[5%] left-1/2 -translate-x-1/2 w-[900px] h-[550px] bg-[#eeddc9] rounded-full blur-[130px] opacity-80"></div>
          <div className="absolute top-[35%] -left-[10%] w-[650px] h-[650px] bg-mint-50 rounded-full blur-[150px] opacity-70"></div>
          <div className="absolute top-[65%] -right-[10%] w-[700px] h-[700px] bg-lilac-100 rounded-full blur-[170px] opacity-65"></div>
        </div>

        {/* SUPPORTED PLATFORMS SECTION */}
        <section className="py-12 border-y border-outline-variant/50 bg-surface-container-low/60" id="platforms">
          <div className="px-space-lg md:px-margin max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="md:max-w-xs text-center md:text-left">
                <p className="text-label-sm font-label-sm text-mint-600 tracking-wider uppercase mb-1 font-semibold">TOTAL PLATFORM COVERAGE</p>
                <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  Securing 100% of Your Digital Surface
                </h2>
              </div>
              {/* Platform Grid / Pills */}
              <div className="flex flex-wrap items-center justify-center md:justify-end gap-3 flex-1">
                <div className="warm-glass-card px-4 py-2.5 rounded-full flex items-center gap-2.5 hover:border-mint-500/60 transition-all hover:-translate-y-0.5 group">
                  <span className="material-symbols-outlined text-primary text-[20px] group-hover:text-mint-500 transition-colors">travel_explore</span>
                  <span className="text-label-md font-label-md text-on-surface font-medium">Chrome &amp; Browsers</span>
                </div>
                <div className="warm-glass-card px-4 py-2.5 rounded-full flex items-center gap-2.5 hover:border-mint-500/60 transition-all hover:-translate-y-0.5 group">
                  <span className="material-symbols-outlined text-primary text-[20px] group-hover:text-mint-500 transition-colors">smartphone</span>
                  <span className="text-label-md font-label-md text-on-surface font-medium">iOS &amp; Android</span>
                </div>
                <div className="warm-glass-card px-4 py-2.5 rounded-full flex items-center gap-2.5 hover:border-mint-500/60 transition-all hover:-translate-y-0.5 group">
                  <span className="material-symbols-outlined text-primary text-[20px] group-hover:text-mint-500 transition-colors">cloud_done</span>
                  <span className="text-label-md font-label-md text-on-surface font-medium">AWS &amp; Cloud Infra</span>
                </div>
                <div className="warm-glass-card px-4 py-2.5 rounded-full flex items-center gap-2.5 hover:border-mint-500/60 transition-all hover:-translate-y-0.5 group">
                  <span className="material-symbols-outlined text-primary text-[20px] group-hover:text-mint-500 transition-colors">forum</span>
                  <span className="text-label-md font-label-md text-on-surface font-medium">Slack &amp; Teams</span>
                </div>
                <div className="warm-glass-card px-4 py-2.5 rounded-full flex items-center gap-2.5 hover:border-mint-500/60 transition-all hover:-translate-y-0.5 group">
                  <span className="material-symbols-outlined text-primary text-[20px] group-hover:text-mint-500 transition-colors">mail_lock</span>
                  <span className="text-label-md font-label-md text-on-surface font-medium">Gmail &amp; Workspace</span>
                </div>
                <div className="warm-glass-card px-4 py-2.5 rounded-full flex items-center gap-2.5 hover:border-mint-500/60 transition-all hover:-translate-y-0.5 group">
                  <span className="material-symbols-outlined text-primary text-[20px] group-hover:text-mint-500 transition-colors">terminal</span>
                  <span className="text-label-md font-label-md text-on-surface font-medium">GitHub &amp; Dev CI/CD</span>
                </div>
                <div className="warm-glass-card px-4 py-2.5 rounded-full flex items-center gap-2.5 hover:border-mint-500/60 transition-all hover:-translate-y-0.5 group">
                  <span className="material-symbols-outlined text-primary text-[20px] group-hover:text-mint-500 transition-colors">shopping_cart_checkout</span>
                  <span className="text-label-md font-label-md text-on-surface font-medium">Shopify &amp; Payments</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CORE PROTECTION PILLARS (BENTO GRID) */}
        <section className="py-20 md:py-28 px-space-lg md:px-margin max-w-7xl mx-auto" id="capabilities">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-mint-100 text-mint-700 font-label-sm font-semibold tracking-wider uppercase border border-mint-500/20">
              Autonomous Architecture
            </div>
            <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface tracking-tight">
              Four Impregnable Pillars of Defense
            </h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant">
              Built from the ground up for instantaneous threat interception, zero-knowledge isolation, and cross-platform synergy.
            </p>
          </div>
          {/* Bento Grid (4 Cards) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
            {/* Bento Card 1: Autonomous Perimeter Guard (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-8 relative overflow-hidden border border-outline-variant/70 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="absolute -right-16 -top-16 w-56 h-56 bg-mint-50 rounded-full blur-2xl"></div>
              <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-mint-100 border border-mint-500/30 flex items-center justify-center text-mint-600 shadow-xs">
                  <span className="material-symbols-outlined text-2xl" data-weight="fill">security</span>
                </div>
                <span className="font-label-sm text-label-sm px-3 py-1 rounded-full bg-mint-50 text-mint-700 border border-mint-500/20 font-mono font-medium">
                  0-DAY FIREWALL
                </span>
              </div>
              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface mb-3 relative z-10">
                Autonomous Perimeter Guard
              </h3>
              <p className="text-body-md font-body-md text-on-surface-variant leading-relaxed mb-6 relative z-10">
                Real-time neural packet inspection operating at sub-millisecond speeds. Neutralizes ransomware, stealth payloads, and memory injection vulnerabilities before execution touches your machine.
              </p>
              <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant font-mono text-[11px] space-y-1.5 text-on-surface-variant relative z-10">
                <div className="flex items-center justify-between text-outline">
                  <span>RULESET: #NX-AUTOPROTECT-ACTIVE</span>
                  <span className="text-mint-600 flex items-center gap-1 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-mint-500 animate-ping"></span> INLINE
                  </span>
                </div>
                <div className="text-on-surface"><span className="text-primary font-semibold">&gt; INTERCEPT:</span> TCP payload [45.142.x.x:443] -&gt; Hash: 0x9f8c4...</div>
                <div className="text-mint-700 font-semibold"><span className="text-mint-600">&gt; VERDICT:</span> ZERO-DAY SHELLCODE BLOCKED (Quarantined in 0.28ms)</div>
              </div>
            </div>
            {/* Bento Card 2: Unified Identity & Vault (5 cols) */}
            <div className="lg:col-span-5 bg-white rounded-3xl p-8 relative overflow-hidden border border-outline-variant/70 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between">
              <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-primary-fixed/20 rounded-full blur-2xl"></div>
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-primary-fixed/40 border border-primary/20 flex items-center justify-center text-primary shadow-xs">
                    <span className="material-symbols-outlined text-2xl" data-weight="fill">key</span>
                  </div>
                  <span className="font-label-sm text-label-sm px-3 py-1 rounded-full bg-surface-container text-primary border border-primary/20 font-mono font-medium">
                    ZERO-KNOWLEDGE
                  </span>
                </div>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface mb-3">
                  Unified Identity &amp; Biometric Vault
                </h3>
                <p className="text-body-md font-body-md text-on-surface-variant leading-relaxed mb-4">
                  Decentralized hardware-backed credential storage with automatic rotation, passkey integration, and session hijack mitigation.
                </p>
              </div>
              <div className="pt-4 border-t border-outline-variant/60 flex items-center justify-between text-label-sm font-label-sm text-on-surface">
                <span className="flex items-center gap-1.5 text-mint-700 font-semibold">
                  <span className="material-symbols-outlined text-[17px] text-mint-500">fingerprint</span> Biometric Key Auth
                </span>
                <span className="font-mono text-outline">FIPS 140-3 Validated</span>
              </div>
            </div>
            {/* Bento Card 3: Anti-Phishing & Social Cloak (5 cols) */}
            <div className="lg:col-span-5 bg-white rounded-3xl p-8 relative overflow-hidden border border-outline-variant/70 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between">
              <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-lilac-100 rounded-full blur-2xl"></div>
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-lilac-100 border border-lilac-200 flex items-center justify-center text-tertiary shadow-xs">
                    <span className="material-symbols-outlined text-2xl" data-weight="fill">visibility_off</span>
                  </div>
                  <span className="font-label-sm text-label-sm px-3 py-1 rounded-full bg-lilac-100 text-tertiary border border-lilac-200 font-mono font-medium">
                    DEEPFAKE SHIELD
                  </span>
                </div>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface mb-3">
                  Anti-Phishing &amp; Social Cloak
                </h3>
                <p className="text-body-md font-body-md text-on-surface-variant leading-relaxed">
                  Scans incoming communication across email, Teams, Discord, and SMS for spoofed domains, deceptive OAuth prompts, and synthetic generative identity attacks.
                </p>
              </div>
              <div className="mt-6 flex items-center gap-2 px-3 py-2 rounded-2xl bg-surface-container-low border border-outline-variant text-label-sm">
                <span className="material-symbols-outlined text-mint-500 text-[18px]">check_circle</span>
                <span className="text-on-surface font-medium">1,490,000 deceptive URLs mapped weekly</span>
              </div>
            </div>
            {/* Bento Card 4: Cross-Platform Telemetry (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-8 relative overflow-hidden border border-outline-variant/70 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-2xl bg-mint-100 border border-mint-500/30 flex items-center justify-center text-mint-600 shadow-xs">
                  <span className="material-symbols-outlined text-2xl" data-weight="fill">hub</span>
                </div>
                <span className="font-label-sm text-label-sm px-3 py-1 rounded-full bg-surface-container text-primary border border-outline-variant font-mono font-medium">
                  REAL-TIME MESH
                </span>
              </div>
              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface mb-3">
                Cross-Platform Mesh Telemetry
              </h3>
              <p className="text-body-md font-body-md text-on-surface-variant leading-relaxed mb-6">
                Your protective posture syncs in real time. Flag an anomalous sign-in on your MacBook, and your iPhone, iPad, and Cloud cluster instantly harden firewall parameters simultaneously.
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant text-center">
                  <span className="material-symbols-outlined text-primary text-xl mb-1">laptop_mac</span>
                  <div className="text-label-sm font-bold text-on-surface">macOS / Windows</div>
                  <div className="text-[10px] text-mint-600 font-mono font-semibold">Shielded</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant text-center">
                  <span className="material-symbols-outlined text-primary text-xl mb-1">phone_iphone</span>
                  <div className="text-label-sm font-bold text-on-surface">Mobile iOS / Android</div>
                  <div className="text-[10px] text-mint-600 font-mono font-semibold">Encrypted</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant text-center">
                  <span className="material-symbols-outlined text-primary text-xl mb-1">dns</span>
                  <div className="text-label-sm font-bold text-on-surface">Cloud API &amp; VPS</div>
                  <div className="text-[10px] text-primary font-mono font-semibold">Active Mesh</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* LIVE TELEMETRY DASHBOARD SHOWCASE */}
        <section className="py-20 bg-surface-container-low/70 border-y border-outline-variant/60 relative overflow-hidden" id="telemetry">
          <div className="px-space-lg md:px-margin max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-center">
              {/* Left side copy */}
              <div className="lg:col-span-5 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-mint-100 text-mint-700 font-label-sm uppercase font-semibold border border-mint-500/20">
                  <span className="w-2 h-2 rounded-full bg-mint-500 animate-ping"></span>
                  Live Threat Telemetry
                </div>
                <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">
                  Autonomous Awareness. Instant Remediation.
                </h2>
                <p className="font-body-lg text-body-lg text-on-surface-variant">
                  NextShield doesn’t just notify you after a breach occurs. It intercepts vectors, reroutes network spoofing, and quenches session hijacking before it surfaces to the operating system.
                </p>
                <ul className="space-y-4 pt-2">
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-mint-100 text-mint-700 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                      <span className="material-symbols-outlined text-[16px]" data-weight="fill">check</span>
                    </span>
                    <div>
                      <h4 className="font-headline-sm text-[16px] font-bold text-on-surface">Zero Performance Friction</h4>
                      <p className="text-body-sm text-on-surface-variant">Operates via kernel-optimized Rust binaries with less than 1% CPU utilization.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-mint-100 text-mint-700 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                      <span className="material-symbols-outlined text-[16px]" data-weight="fill">check</span>
                    </span>
                    <div>
                      <h4 className="font-headline-sm text-[16px] font-bold text-on-surface">Autonomous DNS Sinkhole</h4>
                      <p className="text-body-sm text-on-surface-variant">Stops spyware telemetry callbacks, ad-trackers, and crypto drainers.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-mint-100 text-mint-700 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                      <span className="material-symbols-outlined text-[16px]" data-weight="fill">check</span>
                    </span>
                    <div>
                      <h4 className="font-headline-sm text-[16px] font-bold text-on-surface">One-Click Panic Lock</h4>
                      <p className="text-body-sm text-on-surface-variant">Instantly sever all outbound connections while retaining local encrypted data.</p>
                    </div>
                  </li>
                </ul>
              </div>
              {/* Right side Interactive Dashboard Mockup Card */}
              <div className="lg:col-span-7">
                <div className="bg-white rounded-3xl p-6 border border-outline-variant/80 shadow-lg space-y-6">
                  {/* Dashboard Header Bar */}
                  <div className="flex flex-wrap items-center justify-between pb-4 border-b border-outline-variant/60 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-3.5 h-3.5 rounded-full bg-mint-500 animate-pulse"></div>
                      <div>
                        <h3 className="font-headline-sm text-[17px] font-bold text-on-surface">Global Perimeter Sentinel</h3>
                        <p className="text-label-sm font-label-sm text-outline">NODE_ID: NX-CORE-EAST-US-09</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-mint-100 text-mint-700 text-label-sm font-label-sm font-bold border border-mint-500/20">
                        STATUS: NOMINAL
                      </span>
                      <span className="px-3 py-1 rounded-full bg-surface-container text-on-surface-variant text-label-sm font-label-sm border border-outline-variant font-medium">
                        UPTIME: 99.999%
                      </span>
                    </div>
                  </div>
                  {/* Metrics Tri-Column */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/60">
                      <p className="text-label-sm font-label-sm text-on-surface-variant mb-1">Threats Neutralized Today</p>
                      <p className="font-headline-lg text-headline-md font-bold text-mint-600 font-mono">4,821</p>
                      <span className="text-[11px] text-mint-700 flex items-center gap-1 font-mono mt-1 font-medium">
                        <span className="material-symbols-outlined text-[14px]">trending_up</span> +14% vs yesterday
                      </span>
                    </div>
                    <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/60">
                      <p className="text-label-sm font-label-sm text-on-surface-variant mb-1">Defense Health Score</p>
                      <p className="font-headline-lg text-headline-md font-bold text-primary font-mono">99.8<span className="text-sm font-normal text-outline">/100</span></p>
                      <span className="text-[11px] text-primary flex items-center gap-1 font-mono mt-1 font-medium">
                        <span className="material-symbols-outlined text-[14px]">verified</span> Max Hardening
                      </span>
                    </div>
                    <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/60">
                      <p className="text-label-sm font-label-sm text-on-surface-variant mb-1">Active Mesh Tunnels</p>
                      <p className="font-headline-lg text-headline-md font-bold text-on-surface font-mono">14 <span className="text-sm font-normal text-outline">Nodes</span></p>
                      <span className="text-[11px] text-on-surface-variant flex items-center gap-1 font-mono mt-1 font-medium">
                        <span className="material-symbols-outlined text-[14px] text-mint-600">lan</span> Full Duplex Sync
                      </span>
                    </div>
                  </div>
                  {/* Live Intercept Feed Stream */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-label-sm font-label-sm text-on-surface-variant mb-2">
                      <span className="font-semibold">LIVE RECEPTOR LOGS</span>
                      <span className="font-mono text-mint-600 flex items-center gap-1 font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-mint-500 animate-pulse"></span> STREAMING
                      </span>
                    </div>
                    <div className="space-y-2 text-label-sm font-mono">
                      <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="w-2 h-2 rounded-full bg-mint-500"></span>
                          <span className="text-on-surface font-medium">[BROWSER] Cross-site script vector blocked</span>
                        </div>
                        <span className="text-outline text-[11px]">1.2s ago</span>
                      </div>
                      <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="w-2 h-2 rounded-full bg-mint-500"></span>
                          <span className="text-on-surface font-medium">[EMAIL] Deceptive spoofed banking SPF drop</span>
                        </div>
                        <span className="text-outline text-[11px]">4.7s ago</span>
                      </div>
                      <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="w-2 h-2 rounded-full bg-primary"></span>
                          <span className="text-on-surface font-medium">[CLOUD API] Unauthorized token refresh revoked</span>
                        </div>
                        <span className="text-outline text-[11px]">11.0s ago</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS (3 CLEAR STEPS) */}
        <section className="py-20 md:py-28 px-space-lg md:px-margin max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-highest border border-outline-variant text-on-surface-variant font-label-sm uppercase font-semibold">
              Zero-Friction Deployment
            </div>
            <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">
              Three Steps to Total Immunity
            </h2>
            <p className="font-body-md text-on-surface-variant">
              No complicated enterprise servers or cumbersome IT setup. Get defended in less than 90 seconds.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="bg-white p-8 rounded-3xl relative border border-outline-variant/70 hover:border-mint-500/50 shadow-sm hover:shadow-md transition-all">
              <div className="font-mono text-display font-extrabold text-outline-variant/40 absolute right-6 top-6">01</div>
              <div className="w-14 h-14 rounded-2xl bg-mint-100 border border-mint-500/30 flex items-center justify-center text-mint-600 mb-6 shadow-xs">
                <span className="material-symbols-outlined text-3xl">download_for_offline</span>
              </div>
              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface mb-2">
                One-Click Install &amp; Connect
              </h3>
              <p className="text-body-md text-on-surface-variant leading-relaxed">
                Download the native agent on iOS, macOS, Windows, Android, or inject the lightweight browser plugin with zero manual config required.
              </p>
            </div>
            {/* Step 2 */}
            <div className="bg-white p-8 rounded-3xl relative border border-outline-variant/70 hover:border-primary/50 shadow-sm hover:shadow-md transition-all">
              <div className="font-mono text-display font-extrabold text-outline-variant/40 absolute right-6 top-6">02</div>
              <div className="w-14 h-14 rounded-2xl bg-primary-fixed/40 border border-primary/20 flex items-center justify-center text-primary mb-6 shadow-xs">
                <span className="material-symbols-outlined text-3xl">psychology</span>
              </div>
              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface mb-2">
                Continuous Defense
              </h3>
              <p className="text-body-md text-on-surface-variant leading-relaxed">
                Autonomous machine intelligence isolates your personal attack vectors, seals open ports, and wraps all communication in cryptographic cloaks.
              </p>
            </div>
            {/* Step 3 */}
            <div className="bg-white p-8 rounded-3xl relative border border-outline-variant/70 hover:border-mint-500/50 shadow-sm hover:shadow-md transition-all">
              <div className="font-mono text-display font-extrabold text-outline-variant/40 absolute right-6 top-6">03</div>
              <div className="w-14 h-14 rounded-2xl bg-mint-100 border border-mint-500/30 flex items-center justify-center text-mint-600 mb-6 shadow-xs">
                <span className="material-symbols-outlined text-3xl">health_and_safety</span>
              </div>
              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface mb-2">
                Total Peace of Mind
              </h3>
              <p className="text-body-md text-on-surface-variant leading-relaxed">
                Receive automated real-time counter-measure logs and proactive identity breach monitors without ever breaking your online workflow.
              </p>
            </div>
          </div>
        </section>

        {/* TRUST PROOF & TESTIMONIALS */}
        <section className="py-20 bg-surface-container-low/50 border-y border-outline-variant/60" id="reviews">
          <div className="px-space-lg md:px-margin max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-mint-600 font-label-sm uppercase font-semibold">
                  <span className="material-symbols-outlined text-[18px]" data-weight="fill">grade</span>
                  <span>4.9 / 5 Rating Across 18,000+ Reviews</span>
                </div>
                <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">
                  Trusted by Digital Nomads &amp; Fortune 500 CISOs
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex text-[#f59e0b]">
                  <span className="material-symbols-outlined text-[20px]" data-weight="fill">star</span>
                  <span className="material-symbols-outlined text-[20px]" data-weight="fill">star</span>
                  <span className="material-symbols-outlined text-[20px]" data-weight="fill">star</span>
                  <span className="material-symbols-outlined text-[20px]" data-weight="fill">star</span>
                  <span className="material-symbols-outlined text-[20px]" data-weight="fill">star</span>
                </div>
                <span className="text-on-surface font-bold text-body-md">99.4% Defended Satisfaction</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Review 1 */}
              <div className="bg-white p-6 rounded-3xl border border-outline-variant/70 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1 text-[#f59e0b] mb-4">
                    <span className="material-symbols-outlined text-[16px]" data-weight="fill">star</span>
                    <span className="material-symbols-outlined text-[16px]" data-weight="fill">star</span>
                    <span className="material-symbols-outlined text-[16px]" data-weight="fill">star</span>
                    <span className="material-symbols-outlined text-[16px]" data-weight="fill">star</span>
                    <span className="material-symbols-outlined text-[16px]" data-weight="fill">star</span>
                  </div>
                  <p className="text-body-md text-on-surface-variant leading-relaxed italic mb-6">
                    “NextShield stopped a targeted spear-phishing token extraction attack that bypassed our enterprise cloud email filters completely. Its cross-platform synchronization is unmatched.”
                  </p>
                </div>
                <div className="flex items-center gap-3 pt-4 border-t border-outline-variant/50">
                  <div className="w-10 h-10 rounded-full bg-mint-100 text-mint-700 font-bold flex items-center justify-center font-headline-sm text-sm">
                    MK
                  </div>
                  <div>
                    <p className="font-bold text-on-surface text-body-sm">Marcus Vance</p>
                    <p className="text-label-sm font-label-sm text-outline">Chief Information Security Officer, FinCloud</p>
                  </div>
                </div>
              </div>
              {/* Review 2 */}
              <div className="bg-white p-6 rounded-3xl border border-outline-variant/70 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1 text-[#f59e0b] mb-4">
                    <span className="material-symbols-outlined text-[16px]" data-weight="fill">star</span>
                    <span className="material-symbols-outlined text-[16px]" data-weight="fill">star</span>
                    <span className="material-symbols-outlined text-[16px]" data-weight="fill">star</span>
                    <span className="material-symbols-outlined text-[16px]" data-weight="fill">star</span>
                    <span className="material-symbols-outlined text-[16px]" data-weight="fill">star</span>
                  </div>
                  <p className="text-body-md text-on-surface-variant leading-relaxed italic mb-6">
                    “As a founder running a remote distributed team across 9 countries, knowing our session tokens and git repos are protected by NextShield gives me uninterrupted sleep.”
                  </p>
                </div>
                <div className="flex items-center gap-3 pt-4 border-t border-outline-variant/50">
                  <div className="w-10 h-10 rounded-full bg-primary-fixed/40 text-primary font-bold flex items-center justify-center font-headline-sm text-sm">
                    EL
                  </div>
                  <div>
                    <p className="font-bold text-on-surface text-body-sm">Elena Rostova</p>
                    <p className="text-label-sm font-label-sm text-outline">Co-Founder, Synthetix AI</p>
                  </div>
                </div>
              </div>
              {/* Review 3 */}
              <div className="bg-white p-6 rounded-3xl border border-outline-variant/70 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1 text-[#f59e0b] mb-4">
                    <span className="material-symbols-outlined text-[16px]" data-weight="fill">star</span>
                    <span className="material-symbols-outlined text-[16px]" data-weight="fill">star</span>
                    <span className="material-symbols-outlined text-[16px]" data-weight="fill">star</span>
                    <span className="material-symbols-outlined text-[16px]" data-weight="fill">star</span>
                    <span className="material-symbols-outlined text-[16px]" data-weight="fill">star</span>
                  </div>
                  <p className="text-body-md text-on-surface-variant leading-relaxed italic mb-6">
                    “Zero latency penalty while compiling code or gaming. Other antivirus software slows machines to a crawl; NextShield feels completely invisible yet impenetrable.”
                  </p>
                </div>
                <div className="flex items-center gap-3 pt-4 border-t border-outline-variant/50">
                  <div className="w-10 h-10 rounded-full bg-lilac-100 text-tertiary font-bold flex items-center justify-center font-headline-sm text-sm">
                    DA
                  </div>
                  <div>
                    <p className="font-bold text-on-surface text-body-sm">David Chen</p>
                    <p className="text-label-sm font-label-sm text-outline">Lead Infrastructure Architect</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TRANSPARENT PRICING TIERS */}
        <section className="py-20 md:py-28 px-space-lg md:px-margin max-w-7xl mx-auto" id="pricing">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-mint-100 text-mint-700 font-label-sm uppercase font-semibold border border-mint-500/20">
              Predictable Defense
            </div>
            <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">
              Transparent, Zero-Commitment Pricing
            </h2>
            <p className="font-body-md text-on-surface-variant">
              Start your 14-day free trial. Cancel anytime with a single click.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            {/* Tier 1: Solo Shield */}
            <div className="bg-white p-8 rounded-3xl border border-outline-variant/80 flex flex-col justify-between shadow-sm hover:border-outline transition-all">
              <div>
                <div className="mb-4">
                  <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Solo Shield</h3>
                  <p className="text-body-sm text-on-surface-variant mt-1">Essential protection for individual creators &amp; professionals.</p>
                </div>
                <div className="my-6">
                  <span className="font-display text-4xl font-extrabold text-on-surface font-mono">$9</span>
                  <span className="text-on-surface-variant font-mono"> / month</span>
                </div>
                <ul className="space-y-3 text-body-sm text-on-surface mb-8">
                  <li className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-mint-600 text-[18px]">check</span>
                    <span>Up to 3 Active Devices</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-mint-600 text-[18px]">check</span>
                    <span>Autonomous Web &amp; Browser Guard</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-mint-600 text-[18px]">check</span>
                    <span>Real-Time Phishing Cloak</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-mint-600 text-[18px]">check</span>
                    <span>Zero-Knowledge Credential Vault</span>
                  </li>
                </ul>
              </div>
              <button className="w-full py-3 rounded-full bg-surface-container-low hover:bg-surface-container text-primary font-semibold border border-outline-variant/60 font-label-lg transition-all">
                Start 14-Day Free Trial
              </button>
            </div>
            {/* Tier 2: Pro Defense (Featured) */}
            <div className="warm-glass-elevated p-8 rounded-3xl border-2 border-mint-500 relative flex flex-col justify-between">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-mint-500 text-white font-label-sm font-bold tracking-wider uppercase shadow-xs">
                MOST POPULAR
              </div>
              <div>
                <div className="mb-4">
                  <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Pro Defense</h3>
                  <p className="text-body-sm text-on-surface-variant mt-1">Uncompromising continuous defense across all personal &amp; work ecosystems.</p>
                </div>
                <div className="my-6">
                  <span className="font-display text-4xl font-extrabold text-mint-600 font-mono">$19</span>
                  <span className="text-on-surface-variant font-mono"> / month</span>
                </div>
                <ul className="space-y-3 text-body-sm text-on-surface mb-8">
                  <li className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-mint-600 text-[18px]" data-weight="fill">verified</span>
                    <span className="font-semibold text-on-surface">Unlimited Devices Synced</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-mint-600 text-[18px]">check</span>
                    <span>Zero-Day Quantum Memory Defense</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-mint-600 text-[18px]">check</span>
                    <span>SaaS &amp; Cloud API Integration</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-mint-600 text-[18px]">check</span>
                    <span>Encrypted Cloud Backup &amp; Vault Sync</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-mint-600 text-[18px]">check</span>
                    <span>Deepfake &amp; Voice Fraud Detection</span>
                  </li>
                </ul>
              </div>
              <button className="w-full py-3.5 rounded-full bg-mint-500 hover:bg-mint-600 text-white font-label-lg font-bold mint-glow transition-all active:scale-[0.98]">
                Get Protected Now
              </button>
            </div>
            {/* Tier 3: Enterprise Sentinel */}
            <div className="bg-white p-8 rounded-3xl border border-outline-variant/80 flex flex-col justify-between shadow-sm hover:border-outline transition-all">
              <div>
                <div className="mb-4">
                  <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Enterprise Sentinel</h3>
                  <p className="text-body-sm text-on-surface-variant mt-1">Full perimeter autonomy, multi-tenant fleet security, &amp; SOC reporting.</p>
                </div>
                <div className="my-6">
                  <span className="font-display text-4xl font-extrabold text-primary font-mono">Custom</span>
                  <span className="text-on-surface-variant font-mono"> / annual SLA</span>
                </div>
                <ul className="space-y-3 text-body-sm text-on-surface mb-8">
                  <li className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-primary text-[18px]">check</span>
                    <span>Multi-tenant Fleet Dashboard</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-primary text-[18px]">check</span>
                    <span>Dedicated 24/7 Tier-3 Threat Analyst</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-primary text-[18px]">check</span>
                    <span>Custom SIEM &amp; Splunk Ingestion</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-primary text-[18px]">check</span>
                    <span>SOC2 &amp; HIPAA Compliance Audit Logs</span>
                  </li>
                </ul>
              </div>
              <button className="w-full py-3 rounded-full bg-surface-container-low hover:bg-surface-container text-primary font-semibold border border-outline-variant/60 font-label-lg transition-all">
                Contact Security Team
              </button>
            </div>
          </div>
        </section>

        {/* FAQ ACCORDION SECTION */}
        <section className="py-16 px-space-lg md:px-margin max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-headline-md text-headline-md font-bold text-on-surface mb-2">
              Frequently Answered Telemetry
            </h2>
            <p className="text-body-md text-on-surface-variant">Everything you need to know about NextShield's architecture.</p>
          </div>
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-outline-variant/70 shadow-xs">
              <h3 className="font-headline-sm text-[16px] font-bold text-on-surface flex items-center justify-between cursor-pointer">
                <span>Does NextShield slow down network bandwidth or battery life?</span>
                <span className="material-symbols-outlined text-mint-600 text-[20px]">expand_more</span>
              </h3>
              <p className="text-body-sm text-on-surface-variant mt-2 leading-relaxed">
                No. NextShield's core engine is written in bare-metal Rust with zero garbage-collection overhead. Network inspection executes via eBPF kernel hooks, yielding sub-millisecond packet latency (&lt;0.4ms) with unnoticeable CPU impact.
              </p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-outline-variant/70 shadow-xs">
              <h3 className="font-headline-sm text-[16px] font-bold text-on-surface flex items-center justify-between cursor-pointer">
                <span>How does NextShield protect across non-desktop environments?</span>
                <span className="material-symbols-outlined text-mint-600 text-[20px]">expand_more</span>
              </h3>
              <p className="text-body-sm text-on-surface-variant mt-2 leading-relaxed">
                NextShield deploys zero-configuration VPN profiles on mobile devices (iOS/Android), local proxy shims for browsers, and encrypted webhooks for cloud platforms (AWS, GitHub, Slack) to guarantee synchronized, multi-tier protection.
              </p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-outline-variant/70 shadow-xs">
              <h3 className="font-headline-sm text-[16px] font-bold text-on-surface flex items-center justify-between cursor-pointer">
                <span>Can NextShield inspect my private files or unencrypted traffic?</span>
                <span className="material-symbols-outlined text-mint-600 text-[20px]">expand_more</span>
              </h3>
              <p className="text-body-sm text-on-surface-variant mt-2 leading-relaxed">
                Never. Our zero-knowledge protocol means telemetry is tokenized locally on your endpoint. We do not store, decrypt, or log browsing content, credentials, or personal files.
              </p>
            </div>
          </div>
        </section>

        {/* PRE-FOOTER CONVERSION BANNER */}
        <section className="py-16 px-space-lg md:px-margin max-w-7xl mx-auto">
          <div className="relative rounded-3xl p-8 md:p-14 bg-gradient-to-r from-surface-container-high via-surface-container to-surface-container-low border border-mint-500/30 overflow-hidden text-center shadow-lg">
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-mint-100/70 rounded-full blur-3xl pointer-events-none"></div>
            <div className="relative z-10 max-w-2xl mx-auto space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white text-mint-700 font-label-sm uppercase font-bold border border-mint-500/20 shadow-xs">
                Autonomous Perimeter Defense
              </div>
              <h2 className="font-display text-headline-lg md:text-display font-extrabold text-[#1a2333] tracking-tight">
                Ready to Fortify Your Entire Digital Existence?
              </h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant">
                Join 250,000+ individuals, remote teams, and security teams who trust NextShield to operate untouched in high-threat online landscapes.
              </p>
              <div className="pt-4 flex flex-wrap justify-center gap-4">
                <a className="px-8 py-4 rounded-full bg-mint-500 hover:bg-mint-600 text-white font-label-lg font-bold mint-glow hover:scale-105 active:scale-95 transition-all" href="#pricing">
                  Deploy NextShield Now
                </a>
                <a className="px-8 py-4 rounded-full bg-white text-primary border border-outline-variant hover:border-outline font-label-lg font-semibold shadow-xs transition-all" href="#">
                  Schedule Security Audit
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="bg-surface-container-low border-t border-outline-variant/60 py-space-xl">
          <div className="w-full px-space-lg md:px-margin max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-space-md">
            {/* Brand & Copyright Identity */}
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <span className="text-headline-sm font-headline-sm font-bold text-on-surface flex items-center gap-1.5 font-display">
                <span className="material-symbols-outlined text-mint-500 text-[20px]" data-weight="fill">shield</span>
                NextShield
              </span>
              <span className="hidden sm:inline-block text-outline text-body-sm">•</span>
              <p className="text-body-sm font-body-sm text-on-surface-variant">
                © 2025 NextShield Inc. All rights reserved. Zero-Trust Autonomous Perimeter Defense.
              </p>
            </div>
            {/* Links Cluster */}
            <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2">
              <a className="text-on-surface-variant font-label-sm hover:text-primary transition-colors duration-200" href="#">Security Architecture</a>
              <a className="text-on-surface-variant font-label-sm hover:text-primary transition-colors duration-200" href="#">SOC2 Compliance</a>
              <a className="text-on-surface-variant font-label-sm hover:text-primary transition-colors duration-200" href="#">Privacy Shield</a>
              <a className="text-on-surface-variant font-label-sm hover:text-primary transition-colors duration-200" href="#">API Reference</a>
              <a className="text-mint-700 font-medium font-label-sm hover:text-mint-600 transition-colors duration-200 flex items-center gap-1" href="#">
                <span className="w-1.5 h-1.5 rounded-full bg-mint-500 inline-block"></span>
                Status Radar
              </a>
              <a className="text-on-surface-variant font-label-sm hover:text-primary transition-colors duration-200" href="#">Terms of Defense</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
