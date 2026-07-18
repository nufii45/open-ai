"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Bookmark, Check, Search, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { findDrug, type Drug } from "@/data/drugs";

const SAVED_MEDICINES_KEY = "healthbridge:savedMeds";

type DrugResult = Drug & {
  savings: number;
  estimated: boolean;
};

type DrugLabelInfo = {
  available: boolean;
  indication?: string | null;
  warning?: string | null;
};

function toResult(drug: Drug, estimated = false): DrugResult {
  return {
    ...drug,
    savings: drug.brandedPrice - drug.genericPrice,
    estimated,
  };
}

function medicineId(drug: Pick<Drug, "brand" | "generic" | "dosage">): string {
  return `${drug.brand}|${drug.generic}|${drug.dosage}`.toLowerCase().replace(/\s+/g, " ").trim();
}

function isSavedMedicine(value: unknown): value is DrugResult {
  if (!value || typeof value !== "object") return false;
  const drug = value as Record<string, unknown>;
  return (
    typeof drug.brand === "string" &&
    typeof drug.generic === "string" &&
    typeof drug.dosage === "string" &&
    typeof drug.category === "string" &&
    typeof drug.priceSource === "string" &&
    typeof drug.brandedPrice === "number" &&
    typeof drug.genericPrice === "number" &&
    typeof drug.savings === "number" &&
    typeof drug.estimated === "boolean" &&
    (drug.priceStatus === undefined || drug.priceStatus === "unverified" || drug.priceStatus === "verified")
  );
}

