
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

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

        // Reset form
        setFormData({
          name: "",
          email: "",
          instagram: "",
          phone: "",
          yearsInComedy: "",
          openMicsPerMonth: "",
          monthlySpend: ""
        });
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
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <section id="waitlist" className="py-20 bg-gradient-to-br from-orange-50 via-white to-red-50">
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Ready to Level Up Your Comedy Game?
          </h2>
          <p className="text-xl text-gray-600">
            Join the waitlist to be the first to access Comediq and take your comedy career to the next level.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow-xl space-y-6">
          {/* Name */}
          <div>
            <Label htmlFor="name" className="text-gray-700 font-medium">Name *</Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Enter your name"
              required
              className="mt-2"
            />
          </div>

          {/* Email, Instagram, Phone - Same row on desktop */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="email" className="text-gray-700 font-medium">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="Enter your email"
                required
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="instagram" className="text-gray-700 font-medium">Instagram Handle</Label>
              <Input
                id="instagram"
                type="text"
                value={formData.instagram}
                onChange={(e) => handleInputChange("instagram", e.target.value)}
                placeholder="@yourhandle"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="phone" className="text-gray-700 font-medium">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="(555) 123-4567"
                className="mt-2"
              />
            </div>
          </div>

          {/* Comedy Questions - Same row on desktop */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="yearsInComedy" className="text-gray-700 font-medium">
                Years in comedy *
              </Label>
              <Select onValueChange={(value) => handleInputChange("yearsInComedy", value)} required>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select experience" />
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
              <Label htmlFor="openMics" className="text-gray-700 font-medium">Open mics/month</Label>
              <Input
                id="openMics"
                type="number"
                value={formData.openMicsPerMonth}
                onChange={(e) => handleInputChange("openMicsPerMonth", e.target.value)}
                placeholder="0"
                min="0"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="monthlySpend" className="text-gray-700 font-medium">$ spent/month</Label>
              <Input
                id="monthlySpend"
                type="number"
                value={formData.monthlySpend}
                onChange={(e) => handleInputChange("monthlySpend", e.target.value)}
                placeholder="0"
                min="0"
                className="mt-2"
              />
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 text-lg rounded-full transition-all duration-300 transform hover:scale-105"
          >
            {isSubmitting ? "Joining..." : "Join the Comedy Revolution"}
          </Button>
        </form>
      </div>
    </section>
  );
};

export default WaitlistForm;
