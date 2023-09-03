import path from "path";
import { buildConfig } from "payload/config";
import Admins from "./collections/Admins";
import Members from "./collections/Members";

export default buildConfig({
  admin: {
    user: Admins.slug,
  },
  collections: [Members, Admins],
  typescript: {
    outputFile: path.resolve(__dirname, "payload-types.ts"),
  },
  plugins: [],
});