function pesos(value: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2,
  }).format(value);
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<DrugResult | null>(null);
  const [savedMedicines, setSavedMedicines] = useState<DrugResult[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "empty" | "error">("idle");
  const [drugInfo, setDrugInfo] = useState<DrugLabelInfo | null>(null);
  const [drugInfoStatus, setDrugInfoStatus] = useState<"idle" | "loading" | "unavailable">("idle");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(SAVED_MEDICINES_KEY);
      if (!stored) return;
      const parsed: unknown = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        // Intentional one-time hydration from browser-only storage.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSavedMedicines(parsed.filter(isSavedMedicine));
      }
    } catch {
      // Storage can be disabled or contain malformed old data. Keep an in-memory list.
    }
  }, []);

  const savedResult = useMemo(
    () => (result ? savedMedicines.some((medicine) => medicineId(medicine) === medicineId(result)) : false),
    [result, savedMedicines],
  );

  function writeSavedMedicines(next: DrugResult[]) {
    try {
      window.localStorage.setItem(SAVED_MEDICINES_KEY, JSON.stringify(next));
    } catch {
      // A full/private-mode store should never prevent the current in-memory session from working.
    }
  }

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    setStatus("loading");
    setResult(null);
    setDrugInfo(null);
    setDrugInfoStatus("idle");

    const localDrug = findDrug(trimmedQuery);
    if (localDrug) {
      setResult(toResult(localDrug));
      setStatus("idle");
      return;
    }

    try {
      const response = await fetch(`/api/lookup?q=${encodeURIComponent(trimmedQuery)}`);
      if (response.status === 404) {
        setStatus("empty");
        return;
      }
      if (!response.ok) throw new Error("Lookup request failed");

      const data: unknown = await response.json();
      if (!isSavedMedicine(data)) throw new Error("Invalid lookup response");
      setResult(data);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }

  function saveCurrentMedicine() {
    if (!result) return;
    setSavedMedicines((previous) => {
      if (previous.some((medicine) => medicineId(medicine) === medicineId(result))) return previous;
      const next = [...previous, result];
      writeSavedMedicines(next);
      return next;
    });
  }

  function removeMedicine(id: string) {
    setSavedMedicines((previous) => {
      const next = previous.filter((medicine) => medicineId(medicine) !== id);
      writeSavedMedicines(next);
      return next;
    });
  }

  async function loadDrugInfo() {
    if (!result) return;
    setDrugInfoStatus("loading");
    setDrugInfo(null);

    try {
      const genericName = result.openFdaGenericName ?? result.generic;
      const response = await fetch(`/api/drug-info?generic=${encodeURIComponent(genericName)}`);
      if (!response.ok) throw new Error("FDA label request failed");
      const data: unknown = await response.json();
      const info = data as DrugLabelInfo;
      if (!info.available || (typeof info.indication !== "string" && typeof info.warning !== "string")) {
        setDrugInfoStatus("unavailable");
        return;
      }
      setDrugInfo(info);
      setDrugInfoStatus("idle");
    } catch {
      setDrugInfoStatus("unavailable");
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-950 sm:px-6">
      <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="space-y-6">
          <header className="space-y-3 pt-2">
            <Badge className="bg-teal-100 text-teal-800 hover:bg-teal-100">HealthBridge</Badge>
            <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
              Find the generic. Keep the savings.
            </h1>
            <p className="max-w-xl text-base text-slate-600 sm:text-lg">
              Search a branded medicine to compare it with its generic equivalent in seconds.
            </p>
          </header>

          <form className="flex gap-2" onSubmit={handleSearch}>
            <Input
              aria-label="Search for a medicine"
              className="h-12 bg-white text-base"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Try Biogesic, Lipitor, or paracetamol"
              value={query}
            />
            <Button className="h-12 shrink-0" disabled={status === "loading"} type="submit">
              <Search aria-hidden="true" />
              <span className="hidden sm:inline">Search</span>
            </Button>
          </form>

          {status === "loading" && (
            <Card aria-live="polite">
              <CardContent className="space-y-5 pt-6">
                <Skeleton className="h-8 w-2/5" />
                <Skeleton className="h-16 w-3/5" />
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          )}

          {status === "empty" && (
            <Card>
              <CardHeader>
                <CardTitle>No medicine found</CardTitle>
                <CardDescription>
                  Try a brand or generic name, such as Biogesic or paracetamol.
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {status === "error" && (
            <Card>
              <CardHeader>
                <CardTitle>We could not complete that lookup</CardTitle>
                <CardDescription>Please check your connection and try again.</CardDescription>
              </CardHeader>
            </Card>
          )}

          {result && (
            <Card className="overflow-hidden border-teal-200 shadow-sm">
              <CardHeader className="bg-teal-50/80">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardDescription className="font-medium text-teal-800">Potential savings per unit</CardDescription>
                    <CardTitle className="mt-1 text-5xl font-black tracking-tight text-teal-700 sm:text-6xl">
                      {pesos(result.savings)}
                    </CardTitle>
                  </div>
                  {result.estimated && <Badge variant="secondary">Estimated</Badge>}
                </div>
              </CardHeader>
              <CardContent className="space-y-5 pt-6">
                <div>
                  <h2 className="text-2xl font-bold">{result.brand}</h2>
                  <p className="text-slate-600">Generic: {result.generic} · {result.dosage}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border bg-slate-50 p-4">
                    <p className="text-sm text-slate-600">Branded</p>
                    <p className="mt-1 text-xl font-bold">{pesos(result.brandedPrice)}</p>
                  </div>
                  <div className="rounded-lg border border-teal-200 bg-teal-50 p-4">
                    <p className="text-sm text-teal-800">Generic</p>
                    <p className="mt-1 text-xl font-bold text-teal-800">{pesos(result.genericPrice)}</p>
                  </div>
                </div>
                <div className="text-sm text-slate-500">
                  <p>Price via {result.priceSource}</p>
                  {result.priceStatus === "verified" && result.priceCheckedAt ? (
                    <p>Checked {result.priceCheckedAt}</p>
                  ) : (
                    <p className="mt-1 text-amber-700">Demo pricing — verify before relying on it.</p>
                  )}
                </div>
                <Button className="w-full" onClick={saveCurrentMedicine} type="button" variant={savedResult ? "secondary" : "default"}>
                  {savedResult ? <Check aria-hidden="true" /> : <Bookmark aria-hidden="true" />}
                  {savedResult ? "Saved to my list" : "Save to my list"}
                </Button>
                <div className="rounded-lg border bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium">Optional FDA label information</p>
                    {!drugInfo && (
                      <Button disabled={drugInfoStatus === "loading"} onClick={loadDrugInfo} size="sm" type="button" variant="outline">
                        {drugInfoStatus === "loading" ? "Loading…" : "View label info"}
                      </Button>
                    )}
                  </div>
                  {drugInfo && (
                    <div className="mt-3 space-y-3 text-sm text-slate-700">
                      {drugInfo.indication && <p><span className="font-semibold">Used for: </span>{drugInfo.indication}</p>}
                      {drugInfo.warning && <p><span className="font-semibold">Label warning: </span>{drugInfo.warning}</p>}
                      <p className="text-xs text-slate-500">From openFDA U.S. product labels. This does not replace advice from a doctor or pharmacist.</p>
                    </div>
                  )}
                  {drugInfoStatus === "unavailable" && (
                    <p className="mt-3 text-sm text-slate-600">FDA label information is not available for this medicine right now.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </section>

        <aside>
          <Card className="lg:sticky lg:top-6">
            <CardHeader>
              <CardTitle>My medicines</CardTitle>
              <CardDescription>Your list is saved on this device.</CardDescription>
            </CardHeader>
            <CardContent>
              {savedMedicines.length === 0 ? (
                <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">No saved medicines yet.</p>
              ) : (
                <ul className="space-y-3">
                  {savedMedicines.map((medicine) => (
                    <li className="flex items-start justify-between gap-3 rounded-lg border p-3" key={medicineId(medicine)}>
                      <div>
                        <p className="font-semibold">{medicine.brand}</p>
                        <p className="text-sm text-slate-600">Save {pesos(medicine.savings)}</p>
                      </div>
                      <Button aria-label={`Remove ${medicine.brand}`} onClick={() => removeMedicine(medicineId(medicine))} size="icon" type="button" variant="ghost">
                        <X aria-hidden="true" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  );
}
