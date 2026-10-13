import { content } from "@/content";
import { CURRENCY_CODE } from "@/lib/currency";
import { SITE_URL } from "@/lib/site";
import type { Vehicle } from "@/types";

/**
 * Structured data ("JSON-LD") tells search engines what a page is about, so results can show
 * rich details such as a price. Builders only; the <script> tag is in components/seo/json-ld.tsx.
 */

/** The company itself. Placed on the home and contact pages. */
export function businessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "AutoRental",
    name: content.site.name,
    description: content.site.description,
    url: SITE_URL,
    telephone: content.site.contactPhone,
    email: content.site.contactEmail,
    address: { "@type": "PostalAddress", streetAddress: content.contact.details.addressValue, addressCountry: "PH" },
  };
}

/** One rentable vehicle with its daily price. */
export function vehicleSchema(vehicle: Vehicle) {
  const image = vehicle.images.find((asset) => asset.src)?.src;
  return {
    "@context": "https://schema.org",
    "@type": ["Product", "Car"],
    name: vehicle.name,
    url: `${SITE_URL}/vehicles/${vehicle.slug}`,
    ...(image ? { image: image.startsWith("http") ? image : `${SITE_URL}${image}` } : {}),
    category: content.enums.vehicleCategory[vehicle.category],
    ...(vehicle.seats !== undefined ? { seatingCapacity: vehicle.seats } : {}),
    offers: {
      "@type": "Offer",
      priceCurrency: CURRENCY_CODE,
      price: vehicle.pricePerDay,
      // The price is per rental day.
      priceSpecification: { "@type": "UnitPriceSpecification", price: vehicle.pricePerDay, priceCurrency: CURRENCY_CODE, unitCode: "DAY" },
      availability: vehicle.status === "available" ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };
}
