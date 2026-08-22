export default function About() {
  const milestones = [
    {
      icon: '🎓',
      label: 'المعرفة',
      desc: 'نبني الأساس العلمي والمعرفي الصحيح',
      color: 'rgba(37,99,235,0.15)',
      border: 'rgba(37,99,235,0.3)',
    },
    {
      icon: '🔧',
      label: 'المهارة',
      desc: 'نحوّل المعرفة إلى مهارات قابلة للتطبيق',
      color: 'rgba(201,168,76,0.1)',
      border: 'rgba(201,168,76,0.3)',
    },
    {
      icon: '⚡',
      label: 'التطبيق',
      desc: 'نمكّنك من توظيف مهاراتك في الواقع',
      color: 'rgba(37,99,235,0.15)',
      border: 'rgba(37,99,235,0.3)',
    },
    {
      icon: '🏆',
      label: 'الإنجاز',
      desc: 'تحقيق الأهداف والنتائج الملموسة',
      color: 'rgba(201,168,76,0.1)',
      border: 'rgba(201,168,76,0.3)',
    },
  ];

  return (
    <section
      id="about"
      className="relative py-24 lg:py-32 overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #050d1a 0%, #0A1628 100%)' }}
    >
      {/* Subtle background texture */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(37,99,235,0.5) 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Left decorative accent */}
      <div
        className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-48 rounded-full opacity-30"
        style={{ background: 'linear-gradient(180deg, transparent, var(--gold-400), transparent)' }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <span
            className="inline-block px-4 py-1.5 rounded-full text-sm font-medium mb-4"
            style={{
              background: 'rgba(201,168,76,0.12)',
              border: '1px solid rgba(201,168,76,0.3)',
              color: 'var(--gold-300)',
            }}
          >
            التعريف بالمنصة
          </span>
          <h2
            className="font-black text-white mb-4"
            style={{ fontFamily: 'Cairo, sans-serif', fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}
          >
            من{' '}
            <span className="gradient-text-gold">نحن؟</span>
          </h2>
          <div className="gold-divider" />
        </div>

        {/* Main content block */}
        <div className="flex flex-col lg:flex-row items-center gap-16">
          {/* Logo visual */}
          <div className="flex-shrink-0 flex items-center justify-center">
            <div
              className="relative rounded-3xl p-8 flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(13,31,76,0.8) 0%, rgba(10,22,40,0.9) 100%)',
                border: '1px solid rgba(201,168,76,0.25)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.4), 0 0 40px rgba(37,99,235,0.1)',
              }}
            >
              <img
                src="/Tamkeen.png"
                alt="شعار تمكّن"
                style={{
                  width: 'clamp(180px, 20vw, 260px)',
                  height: 'clamp(180px, 20vw, 260px)',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 0 20px rgba(37,99,235,0.3))',
                }}
              />
              {/* Decorative corner dots */}
              <span className="absolute top-4 right-4 circuit-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--gold-400)', boxShadow: '0 0 8px var(--gold-400)' }} />
              <span className="absolute bottom-4 left-4 circuit-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--royal-300)', boxShadow: '0 0 8px var(--royal-300)' }} />
            </div>
          </div>

          {/* Text */}
          <div className="flex-1">
            <h3
              className="font-bold text-white mb-4"
              style={{ fontFamily: 'Cairo, sans-serif', fontSize: 'clamp(1.3rem, 3vw, 2rem)' }}
            >
              تمكّن — أكثر من مجرد منصة تعليمية
            </h3>
            <div
              className="w-12 h-1 rounded-full mb-6"
              style={{ background: 'var(--gold-400)' }}
            />
            <p className="text-gray-300 mb-5 leading-relaxed" style={{ fontSize: '1.05rem' }}>
              <span className="gradient-text-gold font-bold">تمكّن</span> منصة تعليمية وتقنية متكاملة تجمع بين التعليم الأكاديمي، الدعم الدراسي، تطوير المهارات، والحلول البرمجية والتقنية في تجربة واحدة.
            </p>
            <p className="text-gray-400 mb-8 leading-relaxed" style={{ fontSize: '1rem' }}>
              نؤمن بأن كل طالب وكل فرد يستحق دعماً حقيقياً يأخذه من مرحلة التعلّم إلى مرحلة التطبيق والإنجاز. نقدم خدماتنا بالكامل عبر الإنترنت لخدمة الأسواق الخليجية والسعودية.
            </p>

            {/* Quote */}
            <div
              className="rounded-2xl p-5 mb-8"
              style={{
                background: 'rgba(201,168,76,0.08)',
                borderRight: '4px solid var(--gold-400)',
                border: '1px solid rgba(201,168,76,0.2)',
                borderRightWidth: '4px',
              }}
            >
              <p className="gradient-text-gold font-bold text-xl" style={{ fontFamily: 'Cairo, sans-serif' }}>
                "تعلّم، تطوّر، أنجز"
              </p>
              <p className="text-gray-400 text-sm mt-1">رؤية تمكّن — من المعرفة إلى الإنجاز</p>
            </div>
          </div>
        </div>

        {/* Milestone journey */}
        <div className="mt-20">
          <p className="text-center text-gray-400 mb-10 text-sm font-medium uppercase tracking-widest">
            رحلتك مع تمكّن
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {milestones.map((m, i) => (
              <div key={m.label} className="relative">
                {/* Connector arrow (desktop) */}
                {i < milestones.length - 1 && (
                  <div className="hidden lg:flex absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/2 z-10 items-center justify-center">
                    <span className="text-gray-600 text-xl" style={{ color: 'var(--gold-500)' }}>←</span>
                  </div>
                )}
                <div
                  className="rounded-2xl p-6 text-center glass-card h-full"
                  style={{
                    background: m.color,
                    border: `1px solid ${m.border}`,
                  }}
                >
                  <div className="text-3xl mb-3">{m.icon}</div>
                  <p
                    className="font-bold text-white mb-2"
                    style={{ fontFamily: 'Cairo, sans-serif', fontSize: '1.1rem' }}
                  >
                    {m.label}
                  </p>
                  <p className="text-gray-400 text-sm leading-relaxed">{m.desc}</p>
                  <div
                    className="mt-3 text-xs font-bold rounded-full px-3 py-1 inline-block"
                    style={{ background: 'rgba(255,255,255,0.07)', color: 'var(--gold-300)' }}
                  >
                    0{i + 1}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
