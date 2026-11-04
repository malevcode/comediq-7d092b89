import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import SEO from "@/components/SEO";

const Terms = () => {
  return (
    <div className="min-h-screen bg-transparent pb-20">
      <SEO
        title="Terms of Service | Comediq"
        description="The terms for using Comediq: accounts, mic listings, user content, Full Pass, set recordings, and the limits of what we promise."
      />
      <PageHeader title="Terms of Service" subtitle="Last updated: November 4, 2026" />

      <div className="max-w-3xl mx-auto px-4 page-content-offset">
        <h1 className="sr-only">Comediq terms of service</h1>
        <Link
          to="/"
          className="inline-flex items-center text-orange-600 hover:text-orange-700 mb-6 text-sm"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Home
        </Link>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8 space-y-8">

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Terms of Service</h2>

            <div className="space-y-4 text-gray-700">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">What Comediq Is</h3>
                <p className="text-sm leading-relaxed">
                  Comediq is an open mic directory and signup tool for stand-up comedians in New
                  York City. It is available on the web at comediq.us and as an iOS app, and both
                  share one account, so anything you do in one shows up in the other. By using
                  either one, you agree to these terms. If you do not agree, please do not use
                  Comediq.
                </p>
                <p className="text-sm leading-relaxed mt-2">
                  How we handle your data is covered separately in our{" "}
                  <Link to="/privacy" className="text-orange-600 hover:text-orange-700">
                    Privacy Policy
                  </Link>
                  .
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Your Account</h3>
                <p className="text-sm leading-relaxed">
                  You can browse mics without an account. You need one to save mics, sign up for
                  mics, or use a Full Pass.
                </p>
                <ul className="list-disc list-inside text-sm mt-2 space-y-1 ml-2">
                  <li>You must be at least 13 years old to use Comediq</li>
                  <li>
                    If you are under 18, a parent or guardian should review these terms with you and
                    agree to them on your behalf
                  </li>
                  <li>One account per person, and accounts are not transferable</li>
                  <li>
                    You are responsible for your account, for keeping it secure, and for everything
                    done through it
                  </li>
                  <li>
                    What you post should be accurate. That matters most for mic details and signup
                    names, because other comics rely on them
                  </li>
                </ul>
                <p className="text-sm leading-relaxed mt-2">
                  Venue age policies are a separate matter, and they are the venue's rules, not
                  ours. Most bars require you to be 21 or older even to perform. A listing on
                  Comediq is not permission to enter a venue, so check the room's own policy before
                  you travel.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Mic Listings Are Community Data</h3>
                <p className="text-sm leading-relaxed">
                  Our mic database is built from what hosts, comics and venues tell us, and open mic
                  details change constantly. Times move, costs change, signup rules change, and
                  rooms go dark without telling anyone.
                </p>
                <p className="text-sm leading-relaxed mt-2">
                  So we do not guarantee that any listing is correct, current, or that a mic is
                  actually running. Confirm with the venue or the host before you rely on a listing,
                  especially if you are travelling across the city for it.
                </p>
                <p className="text-sm leading-relaxed mt-2">
                  Signing up through Comediq is also not a guarantee of stage time. Hosts run their
                  own rooms: they set their own lists, and they can reorder, cut or ignore a list at
                  any time for any reason. If you do not get up, that is between you and the host.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Your Content</h3>
                <p className="text-sm leading-relaxed">
                  "Your content" means what you put into Comediq: the name and phone number you use
                  to sign up for a mic, your profile and stage name, and anything else you submit.
                </p>
                <p className="text-sm leading-relaxed mt-2">
                  You keep ownership of it. You give us the permission we need to run the service
                  with it, which in practice means displaying it where it is supposed to appear: on
                  the signup sheet for a mic, visible to that mic's host and to the other comics on
                  that list.
                </p>
                <p className="text-sm leading-relaxed mt-2">Do not use Comediq to:</p>
                <ul className="list-disc list-inside text-sm mt-2 space-y-1 ml-2">
                  <li>Harass, abuse or threaten anyone</li>
                  <li>Spam comics, hosts or the mic database</li>
                  <li>Impersonate another comedian</li>
                  <li>Sign up for a mic under someone else's name</li>
                  <li>Scrape, bulk-copy or republish our mic database</li>
                  <li>Post listings or information you know to be false</li>
                  <li>Break the law, or try to break into our systems</li>
                </ul>
                <p className="text-sm leading-relaxed mt-2">
                  We can remove content and suspend or close accounts that break these rules. If we
                  close your account for this reason, you do not get a refund for the rest of a paid
                  period.
                </p>
                <p className="text-sm leading-relaxed mt-2">
                  Comediq's own name, logo, design and database are ours, and these terms do not
                  give you a licence to copy or redistribute them.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Full Pass</h3>
                <p className="text-sm leading-relaxed">
                  Full Pass is a paid monthly membership, sold on comediq.us and billed through
                  Stripe. It renews every month until you cancel.
                </p>
                <p className="text-sm leading-relaxed mt-2">
                  You can cancel any time under Profile &gt; Manage Subscription, which opens
                  Stripe's billing portal. Cancelling stops future charges. It does not refund the
                  period you have already paid for, and your pass stays active until that period
                  ends.
                </p>
                <p className="text-sm leading-relaxed mt-2">
                  What Full Pass includes can change as the product changes, and we will say so on
                  the Full Pass page when it does. One thing worth being plain about: free entry to
                  Comediq-affiliated mics depends on the venues and hosts who take part, and which
                  rooms those are will change over time. We cannot promise any particular mic will
                  always be included.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Sets You Record in the App</h3>
                <p className="text-sm leading-relaxed">
                  If you record a set in the Comediq app, we upload it so it can be transcribed. The
                  video and audio file is then deleted from our servers automatically, within about
                  a day of upload. The text transcript stays on your account until you delete it or
                  delete your account.
                </p>
                <p className="text-sm leading-relaxed mt-2">
                  We do not publish your sets, show them to other users, or use them to promote
                  Comediq. Our{" "}
                  <Link to="/privacy" className="text-orange-600 hover:text-orange-700">
                    Privacy Policy
                  </Link>{" "}
                  has the full detail, including which services process the file.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Deleting Your Account</h3>
                <p className="text-sm leading-relaxed">
                  You can delete your account in the Comediq app under Profile &gt; Delete My
                  Account, or by emailing{" "}
                  <a href="mailto:hello@comediq.us" className="text-orange-600 hover:text-orange-700">
                    hello@comediq.us
                  </a>{" "}
                  from your account's email address. Deletion is permanent: it removes your account
                  and the personal data tied to it, including saved sets and transcripts, and we
                  cannot restore it afterwards. Cancel a Full Pass first if you have one.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">What We Don't Promise</h3>
                <p className="text-sm leading-relaxed">
                  COMEDIQ IS PROVIDED "AS IS" AND "AS AVAILABLE", WITHOUT WARRANTIES OF ANY KIND,
                  EXPRESS OR IMPLIED, INCLUDING ANY IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS
                  FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT. We do not warrant that the service
                  will be uninterrupted or error-free, or that mic listings are accurate.
                </p>
                <p className="text-sm leading-relaxed mt-2">
                  We do not run the venues or the mics. We are a directory and a signup tool. What
                  happens at a room is the venue's and the host's responsibility, not ours, and that
                  includes anything that happens to you or your property while you are there.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Limitation of Liability</h3>
                <p className="text-sm leading-relaxed">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, COMEDIQ LLC IS NOT LIABLE FOR ANY
                  INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL OR PUNITIVE DAMAGES, OR FOR ANY LOST
                  PROFITS, LOST STAGE TIME, OR WASTED TRAVEL, ARISING FROM YOUR USE OF COMEDIQ. Our
                  total liability for any claim relating to Comediq is limited to the greater of the
                  amount you paid us in the twelve months before the claim, or $50.
                </p>
                <p className="text-sm leading-relaxed mt-2">
                  Some jurisdictions do not allow some of these limits, so parts of this section may
                  not apply to you.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Changes to These Terms</h3>
                <p className="text-sm leading-relaxed">
                  We may update these terms. When we do, we will change the page and move the "Last
                  updated" date at the top. Continuing to use Comediq after that means you accept
                  the updated terms.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Governing Law and Contact</h3>
                <p className="text-sm leading-relaxed">
                  These terms are governed by the laws of the State of New York, and any dispute
                  will be heard in the state or federal courts located in New York.
                </p>
                <p className="text-sm leading-relaxed mt-2">
                  Comediq is operated by Comediq LLC. Questions about these terms go to{" "}
                  <a href="mailto:hello@comediq.us" className="text-orange-600 hover:text-orange-700">
                    hello@comediq.us
                  </a>
                  , or see our{" "}
                  <Link to="/support" className="text-orange-600 hover:text-orange-700">
                    Support page
                  </Link>
                  .
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

export default Terms;
