import { HelpCircle, Mail } from 'lucide-react';

export default function HelpView() {
  return <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6"><div className="mb-8 flex items-center gap-4"><span className="rounded-2xl bg-indigo-100 p-3 text-indigo-700"><HelpCircle size={25} /></span><div><p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">We are here to help</p><h1 className="text-3xl font-extrabold text-slate-950">Help & Support</h1></div></div><section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-bold text-slate-900">Need a hand?</h2><p className="mt-2 text-slate-600">For order, account, or listing questions, contact our support team and include your marketplace email.</p><a href="mailto:support@marketplace.local" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white hover:bg-indigo-700"><Mail size={18} /> Contact support</a></section></main>;
}
