import { db } from "./prisma/db";

async function main() {
  console.log(Object.keys(db.orm.public.Survey));
}
main();
