
import { useState, useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Pricing from "@/components/Pricing";
import WaitlistForm from "@/components/WaitlistForm";
import { useAuth } from "@/contexts/AuthContext";
import Home from "@/components/Home";

const Index = () => {
  const { user, loading } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToWaitlist = () => {
    const waitlistElement = document.getElementById('waitlist');
    if (waitlistElement) {
      waitlistElement.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
    <div className="min-h-screen pb-20">
      <PageHeader title="Comediq" subtitle="Your comedy journey starts here" />
      <div className="pt-0">
        {loading ? null : user ? (
          <Home />
        ) : (
          <>
            <Hero />
            <Features />
            <Pricing />
            <WaitlistForm />
          </>
        )}
      </div>
    </div>
  );
};

export default Index;
