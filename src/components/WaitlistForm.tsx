import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const WaitlistForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    instagram: "",
    phone: "",
    yearsInComedy: "",
    openMicsPerMonth: "",
    monthlySpend: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('waitlist')
        .insert([
          {
            name: formData.name,
            email: formData.email,
            instagram_handle: formData.instagram || null,
            phone: formData.phone || null,
            years_in_comedy: formData.yearsInComedy,
            open_mics_per_month: parseInt(formData.openMicsPerMonth) || 0,
            monthly_spend: parseInt(formData.monthlySpend) || 0,
            created_at: new Date().toISOString()
          }
        ]);

      if (error) {
        console.error('Supabase error:', error);
        toast({
          title: "Oops! Something went wrong",
          description: "Please try again or contact support if the issue persists.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Welcome to the Comedy Revolution! 🎤",
          description: "You're now on the waitlist. We'll be in touch soon!",
        });
        setFormData({ name: "", email: "", instagram: "", phone: "", yearsInComedy: "", openMicsPerMonth: "", monthlySpend: "" });
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Network Error",
        description: "Please check your connection and try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <section id="waitlist" className="py-12 bg-gradient-to-br from-blue-50 via-white to-[#1a5fb4]/5">
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-6">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Comedian Affiliate Application Form
          </h2>
          <p className="text-base text-gray-600">
            Join our comedian affiliate program to be the first to access Comediq and help us spread the word.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-5 shadow-xl space-y-4">
          {/* Row 1: Name + Email */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="name" className="text-gray-700 font-medium text-sm">Name *</Label>
              <Input id="name" type="text" value={formData.name} onChange={(e) => handleInputChange("name", e.target.value)} placeholder="Your name" required className="mt-1" />
            </div>
            <div>
              <Label htmlFor="email" className="text-gray-700 font-medium text-sm">Email *</Label>
              <Input id="email" type="email" value={formData.email} onChange={(e) => handleInputChange("email", e.target.value)} placeholder="you@email.com" required className="mt-1" />
            </div>
          </div>

          {/* Row 2: Phone + Instagram */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="phone" className="text-gray-700 font-medium text-sm">Phone</Label>
              <Input id="phone" type="tel" value={formData.phone} onChange={(e) => handleInputChange("phone", e.target.value)} placeholder="(555) 123-4567" className="mt-1" />
            </div>
            <div>
              <Label htmlFor="instagram" className="text-gray-700 font-medium text-sm">Instagram</Label>
              <Input id="instagram" type="text" value={formData.instagram} onChange={(e) => handleInputChange("instagram", e.target.value)} placeholder="@handle" className="mt-1" />
            </div>
          </div>

          {/* Row 3: Comedy questions */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="yearsInComedy" className="text-gray-700 font-medium text-sm">Years in comedy *</Label>
              <Select onValueChange={(value) => handleInputChange("yearsInComedy", value)} required>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0-1">0-1 years</SelectItem>
                  <SelectItem value="1-3">1-3 years</SelectItem>
                  <SelectItem value="3-5">3-5 years</SelectItem>
                  <SelectItem value="5-10">5-10 years</SelectItem>
                  <SelectItem value="10+">10+ years</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="openMics" className="text-gray-700 font-medium text-sm">Mics/month</Label>
              <Input id="openMics" type="number" value={formData.openMicsPerMonth} onChange={(e) => handleInputChange("openMicsPerMonth", e.target.value)} placeholder="0" min="0" className="mt-1" />
            </div>
            <div>
              <Label htmlFor="monthlySpend" className="text-gray-700 font-medium text-sm">$/month</Label>
              <Input id="monthlySpend" type="number" value={formData.monthlySpend} onChange={(e) => handleInputChange("monthlySpend", e.target.value)} placeholder="0" min="0" className="mt-1" />
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full bg-[#1a5fb4] hover:bg-[#164d94] text-white py-3 text-base rounded-full transition-all duration-300 transform hover:scale-105">
            {isSubmitting ? "Joining..." : "Join the Comedy Revolution"}
          </Button>
        </form>
      </div>
    </section>
  );
};

export default WaitlistForm;
