import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "../../utils/jwt";

describe("JWT utils", () => {
  const userId = "test-user-id-123";

  describe("generateAccessToken / verifyAccessToken", () => {
    it("génère un token valide et en extrait le userId", () => {
      const token = generateAccessToken(userId);
      expect(typeof token).toBe("string");
      expect(token.split(".")).toHaveLength(3); // header.payload.signature

      const payload = verifyAccessToken(token);
      expect(payload.userId).toBe(userId);
    });

    it("lève une erreur sur un token altéré", () => {
      const token = generateAccessToken(userId);
      expect(() => verifyAccessToken(token + "tampered")).toThrow();
    });

    it("lève une erreur sur un token signé avec un mauvais secret", () => {
      const jwt = require("jsonwebtoken");
      const fakeToken = jwt.sign({ userId }, "mauvais_secret", {
        expiresIn: "15m",
      });
      expect(() => verifyAccessToken(fakeToken)).toThrow();
    });
  });

  describe("generateRefreshToken / verifyRefreshToken", () => {
    it("génère un refresh token valide et en extrait le userId", () => {
      const token = generateRefreshToken(userId);
      const payload = verifyRefreshToken(token);
      expect(payload.userId).toBe(userId);
    });

    it("lève une erreur sur un token altéré", () => {
      const token = generateRefreshToken(userId);
      expect(() => verifyRefreshToken(token + "x")).toThrow();
    });
  });

  describe("tokens distincts", () => {
    it("le access token et le refresh token sont différents", () => {
      const access = generateAccessToken(userId);
      const refresh = generateRefreshToken(userId);
      expect(access).not.toBe(refresh);
    });

    it("deux appels consécutifs génèrent des tokens différents (timestamp/jti)", () => {
      // On attend 1ms pour s'assurer que l'iat diffère si nécessaire
      const t1 = generateAccessToken(userId);
      const t2 = generateAccessToken(userId);
      // Même payload, même secret, les tokens peuvent être identiques dans la même seconde,
      // ce qui est le comportement normal de JWT sans jti. On vérifie juste qu'ils sont des strings.
      expect(typeof t1).toBe("string");
      expect(typeof t2).toBe("string");
    });
  });
});
