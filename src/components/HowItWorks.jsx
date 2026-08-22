const steps = [
  {
    number: '01',
    icon: '💬',
    title: 'أرسل احتياجك',
    desc: 'تواصل معنا عبر واتساب أو وسائل التواصل وأخبرنا بما تحتاج بكل حرية.',
    color: 'rgba(37,99,235,0.15)',
    border: 'rgba(37,99,235,0.4)',
    accent: 'var(--royal-300)',
  },
  {
    number: '02',
    icon: '🔍',
    title: 'نحدد الحل المناسب',
    desc: 'نحلل احتياجك بدقة ونضع خطة واضحة تناسب وضعك وأهدافك.',
    color: 'rgba(201,168,76,0.1)',
    border: 'rgba(201,168,76,0.4)',
    accent: 'var(--gold-300)',
  },
  {
    number: '03',
    icon: '⚙️',
    title: 'نبدأ التنفيذ أو التعلم',
    desc: 'سواء كان دروساً أو مشروعاً أو حلاً تقنياً، نبدأ التنفيذ فوراً بجودة عالية.',
    color: 'rgba(37,99,235,0.15)',
    border: 'rgba(37,99,235,0.4)',
    accent: 'var(--royal-300)',
  },
  {
    number: '04',
    icon: '🏆',
    title: 'تحقق هدفك',
    desc: 'نصل معاً إلى النتيجة المطلوبة — نجاح أكاديمي، مهارة جديدة، أو منتج رقمي.',
    color: 'rgba(201,168,76,0.1)',
    border: 'rgba(201,168,76,0.4)',
    accent: 'var(--gold-300)',
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how"
      className="relative py-24 lg:py-32 overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #0A1628 0%, #0D1F4C 50%, #0A1628 100%)' }}
    >
      {/* Circuit line decoration */}
      <div
        className="absolute top-0 right-1/2 w-px h-full opacity-10 pointer-events-none"
        style={{ background: 'linear-gradient(180deg, transparent, var(--royal-400), var(--gold-400), transparent)' }}
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
            الخطوات
          </span>
          <h2
            className="font-black text-white mb-4"
            style={{ fontFamily: 'Cairo, sans-serif', fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}
          >
            كيف{' '}
            <span className="gradient-text-gold">نعمل؟</span>
          </h2>
          <div className="gold-divider" />
          <p className="text-gray-400 max-w-lg mx-auto mt-4">
            أربع خطوات بسيطة تفصلك عن تحقيق هدفك
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {/* Connector line (desktop) */}
          <div
            className="hidden lg:block absolute top-14 right-[12.5%] left-[12.5%] h-0.5 pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, rgba(201,168,76,0.6), rgba(37,99,235,0.4), rgba(201,168,76,0.6))',
            }}
          />

          {steps.map((step, i) => (
            <div key={step.number} className="relative flex flex-col items-center text-center">
              {/* Step bubble */}
              <div
                className="relative z-10 w-28 h-28 rounded-full flex flex-col items-center justify-center mb-6 transition-transform duration-300 hover:scale-105"
                style={{
                  background: `linear-gradient(135deg, ${step.color} 0%, rgba(10,22,40,0.9) 100%)`,
                  border: `2px solid ${step.border}`,
                  boxShadow: `0 0 30px ${step.color}, 0 10px 30px rgba(0,0,0,0.3)`,
                }}
              >
                <span className="text-3xl mb-1">{step.icon}</span>
                <span
                  className="text-xs font-bold"
                  style={{ color: step.accent }}
                >
                  {step.number}
                </span>
              </div>

              {/* Content */}
              <h3
                className="font-bold text-white mb-3"
                style={{ fontFamily: 'Cairo, sans-serif', fontSize: '1.1rem' }}
              >
                {step.title}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed px-2">
                {step.desc}
              </p>

              {/* Mobile arrow */}
              {i < steps.length - 1 && (
                <div className="sm:hidden mt-4 text-gray-600">
                  ↓
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-20 text-center">
          <div
            className="inline-block rounded-3xl p-8 max-w-2xl w-full"
            style={{
              background: 'linear-gradient(135deg, rgba(13,31,76,0.8) 0%, rgba(10,22,40,0.95) 100%)',
              border: '1px solid rgba(201,168,76,0.25)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
            }}
          >
            <div className="text-4xl mb-4">🚀</div>
            <h3
              className="font-bold text-white mb-3"
              style={{ fontFamily: 'Cairo, sans-serif', fontSize: '1.5rem' }}
            >
              جاهز؟ الخطوة الأولى سهلة
            </h3>
            <p className="text-gray-400 mb-6 text-sm">
              أرسل لنا رسالة واحدة فقط وسنتولى الباقي
            </p>
            <a
              href="https://wa.me/966500000000"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              ابدأ الآن عبر واتساب
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
