import { api } from "@/src/trpc/server";
import fs from "fs";

export default async function createBackupOfTable() {
  let users = await api.course.getAll();
  fs.writeFileSync(
    "src/app/api/data/courses.json",
    JSON.stringify(users, null, 4),
  );
}
