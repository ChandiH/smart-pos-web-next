"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { getUserRoles } from "@/services/authorizationService";
import { getAllBranches } from "@/services/branchService";
import { updateEmployee } from "@/services/employeeService";
import { getImageUrl } from "@/services/imageHandler";
import type { Branch, Employee, Identifier } from "@/services/types";
import { Toast } from "@/components/ui";

type EmployeeProfileState =
  | (Employee & {
      role_name?: string;
      branch_name?: string;
      employee_phone?: string;
      employee_image?: string;
    })
  | null;

type Option = {
  value: string;
  label: string;
};

const EmployeeProfile = () => {
  const router = useRouter();
  const [employee, setEmployee] = useState<EmployeeProfileState>(null);
  const [branches, setBranches] = useState<Option[]>([]);
  const [roles, setRoles] = useState<Option[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const storedEmployee =
      typeof window !== "undefined"
        ? window.sessionStorage.getItem("selectedEmployee")
        : null;

    if (!storedEmployee) {
      router.replace("/employee");
      return;
    }

    try {
      const parsedEmployee = JSON.parse(storedEmployee) as EmployeeProfileState;
      setEmployee(parsedEmployee);
    } catch (error) {
      console.error("Failed to parse stored employee", error);
      router.replace("/employee");
    }
  }, [router]);

  useEffect(() => {
    const loadLookups = async () => {
      try {
        const [{ data: branchData }, { data: roleData }] = await Promise.all([
          getAllBranches(),
          getUserRoles(),
        ]);

        const branchOptions: Option[] = Array.isArray(branchData)
          ? branchData.map((branch: Branch) => {
              const branchRecord = branch as Record<string, unknown>;
              const label =
                branch.branch_name ??
                (branchRecord.branch_city as string | undefined) ??
                "Unnamed Branch";
              return {
                value: String(branch.branch_id ?? ""),
                label,
              };
            })
          : [];

        const roleOptions: Option[] = Array.isArray(roleData)
          ? roleData.map((role: Record<string, unknown>) => ({
              value: String(role.role_id ?? ""),
              label: String(role.role_name ?? "Unnamed Role"),
            }))
          : [];

        setBranches(branchOptions);
        setRoles(roleOptions);
      } catch (error) {
        console.error("Failed to load employee profile data", error);
        Toast.error("Unable to load profile data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadLookups();
  }, []);

  const branchLabel = useMemo(() => {
    if (!employee?.branch_id) return employee?.branch_name ?? "Not assigned";
    const option = branches.find(
      (branch) => branch.value === String(employee.branch_id)
    );
    return option?.label ?? employee.branch_name ?? "Not assigned";
  }, [branches, employee]);

  const roleLabel = useMemo(() => {
    if (!employee?.role_id) return employee?.role_name ?? "Not assigned";
    const option = roles.find(
      (role) => role.value === String(employee.role_id)
    );
    return option?.label ?? employee.role_name ?? "Not assigned";
  }, [roles, employee]);

  const handleSave = async () => {
    if (!employee?.employee_id) {
      Toast.error("Employee details unavailable.");
      return;
    }

    if (!selectedBranch && !selectedRole) {
      Toast.message("No changes to save.");
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        employee_name: employee.employee_name,
        employee_email: employee.employee_email,
        employee_phone:
          employee.employee_phone ??
          (employee.employee_contact as string | undefined) ??
          "",
        role_id: selectedRole
          ? selectedRole
          : (employee.role_id as Identifier),
        branch_id: selectedBranch
          ? selectedBranch
          : (employee.branch_id as Identifier),
      };

      await updateEmployee(employee.employee_id, payload);

      const updatedEmployee: EmployeeProfileState = {
        ...employee,
        role_id: payload.role_id,
        branch_id: payload.branch_id,
      };

      const updatedRole = roles.find((role) => role.value === selectedRole);
      const updatedBranch = branches.find(
        (branch) => branch.value === selectedBranch
      );

      if (updatedRole) {
        updatedEmployee.role_name = updatedRole.label;
      }
      if (updatedBranch) {
        updatedEmployee.branch_name = updatedBranch.label;
      }

      setEmployee(updatedEmployee);
      setSelectedBranch("");
      setSelectedRole("");

      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(
          "selectedEmployee",
          JSON.stringify(updatedEmployee)
        );
      }

      Toast.success("Employee details updated");
    } catch (error) {
      console.error("Failed to update employee", error);
      Toast.error("Unable to update employee. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!employee) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading employee…
      </div>
    );
  }

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">
          Employee Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          <div className="flex flex-col items-center gap-4">
            <div className="relative h-64 w-64 overflow-hidden rounded-xl border">
              <Image
                src={
                  employee.employee_image
                    ? getImageUrl(employee.employee_image)
                    : "https://placehold.co/400x400/png"
                }
                alt={employee.employee_name ?? "Employee"}
                fill
                className="object-cover"
                unoptimized
                sizes="256px"
              />
            </div>
            <div className="space-y-1 text-center">
              <p className="text-lg font-semibold">
                {employee.employee_name ?? "Unnamed Employee"}
              </p>
              <p className="text-sm text-muted-foreground">{roleLabel}</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <Label className="text-xs uppercase text-muted-foreground">
                Branch
              </Label>
              <p className="text-base font-medium">{branchLabel}</p>
            </div>
            <Separator />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs uppercase text-muted-foreground">
                  Email
                </Label>
                <p>{employee.employee_email ?? "Not available"}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs uppercase text-muted-foreground">
                  Contact
                </Label>
                <p>
                  {employee.employee_phone ??
                    (employee.employee_contact as string | undefined) ??
                    "Not available"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Assign New Branch</Label>
              <Select
                value={selectedBranch}
                onValueChange={setSelectedBranch}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {branches.map((branch) => (
                      <SelectItem key={branch.value} value={branch.value}>
                        {branch.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Change User Role</Label>
              <Select
                value={selectedRole}
                onValueChange={setSelectedRole}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {roles.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <Button variant="outline" onClick={() => router.back()}>
              Back
            </Button>
            <Button
              onClick={handleSave}
              disabled={
                isSaving || (!selectedBranch && !selectedRole) || isLoading
              }
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmployeeProfile;
