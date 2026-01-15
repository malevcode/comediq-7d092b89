import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Calendar, Megaphone, Star } from "lucide-react";

type ColorTheme = "blue" | "cream" | "orange";

const colorThemes: Record<ColorTheme, { name: string; bg: string; border: string; badge: string; text: string }> = {
  blue: {
    name: "Comediq Blue",
    bg: "bg-gradient-to-br from-blue-50 to-sky-50",
    border: "border-l-4 border-l-blue-500 border border-blue-200",
    badge: "bg-blue-100 text-blue-800 border-blue-200",
    text: "text-blue-800"
  },
  cream: {
    name: "Comediq Cream",
    bg: "bg-gradient-to-br from-amber-50 to-yellow-50",
    border: "border-l-4 border-l-amber-400 border border-amber-200",
    badge: "bg-amber-100 text-amber-800 border-amber-200",
    text: "text-amber-800"
  },
  orange: {
    name: "Comediq Orange",
    bg: "bg-gradient-to-br from-orange-50 to-red-50",
    border: "border-l-4 border-l-orange-500 border border-orange-200",
    badge: "bg-orange-100 text-orange-800 border-orange-200",
    text: "text-orange-800"
  }
};

const AdvertiseWithUs = () => {
  const [adMessage, setAdMessage] = useState("");
  const [colorTheme, setColorTheme] = useState<ColorTheme>("cream");

  const theme = colorThemes[colorTheme];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8f0e1] to-white pt-6 pb-24">
      <div className="max-w-2xl mx-auto px-4">
        {/* Back Button */}
        <Link to="/" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Home
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-[#0E4898] to-[#5DC8E2] rounded-full mb-4">
            <Megaphone className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Advertise With Us</h1>
          <p className="text-gray-600">
            Promote your open mic to NYC's comedy community with a featured listing
          </p>
        </div>

        {/* Form */}
        <Card className="border-blue-200 bg-white/90 backdrop-blur mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Create Your Featured Listing</CardTitle>
            <CardDescription>
              Featured mics appear at the top of our listings with premium visibility
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Ad Message */}
            <div className="space-y-2">
              <Label htmlFor="ad-message" className="text-sm font-medium">
                What would you like your ad to say?
              </Label>
              <Textarea
                id="ad-message"
                placeholder="e.g., 'Guaranteed 5 minutes!', 'Free drinks for performers!', 'Best sound system in Brooklyn!'"
                value={adMessage}
                onChange={(e) => setAdMessage(e.target.value)}
                className="min-h-[100px] resize-none"
              />
              <p className="text-xs text-gray-500">
                This will appear as a special highlight on your featured listing
              </p>
            </div>

            {/* Color Theme */}
            <div className="space-y-2">
              <Label htmlFor="color-theme" className="text-sm font-medium">
                Choose your ad color theme
              </Label>
              <Select value={colorTheme} onValueChange={(v) => setColorTheme(v as ColorTheme)}>
                <SelectTrigger id="color-theme" className="w-full">
                  <SelectValue placeholder="Select a color theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blue">Comediq Blue</SelectItem>
                  <SelectItem value="cream">Comediq Cream</SelectItem>
                  <SelectItem value="orange">Comediq Orange</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Preview</Label>
              <div className={`relative p-5 rounded-lg ${theme.bg} ${theme.border} shadow-md`}>
                {/* Featured Badge */}
                <div className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-xs font-medium border ${theme.badge}`}>
                  <Star className="h-3 w-3 inline mr-1" />
                  Featured
                </div>
                
                <div className="pr-20">
                  <h3 className={`font-bold text-lg ${theme.text}`}>Your Open Mic Name</h3>
                  <p className="text-gray-600 text-sm">Venue Name • Manhattan</p>
                  <p className="text-gray-600 text-sm">Tuesday at 8:00 PM • $5</p>
                  
                  {adMessage && (
                    <div className={`mt-3 p-2 rounded ${theme.badge} border`}>
                      <p className="text-sm font-medium">✨ {adMessage}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to get started?</h3>
            <p className="text-gray-600 text-sm mb-4">
              Book a quick 30-minute call to discuss your featured listing
            </p>
            <Button 
              asChild
              className="bg-gradient-to-r from-[#0E4898] to-[#5DC8E2] hover:opacity-90 text-white"
              size="lg"
            >
              <a 
                href="https://calendly.com/adammalev/30min" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Calendar className="mr-2 h-5 w-5" />
                Book a Meeting with Adam
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* Benefits */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p className="font-medium mb-2">Why advertise with Comediq?</p>
          <ul className="space-y-1">
            <li>✓ Reach NYC's active comedy community</li>
            <li>✓ Premium placement at the top of listings</li>
            <li>✓ Native, non-intrusive ad format</li>
            <li>✓ Flexible pricing options</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdvertiseWithUs;
