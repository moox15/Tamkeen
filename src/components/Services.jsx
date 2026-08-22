import { useState } from 'react';

const services = [
  {
    number: '01',
    title: 'التعليم',
    icon: '📚',
    accent: 'rgba(37,99,235,0.15)',
    accentBorder: 'rgba(37,99,235,0.35)',
    accentText: 'var(--royal-300)',
    items: [
      'دروس أونلاين تفاعلية',
      'تأسيس وتقوية المادة',
      'مراجعات مكثفة',
      'متابعة الطالب',
      'شرح مبسط وواضح',
      'الاستعداد للاختبارات',
    ],
    description: 'دعم أكاديمي شامل لطلاب المدارس والجامعات عبر الإنترنت، بأسلوب واضح ومبسط.',
  },
  {
    number: '02',
    title: 'الخدمات الأكاديمية',
    icon: '🎓',
    accent: 'rgba(201,168,76,0.1)',
    accentBorder: 'rgba(201,168,76,0.35)',
    accentText: 'var(--gold-300)',
    items: [
      'دعم الأبحاث والتقارير',
      'العروض التقديمية',
      'المشاريع التعليمية',
      'شرح المشاريع',
      'التدريب على المناقشة',
      'المهارات الأكاديمية',
    ],
    description: 'خدمات أكاديمية متخصصة لمساعدة الطلاب في مشاريعهم وأبحاثهم الجامعية.',
  },
  {
    number: '03',
    title: 'البرمجة والتقنية',
    icon: '💻',
    accent: 'rgba(37,99,235,0.15)',
    accentBorder: 'rgba(37,99,235,0.35)',
    accentText: 'var(--royal-300)',
    items: [
      'تطوير المواقع',
      'تطبيقات الويب',
      'Python & SQL',
      'قواعد البيانات',
      'APIs & Automation',
      'حلول برمجية مخصصة',
    ],
    description: 'حلول برمجية وتقنية احترافية لتحويل أفكارك إلى منتجات رقمية حقيقية.',
  },
  {
    number: '04',
    title: 'AI & Data',
    icon: '🤖',
    accent: 'rgba(201,168,76,0.1)',
    accentBorder: 'rgba(201,168,76,0.35)',
    accentText: 'var(--gold-300)',
    items: [
      'تحليل البيانات',
      'Power BI & Dashboards',
      'Data Visualization',
      'Machine Learning',
      'AI Solutions',
      'الأتمتة بالذكاء الاصطناعي',
    ],
    description: 'حلول متقدمة في الذكاء الاصطناعي وتحليل البيانات لمساعدتك على اتخاذ قرارات أذكى.',
  },
];

function ServiceCard({ service, isActive, onClick }) {
  return (
    <div
      className="service-card cursor-pointer p-6 lg:p-8 select-none"
      style={{
        background: isActive
          ? `linear-gradient(135deg, ${service.accent} 0%, rgba(10,22,40,0.95) 100%)`
          : 'linear-gradient(135deg, rgba(10,22,40,0.9) 0%, rgba(13,31,76,0.5) 100%)',
        border: isActive
          ? `1px solid ${service.accentBorder}`
          : '1px solid rgba(37,99,235,0.2)',
        boxShadow: isActive
          ? `0 20px 50px rgba(0,0,0,0.4), 0 0 30px ${service.accent}`
          : 'none',
      }}
      onClick={onClick}
    >
      {/* Number + Icon */}
      <div className="flex items-start justify-between mb-5">
        <div
          className="text-4xl font-black opacity-20"
          style={{ fontFamily: 'Cairo, sans-serif', color: service.accentText }}
        >
          {service.number}
        </div>
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{
            background: service.accent,
            border: `1px solid ${service.accentBorder}`,
          }}
        >
          {service.icon}
        </div>
      </div>

      {/* Title */}
      <h3
        className="font-bold text-white mb-3"
        style={{ fontFamily: 'Cairo, sans-serif', fontSize: '1.3rem' }}
      >
        {service.title}
      </h3>

      {/* Description */}
      <p className="text-gray-400 text-sm leading-relaxed mb-5">
        {service.description}
      </p>

      {/* Items */}
      <ul className="space-y-2">
        {service.items.map((item) => (
          <li
            key={item}
            className="flex items-center gap-2 text-sm text-gray-300"
          >
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: service.accentText }}
            />
            {item}
          </li>
        ))}
      </ul>

      {/* CTA */}
      <div
        className="mt-6 pt-4 text-sm font-semibold flex items-center gap-2"
        style={{
          borderTop: `1px solid rgba(255,255,255,0.08)`,
          color: service.accentText,
        }}
      >
        <span>اكتشف الخدمة</span>
        <span>←</span>
      </div>
    </div>
  );
}

export default function Services() {
  const [activeCard, setActiveCard] = useState(0);

  return (
    <section
      id="services"
      className="relative py-24 lg:py-32 overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #0A1628 0%, #0D1F4C 50%, #0A1628 100%)' }}
    >
      {/* Decorative gradient orb */}
      <div
        className="absolute top-0 left-0 w-96 h-96 rounded-full pointer-events-none opacity-20"
        style={{
          background: 'radial-gradient(circle, rgba(37,99,235,0.3) 0%, transparent 70%)',
          filter: 'blur(60px)',
          transform: 'translate(-30%, -30%)',
        }}
      />
      <div
        className="absolute bottom-0 right-0 w-96 h-96 rounded-full pointer-events-none opacity-15"
        style={{
          background: 'radial-gradient(circle, rgba(201,168,76,0.3) 0%, transparent 70%)',
          filter: 'blur(60px)',
          transform: 'translate(30%, 30%)',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <span
            className="inline-block px-4 py-1.5 rounded-full text-sm font-medium mb-4"
            style={{
              background: 'rgba(37,99,235,0.12)',
              border: '1px solid rgba(37,99,235,0.3)',
              color: 'var(--royal-300)',
            }}
          >
            ما نقدمه
          </span>
          <h2
            className="font-black text-white mb-4"
            style={{ fontFamily: 'Cairo, sans-serif', fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}
          >
            خدماتنا{' '}
            <span className="gradient-text-gold">المتكاملة</span>
          </h2>
          <div className="gold-divider" />
          <p className="text-gray-400 max-w-xl mx-auto mt-4">
            أربعة محاور رئيسية تغطي كل احتياجاتك التعليمية والتقنية
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
          {services.map((service, i) => (
            <ServiceCard
              key={service.number}
              service={service}
              isActive={activeCard === i}
              onClick={() => setActiveCard(i)}
            />
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-14 text-center">
          <p className="text-gray-400 mb-5 text-sm">
            هل تبحث عن خدمة محددة؟ تواصل معنا وسنجد الحل المناسب لك.
          </p>
          <a
            href="https://wa.me/966500000000"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
          >
            استفسر الآن
          </a>
        </div>
      </div>
    </section>
  );
}
