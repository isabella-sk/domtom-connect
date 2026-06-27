import request from "supertest";
import app from "../../app";
import { prisma } from "../../config/database";
import { createUser, createAdminUser, authHeaders } from "../helpers";

// Helper : crée un signalement directement en BDD (pas d'upload Cloudinary en test)
const createScamInDb = async (reporterId: string, status = "pending") => {
  return prisma.scamReport.create({
    data: {
      title: "Arnaque test",
      description: "Description de l'arnaque",
      category: "phishing",
      status,
      reporterId,
    },
  });
};

describe("Scam (Arnaques) - /api/scam", () => {
  // GET /

  describe("GET /api/scam", () => {
    it("200 - retourne uniquement les signalements vérifiés", async () => {
      const user = await createUser();

      // Créer un pending et un verified
      await createScamInDb(user.id, "pending");
      await createScamInDb(user.id, "verified");

      const res = await request(app)
        .get("/api/scam")
        .set(authHeaders(user.accessToken));

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      // Tous les résultats doivent être "verified"
      expect(res.body.every((s: any) => s.status === "verified")).toBe(true);
    });

    it("401 - sans token", async () => {
      const res = await request(app).get("/api/scam");
      expect(res.status).toBe(401);
    });
  });

  //GET /:id
  describe("GET /api/scam/:id", () => {
    it("200 - retourne un signalement vérifié par son id", async () => {
      const user = await createUser();
      const scam = await createScamInDb(user.id, "verified");

      const res = await request(app)
        .get(`/api/scam/${scam.id}`)
        .set(authHeaders(user.accessToken));

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(scam.id);
    });

    it("404 - signalement pending non accessible via GET /:id", async () => {
      const user = await createUser();
      const scam = await createScamInDb(user.id, "pending");

      const res = await request(app)
        .get(`/api/scam/${scam.id}`)
        .set(authHeaders(user.accessToken));

      expect(res.status).toBe(404);
    });

    it("404 - id inexistant", async () => {
      const user = await createUser();
      const res = await request(app)
        .get("/api/scam/00000000-0000-0000-0000-000000000000")
        .set(authHeaders(user.accessToken));

      expect(res.status).toBe(404);
    });
  });

  //POST /

  describe("POST /api/scam", () => {
    it("401 - sans token", async () => {
      const res = await request(app).post("/api/scam").send({
        title: "Arnaque",
        description: "Description",
        category: "phishing",
      });
      expect(res.status).toBe(401);
    });
  });

  // PATCH /:id/status (test de non-régression sécurité)

  describe("PATCH /api/scam/:id/status - sécurité", () => {
    it("403 - un utilisateur normal NE PEUT PAS changer le statut d'un signalement", async () => {
      const reporter = await createUser();
      const scam = await createScamInDb(reporter.id, "pending");

      // Un autre utilisateur (pas admin) tente de vérifier le signalement
      const attacker = await createUser();
      const res = await request(app)
        .patch(`/api/scam/${scam.id}/status`)
        .set(authHeaders(attacker.accessToken))
        .send({ status: "verified" });

      // Doit être 403 grâce au middleware requireAdmin ajouté dans scam.router.ts
      expect(res.status).toBe(403);

      // Vérifier que le statut n'a pas changé en BDD
      const unchanged = await prisma.scamReport.findUnique({
        where: { id: scam.id },
      });
      expect(unchanged?.status).toBe("pending");
    });

    it("403 - le reporter lui-même ne peut pas s'auto-vérifier", async () => {
      const reporter = await createUser();
      const scam = await createScamInDb(reporter.id, "pending");

      const res = await request(app)
        .patch(`/api/scam/${scam.id}/status`)
        .set(authHeaders(reporter.accessToken))
        .send({ status: "verified" });

      expect(res.status).toBe(403);
    });

    it("401 - sans token", async () => {
      const user = await createUser();
      const scam = await createScamInDb(user.id, "pending");

      const res = await request(app)
        .patch(`/api/scam/${scam.id}/status`)
        .send({ status: "verified" });

      expect(res.status).toBe(401);
    });

    it("200 - un admin PEUT changer le statut", async () => {
      const reporter = await createUser();
      const admin = await createAdminUser();
      const scam = await createScamInDb(reporter.id, "pending");

      const res = await request(app)
        .patch(`/api/scam/${scam.id}/status`)
        .set(authHeaders(admin.accessToken))
        .send({ status: "verified" });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("verified");
    });
  });

  // DELETE /:id

  describe("DELETE /api/scam/:id", () => {
    it("204 - le reporter peut supprimer son propre signalement", async () => {
      const user = await createUser();
      const scam = await createScamInDb(user.id);

      const res = await request(app)
        .delete(`/api/scam/${scam.id}`)
        .set(authHeaders(user.accessToken));

      expect(res.status).toBe(204);
    });

    it("403 - un autre utilisateur ne peut pas supprimer le signalement d'autrui", async () => {
      const reporter = await createUser();
      const other = await createUser();
      const scam = await createScamInDb(reporter.id);

      const res = await request(app)
        .delete(`/api/scam/${scam.id}`)
        .set(authHeaders(other.accessToken));

      expect(res.status).toBe(403);
    });

    it("404 - signalement inexistant", async () => {
      const user = await createUser();
      const res = await request(app)
        .delete("/api/scam/00000000-0000-0000-0000-000000000000")
        .set(authHeaders(user.accessToken));

      expect(res.status).toBe(404);
    });
  });
});
