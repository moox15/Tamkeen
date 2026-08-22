const audiences = [
  {
    icon: '🎓',
    title: 'طلاب المدارس',
    sub: 'المرحلة الابتدائية والمتوسطة والثانوية',
    desc: 'تأسيس قوي، شرح واضح، تقوية مستمرة، ومراجعة احترافية للاختبارات. نساعد طلاب المدارس على بناء أساس علمي متين.',
    items: ['تأسيس وتقوية المواد', 'شرح مبسط ومبتكر', 'مراجعة للاختبارات', 'متابعة مستمرة'],
    color: 'rgba(37,99,235,0.12)',
    border: 'rgba(37,99,235,0.3)',
    accentColor: 'var(--royal-300)',
    iconBg: 'rgba(37,99,235,0.15)',
  },
  {
    icon: '🎓',
    title: 'طلاب الجامعات',
    sub: 'البكالوريوس والدراسات العليا',
    desc: 'خدمات أكاديمية متخصصة تشمل الأبحاث، المشاريع، العروض التقديمية، وتطوير المهارات الدراسية والمهنية.',
    items: ['أبحاث وتقارير', 'مشاريع ومنهجيات', 'عروض تقديمية', 'مهارات أكاديمية'],
    color: 'rgba(201,168,76,0.08)',
    border: 'rgba(201,168,76,0.3)',
    accentColor: 'var(--gold-300)',
    iconBg: 'rgba(201,168,76,0.1)',
    featured: true,
  },
  {
    icon: '💻',
    title: 'الأفراد وأصحاب المشاريع',
    sub: 'من يريد التطور أو يبحث عن حلول',
    desc: 'حلول برمجية وتقنية وذكاء اصطناعي مصممة لمساعدتك على تحقيق أهدافك الرقمية والمهنية.',
    items: ['برمجة وتطوير', 'تحليل بيانات', 'AI Solutions', 'حلول رقمية'],
    color: 'rgba(37,99,235,0.12)',
    border: 'rgba(37,99,235,0.3)',
    accentColor: 'var(--royal-300)',
    iconBg: 'rgba(37,99,235,0.15)',
  },
];

export default function Audiences() {
  return (
    <section
      id="audience"
      className="relative py-24 lg:py-32 overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #050d1a 0%, #0A1628 100%)' }}
    >
      {/* Decorative orb */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none opacity-10"
        style={{
          background: 'radial-gradient(circle, rgba(37,99,235,0.4) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <span
            className="inline-block px-4 py-1.5 rounded-full text-sm font-medium mb-4"
            style={{
              background: 'rgba(37,99,235,0.12)',
              border: '1px solid rgba(37,99,235,0.3)',
              color: 'var(--royal-300)',
            }}
          >
            نخدم الجميع
          </span>
          <h2
            className="font-black text-white mb-4"
            style={{ fontFamily: 'Cairo, sans-serif', fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}
          >
            من{' '}
            <span className="gradient-text-gold">نخدم؟</span>
          </h2>
          <div className="gold-divider" />
          <p className="text-gray-400 max-w-lg mx-auto mt-4">
            خدماتنا مصممة لفئات متعددة — كلنا واحد في مسيرة التعلم والنمو
          </p>
        </div>

        {/* Audience cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {audiences.map((aud) => (
            <div
              key={aud.title}
              className="relative rounded-3xl p-8 flex flex-col transition-all duration-400"
              style={{
                background: aud.featured
                  ? 'linear-gradient(135deg, rgba(201,168,76,0.12) 0%, rgba(13,31,76,0.9) 100%)'
                  : 'linear-gradient(135deg, rgba(13,31,76,0.7) 0%, rgba(10,22,40,0.95) 100%)',
                border: `1px solid ${aud.border}`,
                boxShadow: aud.featured
                  ? '0 20px 60px rgba(0,0,0,0.4), 0 0 40px rgba(201,168,76,0.08)'
                  : '0 10px 30px rgba(0,0,0,0.3)',
              }}
            >
              {aud.featured && (
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold"
                  style={{
                    background: 'linear-gradient(135deg, var(--gold-500), var(--gold-400))',
                    color: 'var(--navy-900)',
                  }}
                >
                  الأكثر طلباً
                </div>
              )}

              {/* Icon */}
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-5"
                style={{
                  background: aud.iconBg,
                  border: `1px solid ${aud.border}`,
                }}
              >
                {aud.icon}
              </div>

              {/* Text */}
              <h3
                className="font-bold text-white mb-1"
                style={{ fontFamily: 'Cairo, sans-serif', fontSize: '1.3rem' }}
              >
                {aud.title}
              </h3>
              <p className="text-sm mb-4" style={{ color: aud.accentColor }}>
                {aud.sub}
              </p>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                {aud.desc}
              </p>

              {/* Items list */}
              <ul className="flex-1 space-y-2 mb-6">
                {aud.items.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-gray-300">
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                      style={{
                        background: aud.iconBg,
                        border: `1px solid ${aud.border}`,
                        color: aud.accentColor,
                      }}
                    >
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <a
                href="https://wa.me/966500000000"
                target="_blank"
                rel="noopener noreferrer"
                className={aud.featured ? 'btn-primary justify-center' : 'btn-secondary justify-center'}
                style={{ textAlign: 'center' }}
              >
                ابدأ الآن
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
