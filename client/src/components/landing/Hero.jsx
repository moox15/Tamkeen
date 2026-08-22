import { useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

// Particle / network animation
function ParticleCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let animId;
    const particles = [];
    const NUM = window.innerWidth < 768 ? 40 : 80;
    const MAX_DIST = 130;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    class Particle {
      constructor() { this.reset(); }
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
        this.r = Math.random() * 2 + 1;
        this.gold = Math.random() < 0.2;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = this.gold
          ? 'rgba(201, 168, 76, 0.8)'
          : 'rgba(59, 130, 246, 0.7)';
        ctx.fill();
        if (this.gold) {
          ctx.shadowBlur = 10;
          ctx.shadowColor = 'rgba(201, 168, 76, 0.6)';
        } else {
          ctx.shadowBlur = 8;
          ctx.shadowColor = 'rgba(59, 130, 246, 0.5)';
        }
        ctx.shadowBlur = 0;
      }
    }

    for (let i = 0; i < NUM; i++) particles.push(new Particle());

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MAX_DIST) {
            const alpha = (1 - dist / MAX_DIST) * 0.35;
            const isGoldConn = particles[i].gold || particles[j].gold;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = isGoldConn
              ? `rgba(201, 168, 76, ${alpha * 0.6})`
              : `rgba(37, 99, 235, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="particle-canvas"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0 }}
    />
  );
}

export default function Hero() {
  const scrollToServices = () => {
    document.querySelector('#services')?.scrollIntoView({ behavior: 'smooth' });
  };
  const scrollToContact = () => {
    document.querySelector('#cta')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #050d1a 0%, #0A1628 55%, #0D1F4C 100%)',
      }}
    >
      {/* Particle canvas */}
      <ParticleCanvas />

      {/* Decorative orbs */}
      <div
        className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)',
          filter: 'blur(40px)',
          zIndex: 1,
        }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 70%)',
          filter: 'blur(40px)',
          zIndex: 1,
        }}
      />

      {/* Gold corner accent line */}
      <div
        className="absolute top-0 right-0 w-px h-full opacity-20 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, transparent, var(--gold-400), transparent)',
          zIndex: 1,
        }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 w-full">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16">

          {/* Text Block */}
          <div className="flex-1 text-center lg:text-right">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full text-sm font-medium"
              style={{
                background: 'rgba(201,168,76,0.12)',
                border: '1px solid rgba(201,168,76,0.3)',
                color: 'var(--gold-300)',
              }}>
              <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--gold-400)' }} />
              منصة تعليمية وتقنية متكاملة
            </div>

            {/* Main headline */}
            <h1
              className="font-black leading-tight mb-6"
              style={{
                fontFamily: 'Cairo, sans-serif',
                fontSize: 'clamp(2.8rem, 7vw, 5.5rem)',
                lineHeight: 1.15,
              }}
            >
              <span
                className="block gradient-text-gold text-glow-gold"
              >
                تعلّم، تطوّر،
              </span>
              <span className="block text-white">أنجز</span>
            </h1>

            {/* Sub */}
            <p
              className="text-gray-300 mb-10 max-w-xl mx-auto lg:mx-0"
              style={{ fontSize: 'clamp(1rem, 2.5vw, 1.2rem)', lineHeight: 1.8 }}
            >
              منصة تعليمية وتقنية تساعدك على تطوير المعرفة والمهارات وتحقيق أهدافك. من التعليم والدعم الأكاديمي إلى البرمجة والذكاء الاصطناعي.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-4 mb-12">
              <button onClick={scrollToContact} className="btn-primary text-base px-8 py-4">
                تواصل معنا
              </button>
              <button onClick={scrollToServices} className="btn-secondary text-base px-8 py-4">
                اكتشف خدماتنا
              </button>
            </div>

            {/* Service pills */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-3">
              {[
                { icon: '📚', label: 'تعليم' },
                { icon: '🎓', label: 'أكاديميا' },
                { icon: '💻', label: 'برمجة' },
                { icon: '📊', label: 'بيانات' },
                { icon: '🤖', label: 'ذكاء اصطناعي' },
              ].map((item) => (
                <span
                  key={item.label}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-gray-300"
                  style={{
                    background: 'rgba(37,99,235,0.12)',
                    border: '1px solid rgba(37,99,235,0.25)',
                  }}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Logo Visual */}
          <div className="flex-shrink-0 flex items-center justify-center">
            <div className="relative">
              {/* Outer glow ring */}
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'conic-gradient(from 0deg, transparent 0%, rgba(201,168,76,0.4) 25%, transparent 50%, rgba(37,99,235,0.3) 75%, transparent 100%)',
                  padding: '3px',
                  borderRadius: '50%',
                  animation: 'spin-slow 12s linear infinite',
                  scale: '1.08',
                }}
              />
              {/* Pulse rings */}
              <div
                className="absolute inset-0 rounded-full animate-ping"
                style={{
                  border: '2px solid rgba(201,168,76,0.2)',
                  animationDuration: '3s',
                  scale: '1.15',
                }}
              />
              <div
                className="absolute inset-0 rounded-full animate-ping"
                style={{
                  border: '2px solid rgba(37,99,235,0.15)',
                  animationDuration: '4s',
                  animationDelay: '1s',
                  scale: '1.3',
                }}
              />
              {/* Logo image */}
              <img
                src="/Tamkeen.png"
                alt="شعار تمكّن"
                className="animate-float relative z-10"
                style={{
                  width: 'clamp(200px, 25vw, 320px)',
                  height: 'clamp(200px, 25vw, 320px)',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 0 30px rgba(37,99,235,0.4)) drop-shadow(0 0 60px rgba(37,99,235,0.15))',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
        <span className="text-xs text-gray-500 font-medium" style={{ writingMode: 'horizontal-tb' }}>
          تمرير للأسفل
        </span>
        <ChevronDown
          size={20}
          className="text-gray-400 animate-bounce"
          style={{ color: 'var(--gold-400)', animationDuration: '2s' }}
        />
      </div>
    </section>
  );
}
