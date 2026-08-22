const features = [
  {
    icon: '🎯',
    title: 'حلول حسب الاحتياج',
    desc: 'لا نقدم حلولاً جاهزة. نستمع إليك ونصمم الحل المناسب لاحتياجك تحديداً، سواء كنت طالباً أو فرداً أو صاحب مشروع.',
    color: 'rgba(201,168,76,0.1)',
    border: 'rgba(201,168,76,0.3)',
    iconBg: 'rgba(201,168,76,0.12)',
  },
  {
    icon: '👨‍🏫',
    title: 'تعليم ومتابعة',
    desc: 'نهتم بمتابعة تقدمك باستمرار. ليس مجرد شرح وانتهى، بل متابعة حقيقية حتى تصل للنتيجة المطلوبة.',
    color: 'rgba(37,99,235,0.12)',
    border: 'rgba(37,99,235,0.3)',
    iconBg: 'rgba(37,99,235,0.12)',
  },
  {
    icon: '💡',
    title: 'تبسيط المعرفة',
    desc: 'نؤمن بأن أي مفهوم معقد يمكن تبسيطه. أسلوبنا في الشرح يجعل المادة الصعبة سهلة وممتعة.',
    color: 'rgba(201,168,76,0.1)',
    border: 'rgba(201,168,76,0.3)',
    iconBg: 'rgba(201,168,76,0.12)',
  },
  {
    icon: '💻',
    title: 'تقنية حديثة',
    desc: 'نستخدم أحدث الأدوات والتقنيات لتقديم خدمات برمجية وذكاء اصطناعي تتوافق مع متطلبات السوق الحالي.',
    color: 'rgba(37,99,235,0.12)',
    border: 'rgba(37,99,235,0.3)',
    iconBg: 'rgba(37,99,235,0.12)',
  },
  {
    icon: '🌍',
    title: 'خدمة أونلاين',
    desc: 'كل خدماتنا متاحة عبر الإنترنت. تواصل معنا من أي مكان في السعودية أو الخليج بكل سهولة ومرونة.',
    color: 'rgba(201,168,76,0.1)',
    border: 'rgba(201,168,76,0.3)',
    iconBg: 'rgba(201,168,76,0.12)',
  },
];

export default function WhyUs() {
  return (
    <section
      id="why"
      className="relative py-24 lg:py-32 overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #0A1628 0%, #050d1a 100%)' }}
    >
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(37,99,235,0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(37,99,235,0.5) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <span
            className="inline-block px-4 py-1.5 rounded-full text-sm font-medium mb-4"
            style={{
              background: 'rgba(201,168,76,0.12)',
              border: '1px solid rgba(201,168,76,0.3)',
              color: 'var(--gold-300)',
            }}
          >
            مميزاتنا
          </span>
          <h2
            className="font-black text-white mb-4"
            style={{ fontFamily: 'Cairo, sans-serif', fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}
          >
            لماذا{' '}
            <span className="gradient-text-gold">تمكّن؟</span>
          </h2>
          <div className="gold-divider" />
          <p className="text-gray-400 max-w-lg mx-auto mt-4">
            ما يجعلنا مختلفين عن غيرنا
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="glass-card p-7 group"
              style={{
                background: f.color,
                border: `1px solid ${f.border}`,
                animationDelay: `${i * 0.1}s`,
              }}
            >
              {/* Icon */}
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-5 transition-transform duration-300 group-hover:scale-110"
                style={{
                  background: f.iconBg,
                  border: `1px solid ${f.border}`,
                }}
              >
                {f.icon}
              </div>

              {/* Content */}
              <h3
                className="font-bold text-white mb-3"
                style={{ fontFamily: 'Cairo, sans-serif', fontSize: '1.2rem' }}
              >
                {f.title}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {f.desc}
              </p>

              {/* Bottom accent line on hover */}
              <div
                className="mt-5 w-0 h-0.5 group-hover:w-full transition-all duration-500 rounded-full"
                style={{ background: `linear-gradient(90deg, var(--gold-400), transparent)` }}
              />
            </div>
          ))}

          {/* Stats card — spans the remaining spot */}
          <div
            className="glass-card p-7 flex flex-col justify-center items-center text-center sm:col-span-2 lg:col-span-1"
            style={{
              background: 'linear-gradient(135deg, rgba(13,31,76,0.8) 0%, rgba(10,22,40,0.9) 100%)',
              border: '1px solid rgba(201,168,76,0.25)',
              boxShadow: '0 0 30px rgba(201,168,76,0.05)',
            }}
          >
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-3xl mb-5"
              style={{
                background: 'rgba(201,168,76,0.1)',
                border: '2px solid rgba(201,168,76,0.3)',
              }}
            >
              🚀
            </div>
            <h3
              className="font-black gradient-text-gold mb-2"
              style={{ fontFamily: 'Cairo, sans-serif', fontSize: '1.5rem' }}
            >
              ابدأ رحلتك اليوم
            </h3>
            <p className="text-gray-400 text-sm mb-5 leading-relaxed">
              لا تنتظر الوقت المثالي. أرسل لنا احتياجك الآن وسنكون معك في كل خطوة.
            </p>
            <a
              href="https://wa.me/966500000000"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary text-sm py-3 px-6"
            >
              تواصل الآن
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
