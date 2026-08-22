import Navbar from '../components/landing/Navbar';
import Hero from '../components/landing/Hero';
import About from '../components/landing/About';
import Services from '../components/landing/Services';
import WhyUs from '../components/landing/WhyUs';
import Audiences from '../components/landing/Audiences';
import HowItWorks from '../components/landing/HowItWorks';
import CTA from '../components/landing/CTA';
import Footer from '../components/landing/Footer';
import WhatsAppFloat from '../components/landing/WhatsAppFloat';

export default function Landing() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <About />
        <Services />
        <WhyUs />
        <Audiences />
        <HowItWorks />
        <CTA />
      </main>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
