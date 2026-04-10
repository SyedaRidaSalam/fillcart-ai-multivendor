import prisma from "@/lib/prisma";

const authSeller = async (userId) => {
  if (!userId) return false;

  const store = await prisma.store.findUnique({
    where: { userId },
  });

  // ✅ ONLY APPROVED + ACTIVE SELLER
  if (!store) return false;

  if (store.status !== "approved" || !store.isActive) {
    return false;
  }

  return true;
};

export default authSeller;