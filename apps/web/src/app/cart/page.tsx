"use client";

export default function CartPage() {
  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold">Shopping Cart</h1>
      <div className="rounded-lg border p-8 text-center">
        <p className="text-gray-500">Your cart is empty.</p>
        <a
          href="/"
          className="mt-4 inline-block text-blue-600 hover:underline"
        >
          Continue Shopping
        </a>
      </div>
    </div>
  );
}
