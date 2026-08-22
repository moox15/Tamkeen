import { Link } from 'react-router-dom';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';
import { FileText, ArrowRight } from 'lucide-react';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-navy-gradient text-white" dir="rtl">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-32">
        <Link to="/" className="inline-flex items-center gap-2 text-gold-400 mb-8 hover:underline text-sm font-semibold">
          <ArrowRight size={16} /> العودة للرئيسية
        </Link>
        <div className="glass-card p-8 sm:p-12 rounded-3xl">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="text-gold-400" size={32} />
            <h1 className="text-3xl font-black font-arabic">شروط الاستخدام</h1>
          </div>
          <p className="text-gray-400 text-sm mb-8">آخر تحديث: 22 أغسطس 2026</p>

          <div className="space-y-6 text-gray-300 leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-white mb-2">1. القبول بالشروط</h2>
              <p>
                باستخدامك لمنصة "تمكّن"، فإنك توافق على الالتزام بكافة الشروط والأحكام المنصوص عليها هنا.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-2">2. الباقات والحصص التعليمية</h2>
              <ul className="list-disc list-inside space-y-1 text-gray-300">
                <li>الحصص تُقدّم بنظام 1-إلى-1 عبر الإنترنت للمنهج السعودي.</li>
                <li>يتم خصم الحصة من رصيد الطالب فقط عند إتمام الحصة بنجاح.</li>
                <li>الحصص الملغية أو المؤجلة لا تُخصم من رصيد الطالب.</li>
                <li>يجب التنسيق المسبق مع الإدارة في حال الرغبة في إعادة جدولة أي حصة.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-2">3. حسابات المستخدمين</h2>
              <p>
                يتحمل المستخدم مسؤولية الحفاظ على سرية كلمة المرور وبيانات الدخول الخاصة بحسابه، ويجب إبلاغ الإدارة فوراً عند الاشتباه بأي دخول غير مصرح به.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-2">4. الرسوم والمدفوعات</h2>
              <p>
                تُدفع رسوم الباقات وفق الأسعار المعتمدة بالريال السعودي (SAR) عبر طرق الدفع المعتمدة (تحويل بنكي أو دفع إلكتروني).
              </p>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
