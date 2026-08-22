import { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';
import { Phone, Mail, MapPin, Send, ArrowRight, MessageCircle } from 'lucide-react';

export default function Contact() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-navy-gradient text-white" dir="rtl">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-32">
        <Link to="/" className="inline-flex items-center gap-2 text-gold-400 mb-8 hover:underline text-sm font-semibold">
          <ArrowRight size={16} /> العودة للرئيسية
        </Link>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div>
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold text-gold-400 bg-gold-400/10 border border-gold-400/30 mb-4">
              نسعد بتواصلكم
            </span>
            <h1 className="text-4xl font-black font-arabic mb-4">تواصل مع أكاديمية تمكّن</h1>
            <p className="text-gray-300 leading-relaxed mb-8">
              فريقنا الأكاديمي جاهز للإجابة عن كافة استفساراتكم ومساعدتكم في اختيار الباقة والمواد المناسبة لابنك/ابنتك.
            </p>

            <div className="space-y-4">
              <a
                href="https://wa.me/966500000000"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/50 transition-all text-white no-underline"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <MessageCircle size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-sm">واتساب مباشر</h3>
                  <p className="text-gray-400 text-xs mt-0.5" dir="ltr">+966 50 000 0000</p>
                </div>
              </a>

              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="w-12 h-12 rounded-xl bg-royal-400/20 text-royal-300 flex items-center justify-center">
                  <Mail size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-sm">البريد الإلكتروني</h3>
                  <p className="text-gray-400 text-xs mt-0.5" dir="ltr">info@tamkeen.sa</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="w-12 h-12 rounded-xl bg-gold-400/20 text-gold-300 flex items-center justify-center">
                  <MapPin size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-sm">الموقع</h3>
                  <p className="text-gray-400 text-xs mt-0.5">المملكة العربية السعودية — الرياض</p>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-8 rounded-3xl">
            {sent ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4">
                  ✓
                </div>
                <h3 className="text-xl font-bold font-arabic mb-2">تم إرسال رسالتكم بنجاح!</h3>
                <p className="text-gray-400 text-sm">سيتواصل معكم فريقنا الأكاديمي خلال أقرب وقت ممكن.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h2 className="text-xl font-bold font-arabic mb-6">أرسل لنا رسالة</h2>
                <div>
                  <label className="form-label">الاسم الكامل</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="form-input"
                    placeholder="محمد عبدالله"
                  />
                </div>
                <div>
                  <label className="form-label">رقم الجوال (واتساب)</label>
                  <input
                    type="tel"
                    required
                    dir="ltr"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="form-input"
                    placeholder="05xxxxxxxx"
                  />
                </div>
                <div>
                  <label className="form-label">البريد الإلكتروني</label>
                  <input
                    type="email"
                    dir="ltr"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="form-input"
                    placeholder="name@example.com"
                  />
                </div>
                <div>
                  <label className="form-label">الرسالة / الاستفسار</label>
                  <textarea
                    rows={4}
                    required
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="form-input form-textarea"
                    placeholder="استفسار عن باقات الرياضيات للمرحلة المتوسطة..."
                  />
                </div>
                <button type="submit" className="login-submit">
                  <Send size={18} />
                  <span>إرسال الرسالة</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
