"use client";

import { useState } from "react";
import { isAxiosError } from "axios";

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
import { resetPassword } from "@/services/authenticationService";

type ChangePasswordDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultUsername?: string;
};

const ChangePasswordDialog = ({
  open,
  onOpenChange,
  defaultUsername = "",
}: ChangePasswordDialogProps) => {
  const [formData, setFormData] = useState({
    username: defaultUsername,
    password: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    field: keyof typeof formData
  ) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const resetState = () => {
    setFormData({
      username: defaultUsername,
      password: "",
      newPassword: "",
      confirmNewPassword: "",
    });
    setErrors({});
    setIsSubmitting(false);
  };

  const handleSubmit = async () => {
    if (!formData.username || !formData.password) {
      setErrors((prev) => ({
        ...prev,
        username: formData.username ? "" : "Username is required",
        password: formData.password ? "" : "Current password is required",
      }));
      return;
    }

    if (!formData.newPassword || !formData.confirmNewPassword) {
      setErrors((prev) => ({
        ...prev,
        newPassword: formData.newPassword ? "" : "New password is required",
        confirmNewPassword: formData.confirmNewPassword
          ? ""
          : "Confirm new password",
      }));
      return;
    }

    if (formData.newPassword !== formData.confirmNewPassword) {
      setErrors((prev) => ({
        ...prev,
        confirmNewPassword: "Passwords do not match",
      }));
      return;
    }

    if (formData.newPassword.length < 6) {
      setErrors((prev) => ({
        ...prev,
        newPassword: "New password must be at least 6 characters long",
      }));
      return;
    }

    // check if new password has atleast one letter
    if (!/[A-Za-z]/.test(formData.newPassword)) {
      setErrors((prev) => ({
        ...prev,
        newPassword: "New password must contain at least one letter",
      }));
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await resetPassword(
        formData.username,
        formData.password,
        formData.newPassword
      );
      console.log("Password change response:", response);
      Toast.success("Password changed successfully");
      onOpenChange(false);
      resetState();
    } catch (error) {
      console.error("Failed to change password", error);
      let message = "Unable to change password.";
      if (isAxiosError(error)) {
        const data = error.response?.data as Record<string, unknown> | undefined;
        if (typeof data?.error === "string") {
          message = data.error;
        }
      }
      Toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetState();
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
          <DialogDescription>
            Update your account password. You will use the new password the next time you sign in.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="password-username"
              className="text-sm font-medium text-muted-foreground"
            >
              Username
            </label>
            <Input
              id="password-username"
              value={formData.username}
              onChange={(event) => handleChange(event, "username")}
              autoComplete="username"
              placeholder="Enter your username"
            />
            {errors.username && (
              <p className="text-xs text-destructive">{errors.username}</p>
            )}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="password-current"
              className="text-sm font-medium text-muted-foreground"
            >
              Current Password
            </label>
            <Input
              id="password-current"
              type="password"
              value={formData.password}
              onChange={(event) => handleChange(event, "password")}
              autoComplete="current-password"
              placeholder="Enter your current password"
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password}</p>
            )}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="password-new"
              className="text-sm font-medium text-muted-foreground"
            >
              New Password
            </label>
            <Input
              id="password-new"
              type="password"
              value={formData.newPassword}
              onChange={(event) => handleChange(event, "newPassword")}
              autoComplete="new-password"
              placeholder="Enter your new password"
            />
            {errors.newPassword && (
              <p className="text-xs text-destructive">{errors.newPassword}</p>
            )}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="password-confirm"
              className="text-sm font-medium text-muted-foreground"
            >
              Confirm New Password
            </label>
            <Input
              id="password-confirm"
              type="password"
              value={formData.confirmNewPassword}
              onChange={(event) => handleChange(event, "confirmNewPassword")}
              placeholder="Confirm your new password"
            />
            {errors.confirmNewPassword && (
              <p className="text-xs text-destructive">
                {errors.confirmNewPassword}
              </p>
            )}
          </div>
        </div>
        <DialogFooter className="pt-4">
          <Button variant="outline" onClick={() => handleClose(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Changing…" : "Change Password"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ChangePasswordDialog;
