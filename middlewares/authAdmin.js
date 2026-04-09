import { auth, currentUser } from "@clerk/nextjs/server";

const authAdmin = async (userId) => {
  try {
    if (!userId) return false;

    // ✅ use currentUser instead of clerkClient
    const user = await currentUser();

    if (!user) return false;

    const allUserEmails = user.emailAddresses.map((e) =>
      e.emailAddress.toLowerCase().trim()
    );

    const adminEmails =
      process.env.ADMIN_EMAIL
        ?.split(",")
        .map((email) => email.toLowerCase().trim()) || [];

    console.log("USER EMAILS:", allUserEmails);
    console.log("ADMIN EMAILS:", adminEmails);

    return adminEmails.some((email) => allUserEmails.includes(email));
  } catch (error) {
    console.error("Error occurred while checking admin status:", error);
    return false;
  }
};

export default authAdmin;