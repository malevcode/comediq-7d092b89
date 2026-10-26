import { Link } from "react-router-dom";

/**
 * The one header logo + "Comediq" text, shared by the landing nav and
 * PageHeader so every page matches. Cream Q only: the blue logo vanishes
 * on the blue background. Uses the WIDE Archivo (110%), not the condensed
 * headline style.
 */
const Wordmark = () => (
  <Link to="/" className="flex shrink-0 items-center gap-[10px]" aria-label="Comediq home">
    <img src="/landing/logo-mark.png" alt="" className="h-[30px] w-auto sm:h-9" />
    <span
      className="text-[22px] leading-none text-[#F6F1E4] sm:text-[26px]"
      style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 800, fontStretch: "110%", letterSpacing: "-0.02em" }}
    >
      Comediq
    </span>
  </Link>
);

export default Wordmark;
