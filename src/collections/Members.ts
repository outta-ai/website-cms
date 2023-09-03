import { CollectionConfig } from "payload/types";

const Members: CollectionConfig = {
  slug: "members",
  auth: true,
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name"],
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
    },
    {
      name: "works",
      type: "array",
      fields: [
        {
          name: "description",
          type: "text",
        },
      ],
    },
  ],
};

export default Members;
