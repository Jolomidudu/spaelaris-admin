import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Spa Elaris | Premium Wellness Oasis",
  description: "Spa & Massage",
};

export default function SignIn() {
  return <SignInForm />;
}
