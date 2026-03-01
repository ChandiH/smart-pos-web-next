"use client";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toast } from "@/components/ui";
import { authenticate } from "@/services/authenticationService";
type VerifyUserDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerified: (token?: string) => void;
  defaultUsername?: string;
};
const VerifyUserDialog = ({
  open,
  onOpenChange,
  onVerified,
  defaultUsername = "",
}: VerifyUserDialogProps) => {
  const [username, setUsername] = useState(defaultUsername);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const handleVerify = async () => {
    if (!username || !password) {
      setError("Username and password are required.");
      return;
    }
    try {
      setIsVerifying(true);
      setError(null);
      const { data } = await authenticate({ username, password });
      onVerified((data as { token?: string })?.token);
      Toast.success("Verification successful");
      onOpenChange(false);
    } catch (err) {
      const message =
        (err as { response?: { data?: { error?: string } } }).response?.data
          ?.error ?? "Unable to verify user.";
      setError(message);
    } finally {
      setIsVerifying(false);
    }
  };
  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      setUsername(defaultUsername);
      setPassword("");
      setError(null);
    }
    onOpenChange(nextOpen);
  };
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Verify User</DialogTitle>
          <DialogDescription>
            Re-enter your credentials to edit sensitive profile information.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {error && (
            <p className="rounded-md border border-destructive/60 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="space-y-2">
            <label
              htmlFor="verify-username"
              className="text-sm font-medium text-muted-foreground"
            >
              Username
            </label>
            <Input
              id="verify-username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Enter your username"
              autoComplete="username"
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="verify-password"
              className="text-sm font-medium text-muted-foreground"
            >
              Password
            </label>
            <Input
              id="verify-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={handleVerify}
            disabled={isVerifying}
            className="ml-auto"
          >
            {isVerifying ? "Verifying…" : "Verify"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
export default VerifyUserDialog;
