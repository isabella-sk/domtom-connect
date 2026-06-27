import request from "supertest";
import app from "../../app";
import { prisma } from "../../config/database";
import { createUser, createAdminUser, authHeaders } from "../helpers";

// Helper : crée un tip directement en BDD (pas d'upload Cloudinary en test)
const createTipInDb = async (
  authorId: string,
  isApproved = false,
  overrides: Partial<{ title: string; content: string; type: string }> = {},
) => {
  return prisma.tip.create({
    data: {
      title: overrides.title ?? "Astuce test",
      content: overrides.content ?? "Contenu de l'astuce",
      type: overrides.type ?? "tip",
      isApproved,
      authorId,
    },
  });
};

describe("Tips (Astuces) - /api/tips", () => {
  // GET /
  describe("GET /api/tips", () => {
    it("200 - retourne uniquement les astuces approuvées", async () => {
      const user = await createUser();

      await createTipInDb(user.id, false); // non approuvée
      await createTipInDb(user.id, true); // approuvée

      const res = await request(app)
        .get("/api/tips")
        .set(authHeaders(user.accessToken));

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.every((t: any) => t.isApproved === true)).toBe(true);
    });

    it("401 - sans token", async () => {
      const res = await request(app).get("/api/tips");
      expect(res.status).toBe(401);
    });
  });

  // GET /:id
  describe("GET /api/tips/:id", () => {
    it("200 - retourne une astuce approuvée par son id", async () => {
      const user = await createUser();
      const tip = await createTipInDb(user.id, true);

      const res = await request(app)
        .get(`/api/tips/${tip.id}`)
        .set(authHeaders(user.accessToken));

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(tip.id);
    });

    it("404 - astuce non approuvée non accessible", async () => {
      const user = await createUser();
      const tip = await createTipInDb(user.id, false);

      const res = await request(app)
        .get(`/api/tips/${tip.id}`)
        .set(authHeaders(user.accessToken));

      expect(res.status).toBe(404);
    });

    it("404 - id inexistant", async () => {
      const user = await createUser();
      const res = await request(app)
        .get("/api/tips/00000000-0000-0000-0000-000000000000")
        .set(authHeaders(user.accessToken));

      expect(res.status).toBe(404);
    });
  });

  //  POST /
  describe("POST /api/tips", () => {
    it("401 - sans token", async () => {
      const res = await request(app).post("/api/tips").send({
        title: "Astuce",
        content: "Contenu",
        type: "tip",
      });
      expect(res.status).toBe(401);
    });
  });

  //DELETE /:id
  describe("DELETE /api/tips/:id", () => {
    it("204 - l'auteur peut supprimer sa propre astuce", async () => {
      const user = await createUser();
      const tip = await createTipInDb(user.id, true);

      const res = await request(app)
        .delete(`/api/tips/${tip.id}`)
        .set(authHeaders(user.accessToken));

      expect(res.status).toBe(204);
    });

    it("403 - un utilisateur ne peut pas supprimer l'astuce d'un autre", async () => {
      const author = await createUser();
      const other = await createUser();
      const tip = await createTipInDb(author.id, true);

      const res = await request(app)
        .delete(`/api/tips/${tip.id}`)
        .set(authHeaders(other.accessToken));

      expect(res.status).toBe(403);
    });

    it("204 - un admin peut supprimer n'importe quelle astuce", async () => {
      const author = await createUser();
      const admin = await createAdminUser();
      const tip = await createTipInDb(author.id, true);

      const res = await request(app)
        .delete(`/api/tips/${tip.id}`)
        .set(authHeaders(admin.accessToken));

      expect(res.status).toBe(204);
    });

    it("404 - astuce inexistante", async () => {
      const user = await createUser();
      const res = await request(app)
        .delete("/api/tips/00000000-0000-0000-0000-000000000000")
        .set(authHeaders(user.accessToken));

      expect(res.status).toBe(404);
    });
  });
});
