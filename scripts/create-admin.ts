import "dotenv/config";
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import bcrypt from "bcryptjs";
import { AdminRole } from "../app/generated/prisma/client";
import { createPrismaClient } from "../lib/prisma";

function askHidden(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    output.write(prompt);

    const stdin = input;
    const wasRaw = stdin.isRaw;
    stdin.setRawMode?.(true);
    stdin.resume();
    stdin.setEncoding("utf8");

    let value = "";

    const onData = (chunk: string) => {
      switch (chunk) {
        case "\n":
        case "\r":
        case "\u0004":
          stdin.setRawMode?.(wasRaw ?? false);
          stdin.pause();
          stdin.removeListener("data", onData);
          output.write("\n");
          resolve(value);
          break;
        case "\u0003":
          process.exit(130);
          break;
        case "\u007f":
          value = value.slice(0, -1);
          break;
        default:
          if (chunk >= " " || chunk === "\t") {
            value += chunk;
          }
          break;
      }
    };

    stdin.on("data", onData);
  });
}

async function main() {
  const rl = readline.createInterface({ input, output });

  output.write("\nBuat / perbarui akun admin R9host\n");
  output.write("Kredensial tidak disimpan ke file .env\n\n");

  const name = (await rl.question("Nama admin: ")).trim() || "Administrator";
  const email = (await rl.question("Email: ")).trim().toLowerCase();
  rl.close();

  if (!email || !email.includes("@")) {
    throw new Error("Email tidak valid.");
  }

  const password = await askHidden("Password (tidak ditampilkan): ");
  const confirm = await askHidden("Ulangi password: ");

  if (!password || password.length < 8) {
    throw new Error("Password minimal 8 karakter.");
  }

  if (password !== confirm) {
    throw new Error("Konfirmasi password tidak cocok.");
  }

  const prisma = createPrismaClient();
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.admin.upsert({
    where: { email },
    update: {
      name,
      passwordHash,
      role: AdminRole.SUPER,
      isActive: true,
    },
    create: {
      name,
      email,
      passwordHash,
      role: AdminRole.SUPER,
      isActive: true,
    },
  });

  await prisma.$disconnect();
  output.write(`\nAdmin siap: ${email}\n`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
