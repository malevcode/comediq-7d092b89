import SEO from "@/components/SEO";

/**
 * Standalone, unlinked privacy policy for SetBuild (a separate app from
 * Comediq). Reached only by direct URL — it is not in the nav, the footer or
 * the sitemap, and it is marked noindex so it never appears in search.
 *
 * The copy below is the policy text verbatim; the app renders it as plain
 * text with no cards, buttons or links other than the contact email.
 */

const SECTIONS: { heading: string; paragraphs?: string[]; bullets?: string[] }[] = [
  {
    heading: "WHAT WE COLLECT",
    bullets: [
      "Audio recordings of the sets you record or upload.",
      "Transcripts and analysis we create from your audio: the text of your set, where laughs were detected, and per-bit stats.",
      "What you type in: set lists, ratings, venue, audience size, and notes.",
      "A random device ID the app creates the first time you open it. It keeps your data separate from other people's. It is not tied to your name, email, or phone number, and SetBuild has no accounts.",
    ],
  },
  {
    heading: "HOW WE USE IT",
    paragraphs: [
      "We use your data only to run the app: to analyze your recordings, show your reports, and let you compare sets. We do not sell your data. We do not use it for advertising. We do not track you across other apps or websites. We do not use your recordings to train AI models.",
    ],
  },
  {
    heading: "WHERE IT IS PROCESSED",
    paragraphs: [
      "Your audio is analyzed on our own server. We do not send your audio to other third-party analysis services.",
    ],
  },
  {
    heading: "MICROPHONE ACCESS",
    paragraphs: [
      "The app asks for microphone permission so it can record your set. Recording only happens when you tap Record.",
    ],
  },
  {
    heading: "HOW LONG WE KEEP IT",
    paragraphs: [
      "We keep your data until you delete it. You can ask us to delete your sets and all data tied to your device by emailing hello@comediq.us. When we delete it, it is removed from our server.",
    ],
  },
  {
    heading: "WHO CAN SEE IT",
    paragraphs: [
      "Your data is separated by your device ID, and the app only shows you your own data. As the operator of the server, we can technically access stored data, but we only do so to keep the service running or to respond to a legal request.",
    ],
  },
  {
    heading: "CHILDREN",
    paragraphs: [
      "SetBuild is not directed at children under 13, and we do not knowingly collect data from them.",
    ],
  },
  {
    heading: "CHANGES",
    paragraphs: ["If we change this policy, we will update the date above."],
  },
  {
    heading: "CONTACT",
    paragraphs: [
      "Questions or requests, including deletion requests: hello@comediq.us",
    ],
  },
];

const SetBuildPrivacy = () => {
  return (
    <div className="min-h-screen bg-transparent pb-24">
      <SEO
        title="SetBuild Privacy Policy"
        description="What SetBuild collects, how it is used and how long it is kept. SetBuild is an app for stand-up comedians: write a set list, record your set, and see a report on how it went."
        noindex
      />
      <div className="max-w-2xl mx-auto px-5 pt-10 text-gray-900 dark:text-gray-100">
        <h1 className="text-base font-semibold leading-relaxed">SetBuild Privacy Policy</h1>
        <p className="mt-4 text-sm leading-relaxed">Last updated: October 9, 2026</p>
        <p className="mt-4 text-sm leading-relaxed">
          SetBuild is an app for stand-up comedians. You write a set list, record your set, and
          see a report on how it went. This page explains what we collect and what we do with it.
        </p>

        {SECTIONS.map((section) => (
          <section key={section.heading} className="mt-6">
            <h2 className="text-sm font-semibold leading-relaxed">{section.heading}</h2>
            {section.paragraphs?.map((text) => (
              <p key={text} className="mt-2 text-sm leading-relaxed">
                {text}
              </p>
            ))}
            {section.bullets && (
              <ul className="mt-2 space-y-2 text-sm leading-relaxed">
                {section.bullets.map((bullet) => (
                  <li key={bullet} className="pl-4 -indent-4">
                    - {bullet}
                  </li>
                ))}
              </ul>
            )}

          </section>
        ))}
      </div>
    </div>
  );
};

export default SetBuildPrivacy;
