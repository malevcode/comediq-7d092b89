
import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
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
      <Navigation />
      <div className="pt-20">
        {/* {loading ? null : user ? (
          <Home />
        ) : ( */}
          <>
            <Hero />
            <Features />
            <Pricing />
            <WaitlistForm />
          </>
        {/* )} */}
      </div>
    </div>
  );
};

export default Index;
