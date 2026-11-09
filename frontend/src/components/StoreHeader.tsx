import { BrainCircuit } from "lucide-react";
import { Link } from "react-router-dom";

function StoreHeader() {
  return (
    <header className="border-b border-[#e4e8ee] bg-white text-[#27313d]">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8 lg:px-10">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex size-10 items-center justify-center rounded-xl bg-[#5945e8] text-white shadow-lg shadow-[#5945e8]/20">
            <BrainCircuit className="size-5" strokeWidth={2.4} />
          </span>
          <span className="text-xl font-semibold tracking-tight">
            Digi<span className="text-[#5945e8]">Ai</span>
          </span>
        </Link>
        <Link
          to="/login"
          className="rounded-lg bg-[#5945e8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4935d7]"
        >
          Sign in
        </Link>
      </div>
    </header>
  );
}

export default StoreHeader;
