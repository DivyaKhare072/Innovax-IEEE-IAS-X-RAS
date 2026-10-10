import React, { useEffect, useRef, useCallback, useState } from 'react';

export default function ScrollableVideoBackground() {
  const videoRef = useRef(null);
  const rafIdRef = useRef(null);
  const targetTimeRef = useRef(0);
  const smoothTimeRef = useRef(0);
  const isSeekingRef = useRef(false);
  const pendingTimeRef = useRef(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  // Directly and safely request seek without decode collisions
  const requestSeek = useCallback((time) => {
    const video = videoRef.current;
    if (!video) return;

    if (isSeekingRef.current || video.seeking) {
      pendingTimeRef.current = time;
      return;
    }

    isSeekingRef.current = true;
    try {
      if ('fastSeek' in video) {
        video.fastSeek(time);
      } else {
        video.currentTime = time;
      }
    } catch {
      isSeekingRef.current = false;
    }
  }, []);

  // Video loaded metadata handler
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      const dur = videoRef.current.duration || 40;
      setIsVideoLoaded(true);

      const maxScroll = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight
      );
      const initialProgress = Math.min(Math.max(window.scrollY / maxScroll, 0), 1);
      const initialTarget = initialProgress * dur;
      targetTimeRef.current = initialTarget;
      smoothTimeRef.current = initialTarget;
      requestSeek(initialTarget);
    }
  };

  // Scroll listener to update targetTime
  const handleScroll = useCallback(() => {
    const maxScroll = Math.max(
      1,
      document.documentElement.scrollHeight - window.innerHeight
    );
    const scrollY = window.scrollY || window.pageYOffset;
    const scrollRatio = Math.min(Math.max(scrollY / maxScroll, 0), 1);
    const dur = videoRef.current?.duration || 40;
    
    targetTimeRef.current = scrollRatio * dur;
  }, []);

  // Video seeked handler to immediately drain any queued seek target
  const handleSeeked = useCallback(() => {
    isSeekingRef.current = false;
    if (pendingTimeRef.current !== null) {
      const nextTime = pendingTimeRef.current;
      pendingTimeRef.current = null;
      requestSeek(nextTime);
    }
  }, [requestSeek]);

  // RequestAnimationFrame lerp loop for ultra-responsive, zero-lag scrubbing
  useEffect(() => {
    const updateScrub = () => {
      if (videoRef.current && isVideoLoaded) {
        const target = targetTimeRef.current;
        const current = smoothTimeRef.current;
        const diff = target - current;

        // Dynamic responsive lerp: rapid tracking on active scrolls, micro-settle at rest
        if (Math.abs(diff) > 0.005) {
          const factor = Math.abs(diff) > 2 ? 0.35 : 0.22;
          const nextTime = current + diff * factor;
          smoothTimeRef.current = nextTime;
          requestSeek(nextTime);
        } else if (Math.abs(current - target) > 0.0005) {
          smoothTimeRef.current = target;
          requestSeek(target);
        }
      }
      rafIdRef.current = requestAnimationFrame(updateScrub);
    };

    rafIdRef.current = requestAnimationFrame(updateScrub);

    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [isVideoLoaded, requestSeek]);

  // Setup scroll event listeners
  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [handleScroll]);

  return (
    <div 
      className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden bg-[#04060d]"
      aria-hidden="true"
    >
      {/* 
        High-Performance Hardware-Accelerated Video Stream 
        (Sourced directly from Cyberpunk Roller Coaster Sunset 2 - W9as7QP8GkM)
        Fastdecode tuned with 4-frame keyframe intervals for instant scrubbing.
      */}
      <video
        ref={videoRef}
        src={`${import.meta.env.BASE_URL}cyberpunk-coaster.mp4`}
        playsInline
        muted
        preload="auto"
        onLoadedMetadata={handleLoadedMetadata}
        onSeeking={() => { isSeekingRef.current = true; }}
        onSeeked={handleSeeked}
        className="absolute inset-0 w-full h-full object-cover transform-gpu scale-[1.01] will-change-transform opacity-90"
      />

      {/* Balanced Darkness & Contrast Layer to preserve vivid cyberpunk sunset while ensuring text readability */}
      <div className="absolute inset-0 bg-[#04060d]/40" />

      {/* Subtle Vignette (Dark edges to focus on center content) */}
      <div className="absolute inset-0 bg-radial-[circle_at_center,_transparent_40%,_#04060d_90%] opacity-75" />
      
      {/* Top & Bottom gradient fades to seamlessly blend navbar and footer */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#04060d]/85 via-transparent to-[#04060d]/90 pointer-events-none" />

      {/* Tech Cyber Grid scanline overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,240,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,240,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] opacity-30 mix-blend-screen pointer-events-none" />

      {/* Corner Telemetry Reticle Brackets */}
      <div className="hidden lg:block absolute top-20 left-6 text-cyan-400/40 font-mono text-[10px] tracking-widest uppercase select-none">
        ┌ FEED: CYBERPUNK_COASTER_SUNSET • STREAM_HD
      </div>
      <div className="hidden lg:block absolute top-20 right-6 text-cyan-400/40 font-mono text-[10px] tracking-widest uppercase select-none text-right">
        SYS_ID: W9as7QP8GkM ┐
      </div>
      <div className="hidden lg:block absolute bottom-6 left-6 text-cyan-400/40 font-mono text-[10px] tracking-widest uppercase select-none">
        └ SCROLL_SYNC: TELEMETRY_ACTIVE
      </div>
      <div className="hidden lg:block absolute bottom-6 right-6 text-cyan-400/40 font-mono text-[10px] tracking-widest uppercase select-none text-right">
        STATUS: SYNCHRONIZED ┘
      </div>
    </div>
  );
}
