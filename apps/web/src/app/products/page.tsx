import type { Metadata } from "next";

// /products renders the same catalog as the homepage, so point search engines at "/"
// to avoid duplicate-content between the two URLs.
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export { default } from "../page";
