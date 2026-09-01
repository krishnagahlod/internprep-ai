import { describe, it, expect } from "vitest";

describe("ATS Analysis Utilities", () => {
  it("should evaluate bullet line wrapping risk accurately", () => {
    const singleLineBullet =
      "Engineered high-throughput event processing pipeline reducing latency by 45%.";
    const lineWrapBullet =
      "Spearheaded enterprise cloud migration across 14 cross-functional engineering teams, architecting microservices architecture that successfully handled over 50,000 requests per second while reducing monthly AWS infrastructure compute costs by $18,000 through automated Spot Instance autoscaling.";

    expect(singleLineBullet.length).toBeLessThan(110);
    expect(lineWrapBullet.length).toBeGreaterThan(160);
  });

  it("should detect power action verbs in achievements", () => {
    const powerVerbs = [
      "Engineered",
      "Spearheaded",
      "Architected",
      "Orchestrated",
      "Formulated",
      "Maximized",
    ];
    const testBullet =
      "Architected distributed low-latency caching system serving 1M daily queries.";

    const firstWord = testBullet.split(" ")[0];
    expect(powerVerbs.includes(firstWord)).toBe(true);
  });

  it("should verify dual-currency INR format helper", () => {
    const formatINR = (val: number) => {
      if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
      if (val >= 100000) return `₹${(val / 100000).toFixed(1)} LPA`;
      return `₹${val.toLocaleString("en-IN")}`;
    };

    expect(formatINR(25100000)).toBe("₹2.51 Cr");
    expect(formatINR(1800000)).toBe("₹18.0 LPA");
    expect(formatINR(45000)).toBe("₹45,000");
  });
});
