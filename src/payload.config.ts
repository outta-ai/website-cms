import path from "path";
import { buildConfig } from "payload/config";
import Users from "./collections/Users";

export default buildConfig({
  admin: {
    user: Users.slug,
  },
  collections: [Users],
  typescript: {
    outputFile: path.resolve(__dirname, "payload-types.ts"),
  },
  plugins: [],
});
