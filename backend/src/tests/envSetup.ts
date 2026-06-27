process.env.NODE_ENV = "test";
process.env.DATABASE_URL =
  "postgresql://domtom_connect_user:domtom_connect_pass@localhost:5433/domtom_connect_test";
process.env.REDIS_URL = "redis://localhost:6379/1";
process.env.JWT_ACCESS_SECRET = "test_access_secret_long_pour_jest";
process.env.JWT_REFRESH_SECRET = "test_refresh_secret_long_pour_jest";
process.env.JWT_ACCESS_EXPIRES = "15m";
process.env.JWT_REFRESH_EXPIRES = "7d";
process.env.FRONTEND_URL = "http://localhost:5173";
