"use client";

export default function CheckoutPage() {
  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold">Checkout</h1>
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-lg border p-6">
          <h2 className="mb-4 text-xl font-semibold">Shipping Address</h2>
          <form className="space-y-4">
            <input
              type="text"
              placeholder="Street Address"
              className="w-full rounded border px-4 py-2"
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="City"
                className="rounded border px-4 py-2"
              />
              <input
                type="text"
                placeholder="State"
                className="rounded border px-4 py-2"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Zip Code"
                className="rounded border px-4 py-2"
              />
              <input
                type="text"
                placeholder="Country"
                defaultValue="US"
                className="rounded border px-4 py-2"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-black py-3 font-semibold text-white hover:bg-gray-800"
            >
              Place Order
            </button>
          </form>
        </div>
        <div className="rounded-lg border p-6">
          <h2 className="mb-4 text-xl font-semibold">Order Summary</h2>
          <p className="text-gray-500">No items in cart.</p>
        </div>
      </div>
    </div>
  );
}
