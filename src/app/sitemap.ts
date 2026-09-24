import type { MetadataRoute } from "next";
import { listVehicles } from "@/api/vehicles";
import { SITE_URL } from "@/lib/site";

const STATIC_PATHS = ["/", "/vehicles", "/special-offers", "/about", "/contact", "/review"];

/** Lists every public page (including each vehicle) for search engines. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const vehicles = await listVehicles();
  const paths = [...STATIC_PATHS, ...vehicles.map((v) => `/vehicles/${v.slug}`)];
  return paths.map((path) => ({ url: `${SITE_URL}${path === "/" ? "" : path}` }));
}
