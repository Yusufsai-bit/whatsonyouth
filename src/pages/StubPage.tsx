import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function StubPage({ title }: { title: string }) {
  return (
    <>
      <Navbar />
      <div className="bg-brand-ghost min-h-screen flex flex-col items-center justify-center px-6 py-16">
        <h1 className="text-[32px] text-brand-ink">{title}</h1>
        <p className="font-body text-base text-brand-muted-text mt-2">Coming soon</p>
      </div>
      <Footer />
    </>
  );
}
