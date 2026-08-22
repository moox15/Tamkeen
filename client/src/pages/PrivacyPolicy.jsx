import { Link } from 'react-router-dom';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';
import { Shield, ArrowRight } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-navy-gradient text-white" dir="rtl">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-32">
        <Link to="/" className="inline-flex items-center gap-2 text-gold-400 mb-8 hover:underline text-sm font-semibold">
          <ArrowRight size={16} /> العودة للرئيسية
        </Link>
        <div className="glass-card p-8 sm:p-12 rounded-3xl">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="text-gold-400" size={32} />
            <h1 className="text-3xl font-black font-arabic">سياسة الخصوصية</h1>
          </div>
          <p className="text-gray-400 text-sm mb-8">آخر تحديث: 22 أغسطس 2026</p>

          <div className="space-y-6 text-gray-300 leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-white mb-2">1. مقدمة</h2>
              <p>
                نحن في منصة "تمكّن" التعليمية نلتزم بأعلى معايير حماية خصوصية بيانات الطلاب وأولياء الأمور والمعلمين وفق الأنظمة واللوائح المعمول بها في المملكة العربية السعودية (نظام حماية البيانات الشخصية).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-2">2. البيانات التي نجمعها</h2>
              <ul className="list-disc list-inside space-y-1 text-gray-300">
                <li>البيانات الشخصية الأساسية (الاسم، البريد الإلكتروني، رقم الهاتف).</li>
                <li>البيانات الأكاديمية (المرحلة الدراسية، الصف، المواد المسجلة).</li>
                <li>سجلات الحضور، تقييمات الحصص، وواجبات الطلاب.</li>
                <li>سجلات الاشتراكات والمدفوعات.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-2">3. كيفية استخدام البيانات</h2>
              <p>
                تُستخدم البيانات حصراً لإدارة العملية التعليمية، تقديم الحصص الفردية، متابعة التقدم الدراسي، وتوفير خدمة عملاء متكاملة. لا نقوم بمشاركة أو بيع أي بيانات شخصية لأي طرف ثالث.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-2">4. أمان وسرية البيانات</h2>
              <p>
                نطبق بروتوكولات أمان صارمة تشمل التشفير المتقدم لكلمات المرور، جلسات العمل الآمنة، وعزل بيانات كل طالب بشكل كامل بحيث لا يمكن لأي طالب الوصول إلى بيانات طالب آخر.
              </p>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
