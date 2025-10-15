"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";

import AccessFrame from "@/components/accessFrame";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAllBranches } from "@/services/branchService";
import { getEmployee, updateEmployee } from "@/services/employeeService";
import { getUserRoles } from "@/services/authorizationService";
import { registerEmployee } from "@/services/authenticationService";
import type { Branch, Employee, Identifier } from "@/services/types";
import { Toast } from "@/components/ui";

type EmployeeFormValues = {
  employee_name: string;
  employee_userName: string;
  employee_email: string;
  employee_phone: string;
  role_id: string;
  branch_id: string;
};

type Option = {
  label: string;
  value: string;
};

const defaultValues: EmployeeFormValues = {
  employee_name: "",
  employee_userName: "",
  employee_email: "",
  employee_phone: "",
  role_id: "",
  branch_id: "",
};

const EmployeeForm = () => {
  const router = useRouter();
  const params = useParams<{ id?: string }>();
  const employeeId = params?.id ?? "new";
  const isEditing = employeeId !== "new";

  const [branches, setBranches] = useState<Option[]>([]);
  const [userRoles, setUserRoles] = useState<Option[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<EmployeeFormValues>({
    defaultValues,
    mode: "onSubmit",
  });

  useEffect(() => {
    const loadLookups = async () => {
      try {
        setIsLoading(true);
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

        setBranches(branchOptions.filter((option) => option.value !== ""));
        setUserRoles(roleOptions.filter((option) => option.value !== ""));

        if (isEditing) {
          const { data } = await getEmployee(employeeId as Identifier);
          const employee = data as Employee;

          form.reset({
            employee_name: employee.employee_name ?? "",
            employee_userName:
              (employee as Record<string, string>).employee_userName ?? "",
            employee_email: employee.employee_email ?? "",
            employee_phone:
              (employee as Record<string, string>).employee_phone ??
              (employee.employee_contact as string) ??
              "",
            role_id: employee.role_id ? String(employee.role_id) : "",
            branch_id: employee.branch_id ? String(employee.branch_id) : "",
          });
        } else {
          form.reset(defaultValues);
        }
      } catch (error) {
        console.error("Failed to load form data", error);
        Toast.error("Unable to load form data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadLookups();
  }, [employeeId, form, isEditing]);

  const watchedValues = form.watch();
  const isSubmitDisabled =
    !watchedValues.employee_name ||
    !watchedValues.employee_userName ||
    !watchedValues.employee_email ||
    !watchedValues.employee_phone ||
    !watchedValues.role_id ||
    !watchedValues.branch_id ||
    isSubmitting;

  const handleSubmit = async (values: EmployeeFormValues) => {
    try {
      setIsSubmitting(true);
      if (isEditing) {
        await updateEmployee(employeeId as Identifier, {
          employee_name: values.employee_name,
          employee_email: values.employee_email,
          employee_phone: values.employee_phone,
          role_id: Number(values.role_id),
          branch_id: Number(values.branch_id),
        });
        Toast.success("Employee updated");
      } else {
        await registerEmployee({
          employee_name: values.employee_name,
          employee_userName: values.employee_userName,
          employee_email: values.employee_email,
          employee_phone: values.employee_phone,
          role_id: Number(values.role_id),
          branch_id: Number(values.branch_id),
          employee_image: "",
        });
        Toast.success("Employee added");
      }
      router.back();
    } catch (error: unknown) {
      console.error("Failed to submit employee form", error);
      const message =
        (error as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? "Something went wrong. Please try again.";
      Toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AccessFrame accessLevel="addEmployee" onDenied={() => router.back()}>
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            {isEditing ? "Edit Employee" : "Add New Employee"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading form data…
            </div>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="employee_name"
                  rules={{ required: "Name is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Jane Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="employee_userName"
                  rules={{ required: "Username is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="jane.doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="employee_email"
                    rules={{
                      required: "Email is required",
                      pattern: {
                        value:
                          /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                        message: "Enter a valid email address",
                      },
                    }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="jane.doe@example.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="employee_phone"
                    rules={{
                      required: "Contact number is required",
                      minLength: {
                        value: 7,
                        message: "Contact number is too short",
                      },
                    }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact</FormLabel>
                        <FormControl>
                          <Input
                            type="tel"
                            placeholder="0712345678"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="branch_id"
                    rules={{ required: "Branch is required" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Branch</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a branch" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                {branches.map((option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="role_id"
                    rules={{ required: "User role is required" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>User Role</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                {userRoles.map((option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <CardFooter className="px-0">
                  <div className="flex w-full items-center justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.back()}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitDisabled}>
                      {isSubmitting && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {isEditing ? "Save Changes" : "Create Employee"}
                    </Button>
                  </div>
                </CardFooter>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </AccessFrame>
  );
};

export default EmployeeForm;
