"use client";

import Image from "next/image";
import { useContext, useEffect, useMemo, useState } from "react";
import { Pencil, ShieldCheck, Upload, Lock } from "lucide-react";

import UserContext, { UserCredentials } from "@/context/UserContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Toast } from "@/components/ui";
import { getImageUrl } from "@/services/imageHandler";
import { updateEmployeeImage } from "@/services/employeeService";
import VerifyUserDialog from "@/components/employee/VerifyUserDialog";
import UploadImageDialog from "@/components/employee/UploadImageDialog";
import ChangePasswordDialog from "@/components/employee/ChangePasswordDialog";

type EditableField = {
  key: keyof UserCredentials;
  label: string;
  editable?: boolean;
  placeholder?: string;
  type?: React.HTMLInputTypeAttribute;
};

const editableFields: EditableField[] = [
  {
    key: "employee_username",
    label: "Username",
    editable: true,
    placeholder: "User name",
  },
  {
    key: "employee_name",
    label: "Full Name",
    editable: true,
    placeholder: "Full name",
  },
  {
    key: "role_name",
    label: "User Role",
  },
  {
    key: "branch_name",
    label: "Branch",
  },
  {
    key: "employee_phone",
    label: "Telephone Number",
    editable: true,
    placeholder: "0712345678",
    type: "tel",
  },
];

const UserProfile = () => {
  const { currentUser, setCurrentUser } = useContext(UserContext);

  const [editedUser, setEditedUser] = useState<UserCredentials | null>(
    currentUser
  );
  const [isEditing, setIsEditing] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isVerifyDialogOpen, setIsVerifyDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

  useEffect(() => {
    setEditedUser(currentUser);
    setIsEditing(false);
    setIsVerified(false);
  }, [currentUser]);

  const profileImage = useMemo(() => {
    const image = editedUser?.employee_image;
    if (!image) return null;
    if (Array.isArray(image)) {
      return image.length > 0 ? getImageUrl(image[0]) : null;
    }
    return getImageUrl(image);
  }, [editedUser]);

  if (!currentUser || !editedUser) {
    return (
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle>User Profile</CardTitle>
          <CardDescription>
            We could not load your profile information at this time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Please try refreshing the page or signing in again.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleInputChange = (
    field: keyof UserCredentials,
    value: string | number | undefined
  ) => {
    setEditedUser((prev) =>
      prev
        ? {
            ...prev,
            [field]: value,
          }
        : prev
    );
  };

  const handleSave = () => {
    setIsEditing(false);
    setIsVerified(false);
    Toast.success("Profile changes saved locally");
  };

  const handleVerifySuccess = () => {
    setIsVerified(true);
    setIsEditing(true);
  };

  const handleImageUpload = async (file: File) => {
    if (!currentUser.employee_id) {
      Toast.error("Cannot upload image. Employee ID missing.");
      return;
    }

    try {
      const promise = updateEmployeeImage(currentUser.employee_id, file);
      Toast.promise(promise, {
        loading: "Uploading image…",
        success: "Profile image updated",
        error: "Failed to upload image",
      });
      const { data } = await promise;
      const filename = (data as { file?: { filename?: string } }).file
        ?.filename;
      if (filename) {
        setCurrentUser({
          ...currentUser,
          employee_image: filename,
        });
        setEditedUser((prev) =>
          prev ? { ...prev, employee_image: filename } : prev
        );
      }
    } catch (error) {
      console.error("Failed to upload image", error);
    }
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader className="flex flex-col gap-4 border-b border-border xl:flex-row xl:items-center xl:justify-between">
          <div className="space-y-2">
            <CardTitle className="text-xl font-semibold">
              User Profile
            </CardTitle>
            <CardDescription>
              View and manage your personal account information.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            {isEditing && (
              <Button onClick={handleSave}>
                <ShieldCheck className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={() =>
                isVerified
                  ? setIsEditing((prev) => !prev)
                  : setIsVerifyDialogOpen(true)
              }
            >
              <Pencil className="mr-2 h-4 w-4" />
              {isEditing ? "Stop Editing" : "Edit Details"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsUploadDialogOpen(true)}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload New Image
            </Button>
            <Button onClick={() => setIsPasswordDialogOpen(true)}>
              <Lock className="mr-2 h-4 w-4" />
              Change Password
            </Button>
          </div>
        </CardHeader>

        <CardContent className="grid gap-8 py-8 lg:grid-cols-[280px,1fr]">
          <div className="flex flex-col items-center gap-4">
            <div className="relative h-40 w-40 overflow-hidden rounded-full border">
              {profileImage ? (
                <Image
                  src={profileImage}
                  alt={editedUser.employee_name ?? "Profile picture"}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted">
                  <span className="text-2xl font-semibold text-muted-foreground">
                    {editedUser.employee_name?.charAt(0)?.toUpperCase() ?? "U"}
                  </span>
                </div>
              )}
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold">
                {editedUser.employee_name ?? "Unnamed User"}
              </p>
              {editedUser.role_name && (
                <Badge variant="secondary" className="mt-2">
                  {editedUser.role_name}
                </Badge>
              )}
            </div>
          </div>

          <div className="grid gap-6">
            {editableFields.map(
              ({ key, label, editable, placeholder, type }) => {
                const value = editedUser[key];
                const displayValue =
                  value === undefined || value === null || value === ""
                    ? "Not provided"
                    : value;

                return (
                  <div key={key} className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      {label}
                    </p>
                    {editable && isEditing ? (
                      <Input
                        value={String(value ?? "")}
                        onChange={(event) =>
                          handleInputChange(
                            key,
                            event.target.value as UserCredentials[typeof key]
                          )
                        }
                        placeholder={placeholder}
                        type={type}
                      />
                    ) : (
                      <p className="text-base font-medium">{displayValue}</p>
                    )}
                  </div>
                );
              }
            )}
          </div>
        </CardContent>
      </Card>

      <VerifyUserDialog
        open={isVerifyDialogOpen}
        onOpenChange={setIsVerifyDialogOpen}
        onVerified={() => handleVerifySuccess()}
      />
      <UploadImageDialog
        open={isUploadDialogOpen}
        onOpenChange={setIsUploadDialogOpen}
        onUpload={handleImageUpload}
      />
      <ChangePasswordDialog
        open={isPasswordDialogOpen}
        onOpenChange={setIsPasswordDialogOpen}
      />
    </>
  );
};

export default UserProfile;
