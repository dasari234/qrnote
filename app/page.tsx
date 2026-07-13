import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-4xl font-bold tracking-tight">QR Platform</h1>
      <p className="max-w-xl text-lg text-neutral-600">
        Create dynamic QR codes that link to a details page you control.
        Track every scan and download print-ready, high-resolution PDFs.
      </p>
      <div className="flex gap-3">
        <Link
          href="/signup"
          className="rounded-lg bg-brand-500 px-5 py-2.5 font-medium text-white hover:bg-brand-600"
        >
          Get started
        </Link>
        <Link
          href="/login"
          className="rounded-lg border border-neutral-300 px-5 py-2.5 font-medium hover:bg-neutral-100"
        >
          Log in
        </Link>
      </div>
    </main>
  );
}
