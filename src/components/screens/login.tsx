"use client";
import React, { useEffect, useState } from "react";

import { authenticate, decodeJWT } from "@/services/authenticationService";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import {
  Button,
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  Input,
  Spinner,
} from "../ui";
import { cn } from "@/lib/utils";
import { GalleryVerticalEnd } from "lucide-react";

type LoginForm = {
  username: string;
  password: string;
  error: string;
};

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { setCurrentUser } = useUser();
  const [state, setState] = useState<LoginForm>({
    username: "",
    password: "",
    error: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setCurrentUser(decodeJWT(token));
    const lastVisitedPage = sessionStorage.getItem("lastVisitedPage");
    console.log(lastVisitedPage);

    if (lastVisitedPage) return router.replace(lastVisitedPage);
    router.replace("/dashboard");
  }, [router, setCurrentUser]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { data: response } = await authenticate(state);
      localStorage.setItem("token", response.token);
      if (response.error) throw new Error(response.data.error);
      setState((prevState) => ({
        ...prevState,
        setUser: decodeJWT(response.token),
      }));
      router.replace("/dashboard");
    } catch (err) {
      console.log("Error Occured", err);
      setState((prevState) => ({ ...prevState, error: "Invalid Credentials" }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <a
              href="#"
              className="flex flex-col items-center gap-2 font-medium"
            >
              <div className="flex size-8 items-center justify-center rounded-md">
                <GalleryVerticalEnd className="size-6" />
              </div>
              <span className="sr-only">Acme Inc.</span>
            </a>
            <h1 className="text-xl font-bold">Welcome to Acme Inc.</h1>
            <FieldDescription>
              Don&apos;t have an account? <a href="#">Sign up</a>
            </FieldDescription>
          </div>
          <Field>
            <FieldLabel htmlFor="username">Username</FieldLabel>
            <Input
              id="username"
              type="username"
              placeholder="username"
              value={state.username}
              onChange={(e) =>
                setState((prev) => ({ ...prev, username: e.target.value }))
              }
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              id="password"
              type="password"
              placeholder="********"
              value={state.password}
              onChange={(e) =>
                setState((prev) => ({ ...prev, password: e.target.value }))
              }
              required
            />
          </Field>
          {state.error && (
            <FieldDescription className="text-red-500">
              {state.error}
            </FieldDescription>
          )}
          <Field>
            <Button type="submit">{loading && <Spinner />}Login</Button>
          </Field>
        </FieldGroup>
      </form>
      <FieldDescription className="px-6 text-center">
        Don&apos;t have an account?{" "}
        <span className="underline">Contact Admin Support</span>
      </FieldDescription>
    </div>
  );
}

export default LoginForm;
