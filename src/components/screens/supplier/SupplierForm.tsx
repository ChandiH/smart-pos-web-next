"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
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
import { addSupplier, getSupplier, updateSupplier } from "@/services/supplierService";
import { Supplier } from "@/types/prisma-types";
import { SupplierAddRequest } from "@/types/request-types";

const defaultValues: SupplierAddRequest = {
  supplier_name: "",
  supplier_email: "",
  supplier_phone: "",
  supplier_address: "",
};

const SupplierForm = () => {
  const router = useRouter();
  const params = useParams<{ id?: string }>();
  const supplierId = params?.id ?? "new";
  const isEditing = supplierId !== "new";

  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentSupplierId, setCurrentSupplierId] = useState<Supplier["supplier_id"] | null>(null);

  const form = useForm<SupplierAddRequest>({
    defaultValues,
    mode: "onSubmit",
  });

  useEffect(() => {
    const loadSupplier = async () => {
      if (!isEditing) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const { data: supplier } = await getSupplier({ supplier_id: supplierId });
        setCurrentSupplierId(supplier.supplier_id ?? null);
        form.reset({
          supplier_name: supplier.supplier_name ?? "",
          supplier_email: supplier.supplier_email ?? "",
          supplier_phone: supplier.supplier_phone ?? "",
          supplier_address: supplier.supplier_address ?? "",
        });
      } catch (error) {
        console.error("Failed to load supplier", error);
        Toast.error("Unable to load supplier details.");
        router.replace("/suppliers");
      } finally {
        setIsLoading(false);
      }
    };

    void loadSupplier();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supplierId, isEditing]);

  const handleSubmit = async (values: SupplierAddRequest) => {
    try {
      setIsSubmitting(true);
      const payload = currentSupplierId ? { ...values, supplier_id: currentSupplierId } : values;
      const promise =
        isEditing && currentSupplierId ? updateSupplier(currentSupplierId, payload) : addSupplier(payload);
      Toast.promise(promise, {
        loading: isEditing ? "Updating supplier…" : "Saving supplier…",
        success: "Supplier saved successfully",
        error: "Failed to save supplier",
      });
      await promise;
      router.replace("/suppliers");
    } catch (error) {
      console.error("Failed to submit supplier form", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">{isEditing ? "Edit Supplier" : "Add New Supplier"}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading supplier…
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="supplier_name"
                rules={{ required: "Name is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Supplier name" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="supplier_email"
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
                      <Input type="email" placeholder="supplier@example.com" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="supplier_phone"
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
                      <Input type="tel" placeholder="0712345678" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="supplier_address"
                rules={{ required: "Address is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Supplier address" {...field} value={field.value ?? ""} />
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
                    Save Supplier
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

export default SupplierForm;
