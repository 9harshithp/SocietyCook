import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, FileText, AlertTriangle, ArrowLeft, ChefHat } from 'lucide-react';

export function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8 text-slate-900 dark:text-slate-100">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
          Drafted for Legal Review · Version 2.0
        </span>
        <h1 className="text-3xl font-black mt-2">Terms of Service</h1>
        <p className="text-xs text-slate-500 mt-1">Effective Date: November 2026 · SocietyCook Platform</p>
      </div>

      <div className="space-y-6 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">1. Nature of the Hyperlocal Service</h2>
          <p>
            SocietyCook operates as a hyperlocal workforce coordination and demand aggregation platform. Our service connects residential households within gated housing societies with verified domestic cooking professionals. The service involves in-kitchen preparation of meals during dedicated time windows; SocietyCook does not deliver prepared meals from commercial cloud kitchens.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">2. Community Cook Clusters & Dynamic Pricing</h2>
          <p>
            Residents participating in cook-sharing groups agree to adhere to their booked recurring 45-minute cooking window with a 15-minute elevator transition buffer. Discounted cluster pricing applies provided the group maintains the minimum required household participation. In the event of flat cancellations reducing the group below the threshold, pricing is recalculated according to our transparent volume tier rulebook.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">3. Daily OTP Verification & Attendance Billing</h2>
          <p>
            Service delivery is authenticated on a per-session basis via a 4-digit One-Time Password (OTP) generated on the resident's dashboard. Checking in and checking out with the OTP serves as conclusive evidence of cook arrival and departure, triggering attendance ledger updates.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">4. Cook Verification & Fair Compensation Floor</h2>
          <p>
            All cooks on SocietyCook undergo background verification, Aadhaar identity check, and basic hygiene validation prior to campus clearance. SocietyCook guarantees a fair monthly living wage floor (minimum ₹15,000 to ₹25,000 per month depending on cluster size) with zero travel deductions.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">5. Backup Cook Guarantee & Leave Policy</h2>
          <p>
            Cooks are entitled to pre-approved leaves. Upon approved leave, SocietyCook's automated backup allocation engine assigns an authorized, society-cleared standby cook to service the cluster's scheduled appointments without additional fee to residents.
          </p>
        </section>
      </div>

      <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
        <Link to="/" className="text-xs font-bold text-emerald-600 hover:underline inline-flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
        </Link>
      </div>
    </div>
  );
}

export function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8 text-slate-900 dark:text-slate-100">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
          Drafted for Legal Review · Privacy & Data Protection
        </span>
        <h1 className="text-3xl font-black mt-2">Privacy Policy</h1>
        <p className="text-xs text-slate-500 mt-1">Effective Date: November 2026 · SocietyCook Platform</p>
      </div>

      <div className="space-y-6 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">1. Information We Collect</h2>
          <p>
            We collect personal identification details (name, email, verified mobile number), residential location (residential society, building block/tower, and apartment flat number), dietary preferences, and session timestamps. For cooks, we collect government ID tokens (Aadhaar/Voter ID), police verification status, and direct bank payout coordinates.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">2. Use of Information</h2>
          <p>
            Your residential location is used strictly to assemble hyperlocal cooking clusters within the same tower and generate elevator-optimized routing. Flat numbers are disclosed only to the assigned cook and society security desk. We do not sell or monetize personal data to third-party ad networks.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">3. Security & Access Control</h2>
          <p>
            Sensitive credentials such as passwords and session tokens are protected using industry-standard bcrypt hashing and cryptographically signed JWTs with short expiry. Role-Based Access Control (RBAC) ensures residents cannot view other towers' private session notes or financial payout ledgers.
          </p>
        </section>
      </div>

      <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
        <Link to="/" className="text-xs font-bold text-emerald-600 hover:underline inline-flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
        </Link>
      </div>
    </div>
  );
}

export function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-4">
      <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-4">
        <ChefHat className="w-8 h-8" />
      </div>
      <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-2">404 - Page Not Found</h1>
      <p className="text-xs text-slate-500 max-w-sm mb-6">
        The society route or cluster page you are looking for does not exist or may have been migrated.
      </p>
      <Link
        to="/app"
        className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md"
      >
        Return to Society Dashboard
      </Link>
    </div>
  );
}

export function ForbiddenPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-4">
      <div className="w-16 h-16 rounded-3xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">403 - Access Forbidden</h1>
      <p className="text-xs text-slate-500 max-w-sm mb-6">
        You do not possess the required society permissions or role to view this operational desk.
      </p>
      <Link
        to="/app"
        className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md"
      >
        Return to My Dashboard
      </Link>
    </div>
  );
}
