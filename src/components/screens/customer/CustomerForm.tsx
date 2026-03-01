"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { addCustomer, getCustomer, updateCustomer } from "@/services/customerService";
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Toast,
} from "@/components/ui";
import { CustomerAddRequest } from "@/types/request-types";
import { Customer } from "@/types/prisma-types";

const defaultValues: CustomerAddRequest = {
  customer_name: "",
  customer_phone: "",
  customer_email: "",
  customer_address: "",
};

const CustomerForm = () => {
  const router = useRouter();
  const params = useParams<{ id?: string }>();
  const customerId = params?.id ?? "new";
  const isEditing = customerId !== "new";

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentCustomerId, setCurrentCustomerId] = useState<Customer["customer_id"] | null>(null);

  const form = useForm<CustomerAddRequest>({
    defaultValues,
    mode: "onSubmit",
  });

  useEffect(() => {
    const loadCustomer = async () => {
      if (!isEditing) return;

      try {
        setIsLoading(true);
        const { data: customer } = await getCustomer({ customer_id: Number(customerId) });
        setCurrentCustomerId(customer.customer_id ?? null);
        form.reset({
          customer_name: customer.customer_name ?? "",
          customer_phone: customer.customer_phone ?? "",
          customer_email: customer.customer_email ?? "",
          customer_address: customer.customer_address ?? "",
        });
      } catch (error) {
        console.error("Failed to load customer", error);
        Toast.error("Unable to load customer details.");
        router.replace("/customers");
      } finally {
        setIsLoading(false);
      }
    };

    void loadCustomer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId, isEditing]);

  const handleSubmit = async (values: CustomerAddRequest) => {
    try {
      setIsSubmitting(true);
      const payload = currentCustomerId ? { ...values, customer_id: currentCustomerId } : values;
      const promise =
        isEditing && currentCustomerId ? updateCustomer(currentCustomerId, payload) : addCustomer(payload);
      Toast.promise(promise, {
        loading: "Saving customer…",
        success: "Customer saved successfully",
        error: "Failed to save customer",
      });
      await promise;
      router.replace("/customers");
    } catch (error) {
      console.error("Failed to submit customer form", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">{isEditing ? "Edit Customer" : "Add New Customer"}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading customer…
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="customer_name"
                rules={{ required: "Name is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Customer name" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customer_phone"
                rules={{
                  pattern: {
                    value: /^[0-9+\-() ]*$/,
                    message: "Enter a valid contact number",
                  },
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Number</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="0712345678" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customer_email"
                rules={{
                  pattern: {
                    value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                    message: "Enter a valid email address",
                  },
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="customer@example.com" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customer_address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Optional address" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <CardFooter className="px-0">
                <div className="flex w-full items-center justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => router.back()}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Customer
                  </Button>
                </div>
              </CardFooter>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
};

export default CustomerForm;
