import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import PageHeader from "@/components/PageHeader";

const faqs = [
  {
    question: "How do I delete my account?",
    answer:
      "In the Comediq app, go to Profile, then Delete My Account. You can also email hello@comediq.us from your account's email address and we'll delete it for you. This removes your account and the personal data tied to it, including any saved sets and transcripts.",
  },
  {
    question: "How do I report a mic that's wrong or inactive?",
    answer:
      "Open the mic's page and use the Report option on the mic details. If you don't see that yet in the app, email hello@comediq.us with the mic name, venue, and what's wrong, and we'll fix it.",
  },
  {
    question: "How do I cancel my Full Pass subscription?",
    answer:
      "Go to Profile, then Manage Subscription. That opens Stripe's billing portal, where you can cancel any time. Your pass stays active until the end of the billing period you already paid for.",
  },
  {
    question: "What happens to video I record in the app?",
    answer:
      "Your set is uploaded for transcription and the video file itself is automatically deleted within about a day. The text transcript stays on your account so you can use it later. See our Privacy Policy for the full details.",
  },
];

const Support = () => {
  return (
    <div className="min-h-screen bg-transparent pb-20">
      <PageHeader title="Support" subtitle="We're here to help" />

      <div className="max-w-3xl mx-auto px-4 page-content-offset">
        <Link
          to="/"
          className="inline-flex items-center text-orange-600 hover:text-orange-700 mb-6 text-sm"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Home
        </Link>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What is Comediq?</h2>
            <p className="text-sm leading-relaxed text-gray-700">
              Comediq helps comedians find open mics, sign up for them, and record and transcribe
              their sets. We also help audiences find and RSVP to independent comedy shows.
            </p>
          </section>

          <hr className="border-gray-200" />

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact us</h2>
            <p className="text-sm leading-relaxed text-gray-700">
              Email{" "}
              <a href="mailto:hello@comediq.us" className="text-orange-600 hover:text-orange-700">
                hello@comediq.us
              </a>{" "}
              and we'll get back to you. This is the fastest way to reach us for account issues, bug
              reports, or anything else.
            </p>
          </section>

          <hr className="border-gray-200" />

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Frequently asked questions</h2>
            <div className="space-y-5">
              {faqs.map((faq) => (
                <div key={faq.question}>
                  <h3 className="font-semibold text-gray-900 mb-1">{faq.question}</h3>
                  <p className="text-sm leading-relaxed text-gray-700">{faq.answer}</p>
                </div>
              ))}
            </div>
          </section>

          <hr className="border-gray-200" />

          <section>
            <p className="text-sm leading-relaxed text-gray-700">
              Read our{" "}
              <Link to="/privacy" className="text-orange-600 hover:text-orange-700">
                Privacy Policy
              </Link>{" "}
              for details on what information we collect and how we use it.
            </p>
          </section>

          <div className="pt-4 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500">
              © {new Date().getFullYear()} Comediq. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Support;
