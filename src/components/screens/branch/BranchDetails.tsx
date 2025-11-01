"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Toast } from "@/components/ui";
import { getBranch } from "@/services/branchService";
import { getEmployeeByBranch } from "@/services/employeeService";
import { getImageUrl } from "@/services/imageHandler";
import type { Branch, Employee, Identifier } from "@/services/types";

type BranchRecord = Branch & {
  branch_city?: string;
  branch_name?: string;
  branch_email?: string;
  branch_phone?: string | number;
  branch_address?: string;
};

type BranchEmployee = Employee & {
  role_name?: string;
  employee_image?: string | string[];
  hired_date?: string;
};

const BranchDetails = () => {
  const router = useRouter();
  const params = useParams<{ id?: string }>();
  const branchId = params?.id;

  const [branch, setBranch] = useState<BranchRecord | null>(null);
  const [employees, setEmployees] = useState<BranchEmployee[]>([]);
  const [isLoadingBranch, setIsLoadingBranch] = useState(true);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);

  useEffect(() => {
    if (!branchId || branchId === "new") {
      router.replace("/branch");
      return;
    }

    const fetchDetails = async () => {
      try {
        setIsLoadingBranch(true);
        setIsLoadingEmployees(true);

        const { data: branchResponse } = await getBranch({ branch_id: branchId });
        const branchData = Array.isArray(branchResponse)
          ? (branchResponse[0] as BranchRecord | undefined)
          : (branchResponse as BranchRecord | undefined);

        if (!branchData) {
          Toast.error("Branch not found.");
          router.replace("/branch");
          return;
        }

        setBranch(branchData);

        const { data: employeeResponse } = await getEmployeeByBranch(branchId as Identifier);
        const employeeList = Array.isArray(employeeResponse) ? (employeeResponse as BranchEmployee[]) : [];
        setEmployees(employeeList);
      } catch (error) {
        console.error("Failed to load branch details", error);
        Toast.error("Unable to load branch details. Please try again.");
        router.replace("/branch");
      } finally {
        setIsLoadingBranch(false);
        setIsLoadingEmployees(false);
      }
    };

    void fetchDetails();
  }, [branchId, router]);

  const branchTitle = useMemo(() => {
    if (!branch) return "Branch Profile";
    return `${branch.branch_city ?? branch.branch_name ?? "Branch"} Profile`;
  }, [branch]);

  if (isLoadingBranch) {
    return (
      <div className="flex items-center justify-center py-32 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading branch…
      </div>
    );
  }

  if (!branch) {
    return null;
  }

  const getBranchField = (...keys: (keyof BranchRecord | string)[]) => {
    for (const key of keys) {
      const value = (branch as Record<string, unknown>)[key];
      if (value !== undefined && value !== null && value !== "") {
        return value;
      }
    }
    return undefined;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-3 border-b border-border md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">{branchTitle}</CardTitle>
            <p className="text-sm text-muted-foreground">Review core details for this branch.</p>
          </div>
          <Button variant="outline" onClick={() => router.back()}>
            Go Back
          </Button>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="text-base font-medium">{String(getBranchField("branch_email", "email") ?? "Not provided")}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Contact</p>
            <p className="text-base font-medium">
              {String(getBranchField("branch_phone", "contact_number") ?? "Not provided")}
            </p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-muted-foreground">Address</p>
            <p className="text-base font-medium">
              {String(getBranchField("branch_address", "address") ?? "Not provided")}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Branch ID</p>
            <p className="text-base font-medium">{String(getBranchField("branch_id", "id") ?? "Not available")}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 border-b border-border md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Employees ({employees.length})</CardTitle>
            <p className="text-sm text-muted-foreground">Team members assigned to this branch.</p>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingEmployees ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading employees…
            </div>
          ) : employees.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {employees.map((employee, index) => {
                const imageSource = Array.isArray(employee.employee_image)
                  ? employee.employee_image[0]
                  : typeof employee.employee_image === "string"
                  ? employee.employee_image
                  : undefined;
                const imageUrl = imageSource ? getImageUrl(imageSource) : "https://placehold.co/160x160/png";
                const hiredDate = employee.hired_date ? new Date(employee.hired_date).toISOString().slice(0, 10) : "—";

                return (
                  <div
                    key={String(employee.employee_id ?? index)}
                    className="flex items-center gap-4 rounded-lg border border-border bg-background p-4 shadow-sm"
                  >
                    <div className="relative h-16 w-16 overflow-hidden rounded-md border">
                      <Image
                        src={imageUrl}
                        alt={employee.employee_name ?? "Employee"}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-base font-semibold">{employee.employee_name ?? "Employee"}</p>
                      <p className="text-sm text-muted-foreground">{employee.role_name ?? "Role not specified"}</p>
                      <p className="text-xs text-muted-foreground">Hired on: {hiredDate}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="py-12 text-center text-muted-foreground">No employees found for this branch.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BranchDetails;
