import "dotenv/config";
import { app } from "../src/app";

export const config = {
  api: {
    bodyParser: false,
  },
  maxDuration: 60,
};

export default app;
