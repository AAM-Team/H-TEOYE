import { describe, expect, it } from "vitest";
import { consumirCupo, huellaAnonima } from "@/lib/limite-envios";

describe("consumirCupo", () => {
  it("permite hasta el máximo y luego bloquea dentro de la ventana", () => {
    const id = "198.51.100.7";
    const t0 = 1_000_000;
    for (let i = 0; i < 3; i++) expect(consumirCupo(id, t0 + i, 3, 60_000).permitido).toBe(true);
    expect(consumirCupo(id, t0 + 10, 3, 60_000).permitido).toBe(false);
    expect(consumirCupo(id, t0 + 61_000, 3, 60_000).permitido).toBe(true);
  });

  it("nunca expone el identificador original", () => {
    const h = huellaAnonima("203.0.113.9");
    expect(h).toMatch(/^[a-f0-9]{64}$/);
    expect(h).not.toContain("203.0.113.9");
  });
});
