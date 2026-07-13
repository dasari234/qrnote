import { createQrCode } from "./actions";

export default async function NewQRCodePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-1 text-2xl font-bold">New QR code</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Fill in the details you want people to see when they scan this code.
        You can edit or pause it anytime without reprinting.
      </p>

      {error && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <form action={createQrCode} className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-6">
        <Field label="Title" name="title" required placeholder="Front Desk, Product Label, Event Booth..." />
        <Field label="Description" name="description" textarea placeholder="Shown as the main body text on the scan page" />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Phone" name="phone" placeholder="+1 555 000 1234" />
          <Field label="Email" name="email" type="email" placeholder="hello@example.com" />
        </div>
        <Field label="Website" name="website" placeholder="https://example.com" />
        <Field label="Address" name="address" placeholder="123 Main St, City" />
        <Field label="Notes" name="notes" textarea placeholder="Anything else to display" />

        <button
          type="submit"
          className="mt-2 rounded-lg bg-brand-500 px-4 py-2 font-medium text-white hover:bg-brand-600"
        >
          Create QR code
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  required,
  placeholder,
  type = "text",
  textarea = false,
}: {
  label: string;
  name: string;
  required?: boolean;
  placeholder?: string;
  type?: string;
  textarea?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {textarea ? (
        <textarea
          name={name}
          placeholder={placeholder}
          rows={3}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
      ) : (
        <input
          name={name}
          type={type}
          required={required}
          placeholder={placeholder}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
      )}
    </div>
  );
}
