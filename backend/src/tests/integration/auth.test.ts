import request from "supertest";
import app from "../../app";
import { createUser, authHeaders } from "../helpers";

describe("Auth — /api/auth", () => {
  // POST /register

  describe("POST /api/auth/register", () => {
    const validPayload = {
      email: "nouveau@example.com",
      username: "nouveauuser",
      password: "Password123!",
      originTerritory: "Guadeloupe",
    };

    it("201 - crée un compte et retourne user + accessToken", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send(validPayload);

      expect(res.status).toBe(201);
      expect(res.body.user).toMatchObject({
        email: validPayload.email,
        username: validPayload.username,
        originTerritory: validPayload.originTerritory,
      });
      expect(res.body.accessToken).toBeDefined();
      // Le cookie refreshToken doit être positionné
      expect(res.headers["set-cookie"]).toBeDefined();
      // Le hash du mot de passe ne doit jamais sortir
      expect(res.body.user.passwordHash).toBeUndefined();
    });

    it("409 - email déjà utilisé", async () => {
      await request(app).post("/api/auth/register").send(validPayload);
      const res = await request(app)
        .post("/api/auth/register")
        .send({ ...validPayload, username: "autreusername" });

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/email/i);
    });

    it("409 - username déjà pris", async () => {
      await request(app).post("/api/auth/register").send(validPayload);
      const res = await request(app)
        .post("/api/auth/register")
        .send({ ...validPayload, email: "autre@example.com" });

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/utilisateur/i);
    });

    it("400 - champs obligatoires manquants", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ email: "incomplet@example.com" });

      expect(res.status).toBe(400);
    });

    it("400 - email invalide", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ ...validPayload, email: "pas-un-email" });

      expect(res.status).toBe(400);
    });
  });

  // POST /login

  describe("POST /api/auth/login", () => {
    it("200 — connexion avec identifiants valides", async () => {
      const user = await createUser();
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: user.email, password: user.password });

      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.user.email).toBe(user.email);
      expect(res.body.user.passwordHash).toBeUndefined();
    });

    it("401 - mot de passe incorrect", async () => {
      const user = await createUser();
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: user.email, password: "MauvaisMotDePasse!" });

      expect(res.status).toBe(401);
    });

    it("401 - email inconnu", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "inconnu@example.com", password: "Password123!" });

      expect(res.status).toBe(401);
    });

    it("400 — champs manquants", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "test@example.com" });

      expect(res.status).toBe(400);
    });
  });

  //GET /me

  describe("GET /api/auth/me", () => {
    it("200 - retourne le profil de l'utilisateur connecté", async () => {
      const user = await createUser();
      const res = await request(app)
        .get("/api/auth/me")
        .set(authHeaders(user.accessToken));

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(user.id);
      expect(res.body.email).toBe(user.email);
      expect(res.body.passwordHash).toBeUndefined();
    });

    it("401 - sans token", async () => {
      const res = await request(app).get("/api/auth/me");
      expect(res.status).toBe(401);
    });

    it("401 - token invalide", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer token_bidon");
      expect(res.status).toBe(401);
    });
  });

  // POST /refresh

  describe("POST /api/auth/refresh", () => {
    it("200 - retourne un nouveau accessToken avec un refreshToken valide", async () => {
      // Utilise createUser() puis re-login pour obtenir le cookie
      const user = await createUser();
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: user.email, password: user.password });

      const cookies = loginRes.headers["set-cookie"];
      const res = await request(app)
        .post("/api/auth/refresh")
        .set("Cookie", cookies);

      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();
    });

    it("401 - sans cookie refreshToken", async () => {
      const res = await request(app).post("/api/auth/refresh");
      expect(res.status).toBe(401);
    });
  });

  // POST /logout

  describe("POST /api/auth/logout", () => {
    it("200 — déconnexion réussie et cookie effacé", async () => {
      const user = await createUser();
      const res = await request(app)
        .post("/api/auth/logout")
        .set(authHeaders(user.accessToken));

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/déconnexion/i);
    });

    it("401 — sans token", async () => {
      const res = await request(app).post("/api/auth/logout");
      expect(res.status).toBe(401);
    });
  });
});
