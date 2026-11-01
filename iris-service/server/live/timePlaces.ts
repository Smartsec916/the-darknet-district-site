// Worldwide time questions: when the time service does not know a place by name ("What time is it in Reykjavik?"),
// look the place up and answer from its coordinates' time zone, instead of saying there is no clock for it.
import { geocode, type GeoPlace } from "./geocode";
import { planAmbiguous, planWithPlace, type Place, type TimePlan } from "../timeService";

// The full label (city, region, country) is shown, so a surprising match is visible to the visitor rather than silent
const toPlace = (g: GeoPlace): Place => ({ id: `geo:${g.lat.toFixed(2)},${g.lon.toFixed(2)}`, zone: g.zone, country: g.countryCode?.toUpperCase(), city: true, labels: [g.label] });

export async function resolveUnknownPlace(plan: TimePlan): Promise<TimePlan> {
  const name = plan.query.unknownPlace;
  if (plan.outcome !== "ask_unknown" || !name || plan.query.kind === "difference" || /\//.test(name)) return plan;
  const { result } = await geocode(name);
  if (result.kind === "one") return planWithPlace(plan, toPlace(result.place));
  if (result.kind === "ambiguous") return planAmbiguous(plan, name, result.options.map(toPlace));
  return plan;
}
