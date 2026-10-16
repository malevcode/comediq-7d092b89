import { Link, useNavigate } from "react-router-dom";
import { X, MicVocal, Calendar, ArrowUpRight } from "lucide-react";
import SEO from "@/components/SEO";

export default function Listing() {
  const navigate = useNavigate();

  return (
    <>
      <SEO title="Create a listing | Comediq" description="List an open mic for comedians, or a show for audiences." />
      <div className="flex min-h-screen flex-col items-center justify-center bg-transparent px-4 py-16">
        <div className="w-full max-w-xl rounded-3xl bg-comediq-blue p-6 sm:p-8">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <h1 className="font-display text-4xl uppercase leading-[0.92]">What are you listing?</h1>
              <p className="text-[15px] text-[#E2E8F5]">Pick one. It takes about a minute.</p>
            </div>
            <button
              type="button"
              aria-label="Close"
              onClick={() => navigate(-1)}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/40 text-comediq-cream"
            >
              <X className="h-[18px] w-[18px]" />
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              to="/add-mic"
              className="flex items-start gap-4 rounded-2xl border border-white/25 bg-[#1A3F85] p-5 text-comediq-cream"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-comediq-cream text-[#0A1128]">
                <MicVocal className="h-[22px] w-[22px]" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-comediq-accent">For comedians</span>
                <span className="font-display text-2xl uppercase leading-none">An open mic</span>
                <span className="text-[15px] text-[#E2E8F5]">
                  Comics find it, register and get up. Add the venue, day, time, set length and cover.
                </span>
              </span>
              <ArrowUpRight className="mt-1 h-[18px] w-[18px] shrink-0 self-center text-[#D2DCF0]" />
            </Link>

            <Link
              to="/add-show"
              className="flex items-start gap-4 rounded-2xl border border-white/25 bg-[#1A3F85] p-5 text-comediq-cream"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-comediq-cream text-[#0A1128]">
                <Calendar className="h-[22px] w-[22px]" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-comediq-accent">For audiences</span>
                <span className="font-display text-2xl uppercase leading-none">A show</span>
                <span className="text-[15px] text-[#E2E8F5]">
                  People find it and RSVP or grab tickets. Add the venue, date, time and ticket link.
                </span>
              </span>
              <ArrowUpRight className="mt-1 h-[18px] w-[18px] shrink-0 self-center text-[#D2DCF0]" />
            </Link>
          </div>

          <p className="mt-5 text-sm text-[#D2DCF0]">
            Questions?{" "}
            <a href="https://instagram.com/comediq.us" className="underline underline-offset-4">
              DM @comediq.us
            </a>
          </p>
        </div>
      </div>
    </>
  );
}
