import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';

export default function StubPage({ title }: { title: string }) {
  return (
    <>
      <SEO
        title={`${title} — Coming soon | What's On Youth`}
        description={`${title} is coming soon to What's On Youth. Check back shortly for updates on this section.`}
        noindex
      />
      <Navbar />
      <div className="bg-brand-page-bg min-h-screen flex flex-col items-center justify-center px-6 py-16">
        <h1 className="text-[32px] text-brand-forest">{title}</h1>
        <p className="font-body text-base text-brand-mid-teal mt-2">Coming soon</p>
      </div>
      <Footer />
    </>
  );
}
