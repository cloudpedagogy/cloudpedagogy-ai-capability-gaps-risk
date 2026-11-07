import { describe, it, expect } from "vitest";
import { DOMAINS, bandForAverage, clampScore, type DomainKey } from "../domain/model";

describe("Domain Model", () => {
  it("defines all six canonical framework domains", () => {
    const keys: DomainKey[] = ["awareness", "coagency", "practice", "ethics", "governance", "renewal"];
    expect(DOMAINS).toHaveLength(6);
    expect(DOMAINS.map((d) => d.key)).toEqual(keys);

    DOMAINS.forEach((d) => {
      expect(d.label).toBeTruthy();
      expect(d.description).toBeTruthy();
    });
  });

  it("clamps scores to 0-4 range", () => {
    expect(clampScore(-5)).toBe(0);
    expect(clampScore(0)).toBe(0);
    expect(clampScore(2.5)).toBe(2.5);
    expect(clampScore(4)).toBe(4);
    expect(clampScore(10)).toBe(4);
  });

  it("correctly determines capability bands for average score thresholds", () => {
    // Emerging: < 1.25
    expect(bandForAverage(0)).toBe("Emerging");
    expect(bandForAverage(1.0)).toBe("Emerging");
    expect(bandForAverage(1.24)).toBe("Emerging");

    // Developing: >= 1.25 and < 2.5
    expect(bandForAverage(1.25)).toBe("Developing");
    expect(bandForAverage(2.0)).toBe("Developing");
    expect(bandForAverage(2.49)).toBe("Developing");

    // Established: >= 2.5 and < 3.5
    expect(bandForAverage(2.5)).toBe("Established");
    expect(bandForAverage(3.0)).toBe("Established");
    expect(bandForAverage(3.49)).toBe("Established");

    // Leading: >= 3.5
    expect(bandForAverage(3.5)).toBe("Leading");
    expect(bandForAverage(3.8)).toBe("Leading");
    expect(bandForAverage(4.0)).toBe("Leading");
  });
});
