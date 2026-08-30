import { describe, it, expect } from "vitest";
import { scoreProducts, fallbackRecommendations, fallbackSummary } from "../lib/prediction";
import { products } from "../lib/mockProducts";
import type { PredictionInput } from "../lib/types";

describe("ShopSense AI Prediction Engine", () => {
  const sampleInput: PredictionInput = {
    purpose: "personal",
    householdSize: 4,
    usageFrequency: "regular",
    sustainabilityPriority: 5,
  };

  it("scores products and ranks top matches deterministically", () => {
    const scored = scoreProducts(sampleInput, products);
    expect(scored.length).toBeGreaterThan(0);
    expect(scored[0].score).toBeGreaterThanOrEqual(scored[scored.length - 1].score);
    expect(scored[0].signals).toBeDefined();
  });

  it("generates signal-grounded fallback recommendations", () => {
    const scored = scoreProducts(sampleInput, products);
    const recs = fallbackRecommendations(scored, 3);
    expect(recs.length).toBe(3);
    expect(recs[0].productId).toBeDefined();
    expect(recs[0].reason.length).toBeGreaterThan(5);
  });

  it("generates a plain-language summary naming input drivers", () => {
    const scored = scoreProducts(sampleInput, products);
    const summary = fallbackSummary(sampleInput, scored);
    expect(summary).toContain("household of 4");
    expect(summary).toContain("sustainability");
  });
});
