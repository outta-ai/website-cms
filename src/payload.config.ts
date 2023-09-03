import path from "path";
import { buildConfig } from "payload/config";
import Admins from "./collections/Admins";

export default buildConfig({
  admin: {
    user: Admins.slug,
  },
  collections: [Admins],
  typescript: {
    outputFile: path.resolve(__dirname, "payload-types.ts"),
  },
  plugins: [],
});
