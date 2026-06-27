import request from "supertest";
import app from "../../app";
import { prisma } from "../../config/database";
import { createUser, createAdminUser, authHeaders } from "../helpers";

describe("Posts (Guides) - /api/posts", () => {
  // GET /

  describe("GET /api/posts", () => {
    it("200 - retourne la liste des guides (vide par défaut)", async () => {
      const user = await createUser();
      const res = await request(app)
        .get("/api/posts")
        .set(authHeaders(user.accessToken));

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it("401 - sans token", async () => {
      const res = await request(app).get("/api/posts");
      expect(res.status).toBe(401);
    });

    it("200 - filtre par catégorie", async () => {
      const admin = await createAdminUser();

      // Créer un post admin via Prisma (pas de Cloudinary en test)
      await prisma.post.create({
        data: {
          title: "Guide logement",
          content: "Contenu logement",
          category: "logement",
          authorId: admin.id,
        },
      });
      await prisma.post.create({
        data: {
          title: "Guide santé",
          content: "Contenu santé",
          category: "sante",
          authorId: admin.id,
        },
      });

      const res = await request(app)
        .get("/api/posts?category=logement")
        .set(authHeaders(admin.accessToken));

      expect(res.status).toBe(200);
      expect(res.body.every((p: any) => p.category === "logement")).toBe(true);
    });
  });

  // GET /:id

  describe("GET /api/posts/:id", () => {
    it("200 - retourne un guide par son id", async () => {
      const admin = await createAdminUser();
      const post = await prisma.post.create({
        data: {
          title: "Guide test",
          content: "Contenu test",
          category: "transport",
          authorId: admin.id,
        },
      });

      const res = await request(app)
        .get(`/api/posts/${post.id}`)
        .set(authHeaders(admin.accessToken));

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(post.id);
    });

    it("404 - id inexistant", async () => {
      const user = await createUser();
      const res = await request(app)
        .get("/api/posts/00000000-0000-0000-0000-000000000000")
        .set(authHeaders(user.accessToken));

      expect(res.status).toBe(404);
    });
  });

  //  POST / (admin only)

  describe("POST /api/posts", () => {
    it("403 - un utilisateur non-admin ne peut pas créer un guide", async () => {
      const user = await createUser();
      const res = await request(app)
        .post("/api/posts")
        .set(authHeaders(user.accessToken))
        .field("title", "Guide non autorisé")
        .field("content", "Contenu")
        .field("category", "logement");

      expect(res.status).toBe(403);
    });

    it("401 - sans token", async () => {
      const res = await request(app).post("/api/posts").send({
        title: "Guide",
        content: "Contenu",
        category: "logement",
      });
      expect(res.status).toBe(401);
    });
  });

  // DELETE /:id

  describe("DELETE /api/posts/:id", () => {
    it("204 - un admin peut supprimer n'importe quel guide", async () => {
      const admin = await createAdminUser();
      const post = await prisma.post.create({
        data: {
          title: "Guide à supprimer",
          content: "Contenu",
          category: "vie-pratique",
          authorId: admin.id,
        },
      });

      const res = await request(app)
        .delete(`/api/posts/${post.id}`)
        .set(authHeaders(admin.accessToken));

      expect(res.status).toBe(204);
    });

    it("403 - un utilisateur ne peut pas supprimer le guide d'un autre", async () => {
      const admin = await createAdminUser();
      const user = await createUser();
      const post = await prisma.post.create({
        data: {
          title: "Guide de l'admin",
          content: "Contenu",
          category: "logement",
          authorId: admin.id,
        },
      });

      const res = await request(app)
        .delete(`/api/posts/${post.id}`)
        .set(authHeaders(user.accessToken));

      expect(res.status).toBe(403);
    });

    it("404 - guide inexistant", async () => {
      const admin = await createAdminUser();
      const res = await request(app)
        .delete("/api/posts/00000000-0000-0000-0000-000000000000")
        .set(authHeaders(admin.accessToken));

      expect(res.status).toBe(404);
    });
  });
});
