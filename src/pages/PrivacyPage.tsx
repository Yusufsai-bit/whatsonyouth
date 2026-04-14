import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';

const sections = [
  {
    title: 'Overview',
    body: "What's On Youth is committed to protecting your privacy. This policy explains how we collect, use, and store your personal information when you use whatsonyouth.org.au.",
  },
  {
    title: 'Information we collect',
    body: 'We collect your first name and email address when you create an account. We collect listing details when you submit an opportunity. We do not collect payment information, location data, or sell your data to third parties.',
  },
  {
    title: 'How we use your information',
    body: 'Your email is used to send account-related notifications only. Your name is displayed on listings you submit. We do not send marketing emails without your consent.',
  },
  {
    title: 'Cookies',
    body: 'We use essential cookies only — required for authentication and session management. We do not use tracking or advertising cookies.',
  },
  {
    title: 'Third party services',
    body: 'We use cloud services for authentication and data storage. We use Unsplash for listing imagery. These services have their own privacy policies.',
  },
  {
    title: 'Contact',
    body: 'For privacy enquiries contact us at info@whatsonyouth.org.au',
  },
];

export default function PrivacyPage() {
  return (
    <>
      <SEO title="Privacy Policy — What's On Youth" description="How What's On Youth collects, uses, and stores your personal information." />
      <Navbar />
      <div className="bg-white min-h-screen px-6 py-12 md:px-16 md:py-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-[32px] md:text-[40px] leading-[1.1] tracking-[-0.03em] text-brand-text-primary mb-2">Privacy Policy</h1>
          <p className="font-body text-sm text-brand-text-muted mb-10">Last updated April 2026</p>

          <div className="flex flex-col gap-8">
            {sections.map((s) => (
              <div key={s.title}>
                <h2 className="font-heading font-bold text-[18px] text-brand-text-primary mb-2">{s.title}</h2>
                <p className="font-body text-base text-brand-text-secondary leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
