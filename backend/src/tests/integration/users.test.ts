import request from "supertest";
import app from "../../app";
import { createUser, authHeaders } from "../helpers";

describe("Users - /api/users", () => {
  // GET /
  describe("GET /api/users", () => {
    it("200 - retourne la liste des utilisateurs", async () => {
      const user = await createUser();
      const res = await request(app)
        .get("/api/users")
        .set(authHeaders(user.accessToken));

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it("401 - sans token", async () => {
      const res = await request(app).get("/api/users");
      expect(res.status).toBe(401);
    });
  });

  // GET /me
  describe("GET /api/users/me", () => {
    it("200 - retourne le profil de l'utilisateur connecté", async () => {
      const user = await createUser();
      const res = await request(app)
        .get("/api/users/me")
        .set(authHeaders(user.accessToken));

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(user.id);
    });

    it("401 - sans token", async () => {
      const res = await request(app).get("/api/users/me");
      expect(res.status).toBe(401);
    });
  });

  // PATCH /me
  describe("PATCH /api/users/me", () => {
    it("200 - met à jour le profil", async () => {
      const user = await createUser();
      const res = await request(app)
        .patch("/api/users/me")
        .set(authHeaders(user.accessToken))
        .send({ bio: "Ma nouvelle bio" });

      expect(res.status).toBe(200);
      expect(res.body.bio).toBe("Ma nouvelle bio");
    });

    it("409 - username déjà pris par un autre utilisateur", async () => {
      const user1 = await createUser();
      const user2 = await createUser();

      const res = await request(app)
        .patch("/api/users/me")
        .set(authHeaders(user2.accessToken))
        .send({ username: user1.username });

      expect(res.status).toBe(409);
    });

    it("401 - sans token", async () => {
      const res = await request(app)
        .patch("/api/users/me")
        .send({ bio: "Test" });
      expect(res.status).toBe(401);
    });
  });

  // GET /:id
  describe("GET /api/users/:id", () => {
    it("200 - retourne le profil public d'un utilisateur", async () => {
      const user1 = await createUser();
      const user2 = await createUser();

      const res = await request(app)
        .get(`/api/users/${user1.id}`)
        .set(authHeaders(user2.accessToken));

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(user1.id);
      // Le profil public ne doit pas exposer le hash du mot de passe
      expect(res.body.passwordHash).toBeUndefined();
    });

    it("404 - id inexistant", async () => {
      const user = await createUser();
      const res = await request(app)
        .get("/api/users/00000000-0000-0000-0000-000000000000")
        .set(authHeaders(user.accessToken));

      expect(res.status).toBe(404);
    });
  });

  // Follow/Unfollow
  describe("POST /:id/follow & DELETE /:id/follow", () => {
    it("201 - un utilisateur peut suivre un autre", async () => {
      const follower = await createUser();
      const followed = await createUser();

      const res = await request(app)
        .post(`/api/users/${followed.id}/follow`)
        .set(authHeaders(follower.accessToken));

      expect(res.status).toBe(201);
    });

    it("400 - un utilisateur ne peut pas se suivre lui-même", async () => {
      const user = await createUser();
      const res = await request(app)
        .post(`/api/users/${user.id}/follow`)
        .set(authHeaders(user.accessToken));

      expect(res.status).toBe(400);
    });

    it("409 - ne peut pas suivre deux fois le même utilisateur", async () => {
      const follower = await createUser();
      const followed = await createUser();

      await request(app)
        .post(`/api/users/${followed.id}/follow`)
        .set(authHeaders(follower.accessToken));

      const res = await request(app)
        .post(`/api/users/${followed.id}/follow`)
        .set(authHeaders(follower.accessToken));

      expect(res.status).toBe(409);
    });

    it("200 - peut se désabonner", async () => {
      const follower = await createUser();
      const followed = await createUser();

      await request(app)
        .post(`/api/users/${followed.id}/follow`)
        .set(authHeaders(follower.accessToken));

      const res = await request(app)
        .delete(`/api/users/${followed.id}/follow`)
        .set(authHeaders(follower.accessToken));

      expect(res.status).toBe(200);
    });

    it("404 - désabonnement si pas abonné", async () => {
      const follower = await createUser();
      const followed = await createUser();

      const res = await request(app)
        .delete(`/api/users/${followed.id}/follow`)
        .set(authHeaders(follower.accessToken));

      expect(res.status).toBe(404);
    });
  });

  // DELETE /me
  describe("DELETE /api/users/me", () => {
    it("204 - un utilisateur peut supprimer son compte", async () => {
      const user = await createUser();
      const res = await request(app)
        .delete("/api/users/me")
        .set(authHeaders(user.accessToken));

      expect(res.status).toBe(204);
    });

    it("401 - sans token", async () => {
      const res = await request(app).delete("/api/users/me");
      expect(res.status).toBe(401);
    });
  });
});
