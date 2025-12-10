import { UserRole, UserStatus } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import envVars from "../config/env";
import { prisma } from "../shared/prisma";

export const seedAdmin = async () => {
  try {
    const isAdminExist = await prisma.user.findFirst({
      where: {
        role: UserRole.ADMIN,
      },
    });

    if (isAdminExist) {
      console.log("Admin already exists!");
      return;
    }

    const hashedPassword = await bcrypt.hash(
      envVars.admin.ADMIN_PASSWORD as string,
      Number(envVars.bcrypt.SALT_ROUND)
    );

    const admin = await prisma.user.create({
      data: {
        email: envVars.admin.ADMIN_EMAIL as string,
        password: hashedPassword,
        name: "Admin",
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        isVerified: true,
      },
    });

    console.log("Admin created successfully!", admin);
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
};
