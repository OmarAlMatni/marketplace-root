import { Heart } from 'lucide-react';

export default function SavedView() {
  return <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6"><div className="mb-8 flex items-center gap-4"><span className="rounded-2xl bg-indigo-100 p-3 text-indigo-700"><Heart size={25} /></span><div><p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">Your collection</p><h1 className="text-3xl font-extrabold text-slate-950">Saved Items</h1></div></div><div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">You have not saved any listings yet.</div></main>;
}
