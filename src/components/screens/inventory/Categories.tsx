"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { addCategory, getCategory } from "@/services/categoryService";
import type { Category, Identifier } from "@/services/types";
import { Toast } from "@/components/ui";

type CategoryFormValues = {
  category_name: string;
};

const defaultValues: CategoryFormValues = {
  category_name: "",
};

const Categories = () => {
  const router = useRouter();
  const params = useParams<{ id?: string }>();
  const categoryId = params?.id ?? "new";
  const isEditing = categoryId !== "new";

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CategoryFormValues>({
    defaultValues,
    mode: "onSubmit",
  });

  useEffect(() => {
    const loadCategory = async () => {
      if (!isEditing) {
        form.reset(defaultValues);
        return;
      }

      try {
        setIsLoading(true);
        const { data } = await getCategory({ category_id: Number(categoryId) });
        const category = data as Category;
        form.reset({
          category_name: category.category_name ?? "",
        });
      } catch (error) {
        console.error("Failed to load category", error);
        Toast.error("Unable to load category.");
        router.replace("/inventory/categories");
      } finally {
        setIsLoading(false);
      }
    };

    void loadCategory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, isEditing]);

  const handleSubmit = async (values: CategoryFormValues) => {
    try {
      setIsSubmitting(true);
      const promise = addCategory({ category_name: values.category_name.trim() });
      Toast.promise(promise, {
        loading: "Saving category…",
        success: "Category saved successfully",
        error: "Failed to save category",
      });
      await promise;
      router.back();
    } catch (error) {
      console.error("Failed to submit category form", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-xl">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">{isEditing ? "Edit Category" : "Add New Category"}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading category…
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="category_name"
                rules={{ required: "Category name is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Category name" {...field} />
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
                    Save Category
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

export default Categories;
