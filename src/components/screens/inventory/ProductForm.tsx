"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getCategories } from "@/services/categoryService";
import { getSuppliers } from "@/services/supplierService";
import { getProduct, saveProduct } from "@/services/productService";
import type { Category, Identifier, Product, Supplier } from "@/services/types";
import { Toast } from "@/components/ui";

type Option = {
  value: string;
  label: string;
};

type ProductFormValues = {
  product_name: string;
  product_desc: string;
  category_id: string;
  buying_price: string;
  retail_price: string;
  discount: string;
  product_barcode: string;
  supplier_id: string;
};

const defaultValues: ProductFormValues = {
  product_name: "",
  product_desc: "",
  category_id: "",
  buying_price: "",
  retail_price: "",
  discount: "",
  product_barcode: "",
  supplier_id: "",
};

const ProductForm = () => {
  const router = useRouter();
  const params = useParams<{ id?: string }>();
  const productId = params?.id ?? "new";
  const isEditing = productId !== "new";

  const [categories, setCategories] = useState<Option[]>([]);
  const [suppliers, setSuppliers] = useState<Option[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProductFormValues>({
    defaultValues,
    mode: "onSubmit",
  });

  const loadMetadata = async () => {
    try {
      setIsLoading(true);
      const [{ data: categoryData }, { data: supplierData }] =
        await Promise.all([getCategories(), getSuppliers()]);

      const categoryOptions: Option[] = Array.isArray(categoryData)
        ? (categoryData as Category[]).map((category) => ({
            value: String(category.category_id ?? ""),
            label: category.category_name ?? "Category",
          }))
        : [];

      const supplierOptions: Option[] = Array.isArray(supplierData)
        ? (supplierData as Supplier[]).map((supplier) => ({
            value: String(supplier.supplier_id ?? ""),
            label: supplier.supplier_name ?? "Supplier",
          }))
        : [];

      setCategories(categoryOptions);
      setSuppliers(supplierOptions);
    } catch (error) {
      console.error("Failed to load metadata", error);
      Toast.error("Unable to load categories or suppliers.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadMetadata();
  }, []);

  useEffect(() => {
    const loadProduct = async () => {
      if (!isEditing) {
        form.reset(defaultValues);
        return;
      }

      try {
        setIsLoading(true);
        const { data } = await getProduct(productId as Identifier);
        const product = data as Product;
        form.reset({
          product_name: product.product_name ?? "",
          product_desc: product.product_desc ?? "",
          category_id: product.category_id ? String(product.category_id) : "",
          buying_price: product.buying_price
            ? String(product.buying_price)
            : "",
          retail_price: product.retail_price
            ? String(product.retail_price)
            : "",
          discount: product.discount ? String(product.discount) : "",
          product_barcode: product.product_barcode ?? "",
          supplier_id: product.supplier_id ? String(product.supplier_id) : "",
        });
      } catch (error) {
        console.error("Failed to load product", error);
        Toast.error("Unable to load product.");
        router.replace("/inventory/catalog");
      } finally {
        setIsLoading(false);
      }
    };

    void loadProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, isEditing]);

  const handleFilesChange = (targetFiles: FileList | null) => {
    if (!targetFiles) {
      setFiles([]);
      return;
    }
    setFiles(Array.from(targetFiles));
  };

  const handleSubmit = async (values: ProductFormValues) => {
    try {
      setIsSubmitting(true);
      const payload = {
        product_name: values.product_name,
        product_desc: values.product_desc,
        category_id: values.category_id,
        buying_price: Number(values.buying_price || 0),
        retail_price: Number(values.retail_price || 0),
        discount: Number(values.discount || 0),
        product_barcode: values.product_barcode,
        supplier_id: values.supplier_id,
      };

      const promise = saveProduct(payload, files);
      Toast.promise(promise, {
        loading: "Saving product…",
        success: () => "Product saved successfully",
        error: (error) =>
          error.response?.data?.error ?? "Failed to save product",
      });
      await promise;
      router.replace("/inventory/catalog");
    } catch (error) {
      console.error("Product save failed", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedFilesLabel = useMemo(() => {
    if (files.length === 0) return "No images selected";
    if (files.length === 1) return files[0].name;
    return `${files.length} files selected`;
  }, [files]);

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">
          {isEditing ? "Edit Product" : "Add New Product"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading product…
          </div>
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-6"
            >
              <FormField
                control={form.control}
                name="product_name"
                rules={{ required: "Product name is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Product name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="product_desc"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Optional description"
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="category_id"
                  rules={{ required: "Category is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              {categories.map((option) => (
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
                  name="supplier_id"
                  rules={{ required: "Supplier is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select supplier" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              {suppliers.map((option) => (
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

              <div className="grid gap-6 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="buying_price"
                  rules={{ required: "Buying price is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Buying Price</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="retail_price"
                  rules={{ required: "Retail price is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Retail Price</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="discount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discount</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="product_barcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Barcode</FormLabel>
                    <FormControl>
                      <Input placeholder="Optional barcode" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <FormLabel>Product Images</FormLabel>
                <div className="flex flex-col gap-2">
                  <Input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(event) => handleFilesChange(event.target.files)}
                  />
                  <p className="text-sm text-muted-foreground">
                    {selectedFilesLabel}
                  </p>
                </div>
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
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Save Product
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

export default ProductForm;
