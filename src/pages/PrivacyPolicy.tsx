import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import PageHeader from "@/components/PageHeader";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-orange-50 pb-20">
      <PageHeader title="Privacy Policy & Terms" subtitle="Last updated: January 2025" />
      
      <div className="max-w-3xl mx-auto px-4 pt-28">
        <Link 
          to="/" 
          className="inline-flex items-center text-orange-600 hover:text-orange-700 mb-6 text-sm"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Home
        </Link>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8 space-y-8">
          
          {/* Privacy Policy Section */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Privacy Policy</h2>
            
            <div className="space-y-4 text-gray-700">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Information We Collect</h3>
                <p className="text-sm leading-relaxed">
                  We collect information you provide directly, including:
                </p>
                <ul className="list-disc list-inside text-sm mt-2 space-y-1 ml-2">
                  <li>Account information (name, email, phone number)</li>
                  <li>Profile information (stage name, bio, social links)</li>
                  <li>Performance history and show tracking data</li>
                  <li>Open mic signups and attendance records</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">How We Use Your Information</h3>
                <p className="text-sm leading-relaxed">
                  We use your information to:
                </p>
                <ul className="list-disc list-inside text-sm mt-2 space-y-1 ml-2">
                  <li>Provide and improve our services</li>
                  <li>Send open mic reminders and updates</li>
                  <li>Process signup requests and manage lineups</li>
                  <li>Communicate about your account and platform updates</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Information Sharing</h3>
                <p className="text-sm leading-relaxed">
                  We do not sell your personal information. We may share information with:
                </p>
                <ul className="list-disc list-inside text-sm mt-2 space-y-1 ml-2">
                  <li>Venue hosts (for signup management)</li>
                  <li>Service providers (for platform operations)</li>
                  <li>As required by law</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Data Security</h3>
                <p className="text-sm leading-relaxed">
                  We implement reasonable security measures to protect your information. However, no method of transmission over the internet is 100% secure.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Your Rights</h3>
                <p className="text-sm leading-relaxed">
                  You may access, update, or delete your account information at any time through your profile settings.
                </p>
              </div>
            </div>
          </section>

          <hr className="border-gray-200" />

          {/* SMS Notifications Section */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">📱 SMS Notifications</h2>
            
            <div className="space-y-3 text-gray-700">
              <p className="text-sm leading-relaxed">
                By providing your phone number and opting in to SMS notifications, you consent to receive text messages from Comediq related to:
              </p>
              <ul className="list-disc list-inside text-sm space-y-1 ml-2">
                <li>Open mic verification confirmations</li>
                <li>Lineup spot notifications</li>
                <li>Show reminders and updates</li>
                <li>Job board application status</li>
              </ul>
              
              <p className="text-sm">
                <strong className="text-gray-900">Message Frequency:</strong> Typically 1-5 messages per month, usually just a monthly update.
              </p>
              
              <p className="text-sm">
                <strong className="text-gray-900">Message & Data Rates May Apply.</strong> Reply STOP to unsubscribe at any time. Reply HELP for assistance.
              </p>
              
              <p className="text-sm">
                Your phone number will never be sold or shared with third parties for marketing purposes.
              </p>
            </div>
          </section>

          <hr className="border-gray-200" />

          {/* Terms of Service Section */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Terms of Service</h2>
            
            <div className="space-y-4 text-gray-700">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Acceptance of Terms</h3>
                <p className="text-sm leading-relaxed">
                  By accessing or using Comediq, you agree to be bound by these Terms of Service. If you do not agree, please do not use our services.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">User Accounts</h3>
                <ul className="list-disc list-inside text-sm space-y-1 ml-2">
                  <li>You must provide accurate information when creating an account</li>
                  <li>You are responsible for maintaining the security of your account</li>
                  <li>You must be at least 18 years old to use our services</li>
                  <li>One account per person; accounts are non-transferable</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">User Content & Conduct</h3>
                <p className="text-sm leading-relaxed mb-2">
                  You agree not to:
                </p>
                <ul className="list-disc list-inside text-sm space-y-1 ml-2">
                  <li>Post false, misleading, or inappropriate content</li>
                  <li>Harass, abuse, or harm other users</li>
                  <li>Use the platform for any unlawful purpose</li>
                  <li>Attempt to gain unauthorized access to our systems</li>
                  <li>Interfere with the proper functioning of the platform</li>
                </ul>
                <p className="text-sm leading-relaxed mt-2">
                  You retain ownership of content you submit, but grant Comediq a license to use, display, and distribute your content in connection with our services.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Intellectual Property</h3>
                <p className="text-sm leading-relaxed">
                  Comediq and its logos, features, and content are protected by copyright, trademark, and other laws. You may not copy, modify, or distribute our content without permission.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Disclaimers</h3>
                <p className="text-sm leading-relaxed">
                  Comediq is provided "as is" without warranties of any kind. We do not guarantee the accuracy of venue information, show times, or availability of spots.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Limitation of Liability</h3>
                <p className="text-sm leading-relaxed">
                  To the maximum extent permitted by law, Comediq shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of our services.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Changes to Terms</h3>
                <p className="text-sm leading-relaxed">
                  We may update these terms from time to time. Continued use of Comediq after changes constitutes acceptance of the new terms.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Contact</h3>
                <p className="text-sm leading-relaxed">
                  Questions about these terms? Contact us at support@comediq.com
                </p>
              </div>
            </div>
          </section>

          {/* Footer */}
          <div className="pt-4 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500">
              © {new Date().getFullYear()} Comediq. All rights reserved.
            </p>
            <p className="text-xs text-gray-500 mt-1">
              By comedians, for comedians.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;