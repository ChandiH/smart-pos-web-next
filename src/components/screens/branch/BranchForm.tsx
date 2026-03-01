"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";

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
import { Toast } from "@/components/ui";
import { addBranch } from "@/services/branchService";

type BranchFormValues = {
  branch_address: string;
  branch_city: string;
  branch_email: string;
  branch_phone: string;
};

const defaultValues: BranchFormValues = {
  branch_address: "",
  branch_city: "",
  branch_email: "",
  branch_phone: "",
};

const BranchForm = () => {
  const router = useRouter();
  const form = useForm<BranchFormValues>({
    defaultValues,
    mode: "onSubmit",
  });

  const handleSubmit = async (values: BranchFormValues) => {
    try {
      const promise = addBranch(values);
      Toast.promise(promise, {
        loading: "Saving branch…",
        success: "Branch saved successfully",
        error: "Failed to save branch",
      });
      await promise;
      router.back();
    } catch (error) {
      console.error("Failed to submit branch form", error);
    }
  };

  const isSubmitting = form.formState.isSubmitting;

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Add New Branch</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            <FormField
              control={form.control}
              name="branch_address"
              rules={{ required: "Address is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder="Branch address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="branch_city"
              rules={{ required: "City is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input placeholder="Branch city" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="branch_email"
              rules={{
                required: "Email is required",
                pattern: {
                  value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                  message: "Enter a valid email address",
                },
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="branch@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="branch_phone"
              rules={{
                required: "Contact number is required",
                pattern: {
                  value: /^[0-9+\-() ]*$/,
                  message: "Enter a valid contact number",
                },
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Number</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="0712345678" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <CardFooter className="px-0">
              <div className="flex w-full items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Branch
                </Button>
              </div>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default BranchForm;
