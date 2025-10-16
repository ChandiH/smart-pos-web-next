"use client";

import { useContext, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2, QrCode } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getCategories } from "@/services/categoryService";
import { getSuppliers } from "@/services/supplierService";
import { getAllBranches } from "@/services/branchService";
import { getMobileAppQrURL } from "@/services/imageHandler";
import {
  updateRewardsPointsPercentage,
  getRewardsPointsPercentage,
} from "@/services/orderService";
import UserContext from "@/context/UserContext";
import { Toast } from "../ui";
import {
  Branch,
  Category,
  RewardsPointsSetting,
  Supplier,
} from "@/services/types";

type EntityType = "branches" | "categories" | "suppliers";

type ListItem = {
  id: string;
  name: string;
  action?: () => void;
};

type RewardSetting = RewardsPointsSetting & {
  variable_value: number;
};

const MAX_REWARD_PERCENTAGE = 100;

const ConfigScreen = () => {
  const router = useRouter();
  const { currentUser } = useContext(UserContext);

  const [activeEntity, setActiveEntity] = useState<EntityType | null>(null);
  const [items, setItems] = useState<ListItem[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRewardsLoading, setIsRewardsLoading] = useState(false);
  const [rewardPercentage, setRewardPercentage] = useState<number>(0);
  const [rewardDraft, setRewardDraft] = useState<number | "">(0);
  const [isSavingRewards, setIsSavingRewards] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const filteredItems = useMemo(() => {
    if (!query) return items;
    return items.filter((item) =>
      item.name.toLowerCase().includes(query.toLowerCase())
    );
  }, [items, query]);

  const loadRewards = async () => {
    try {
      setIsRewardsLoading(true);
      const { data } = await getRewardsPointsPercentage();
      const settings = Array.isArray(data) ? (data as RewardSetting[]) : [];
      const percentage = Number(settings[0]?.variable_value ?? 0);
      setRewardPercentage(percentage);
      setRewardDraft(percentage);
    } catch (error) {
      console.error("Failed to load reward percentage", error);
      Toast.error("Unable to load loyalty settings. Please try again.");
    } finally {
      setIsRewardsLoading(false);
    }
  };

  useEffect(() => {
    void loadRewards();
  }, []);

  const loadEntity = async (entity: EntityType) => {
    setActiveEntity(entity);
    setQuery("");
    setItems([]);
    setIsLoading(true);
    try {
      if (entity === "branches") {
        const { data } = await getAllBranches();
        const branches = Array.isArray(data) ? (data as Branch[]) : [];
        setItems(
          branches.map((branch) => ({
            id: String(branch.branch_id ?? ""),
            name:
              branch.branch_name ?? (branch.branch_city as string) ?? "Branch",
            action: branch.branch_id
              ? () => router.push(`/branch/${branch.branch_id}`)
              : undefined,
          }))
        );
      } else if (entity === "suppliers") {
        const { data } = await getSuppliers();
        const suppliers = Array.isArray(data) ? (data as Supplier[]) : [];
        setItems(
          suppliers.map((supplier) => ({
            id: String(supplier.supplier_id ?? ""),
            name: supplier.supplier_name ?? "Supplier",
            action: supplier.supplier_id
              ? () => router.push(`/suppliers/${supplier.supplier_id}`)
              : undefined,
          }))
        );
      } else if (entity === "categories") {
        const { data } = await getCategories();
        const categories = Array.isArray(data) ? (data as Category[]) : [];
        setItems(
          categories.map((category) => ({
            id: String(category.category_id ?? ""),
            name: category.category_name ?? "Category",
          }))
        );
      }
    } catch (error) {
      console.error(`Failed to load ${entity}`, error);
      Toast.error(`Unable to load ${entity}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRewardChange = (value: string) => {
    const parsed = Number(value);
    if (Number.isNaN(parsed)) {
      setRewardDraft("");
      return;
    }
    if (parsed >= 0 && parsed <= MAX_REWARD_PERCENTAGE) {
      setRewardDraft(parsed);
    }
  };

  const handleSaveRewards = async () => {
    if (rewardDraft === "" || rewardDraft === rewardPercentage) return;

    try {
      setIsSavingRewards(true);
      const promise = updateRewardsPointsPercentage({
        rewardsPointsPercentage: rewardDraft,
      });
      Toast.promise(promise, {
        loading: "Updating rewards percentage…",
        success: "Rewards percentage updated",
        error: (error) =>
          error?.response?.data?.error ?? "Failed to update rewards percentage",
      });
      await promise;
      await loadRewards();
    } catch (error) {
      console.error("Failed to update rewards percentage", error);
    } finally {
      setIsSavingRewards(false);
    }
  };

  const ActionCard = ({
    title,
    buttons,
  }: {
    title: string;
    buttons: Array<{
      label: string;
      onClick: () => void;
      variant?: "default" | "outline";
      icon?: React.ReactNode;
    }>;
  }) => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {buttons.map((button) => (
          <Button
            key={button.label}
            onClick={button.onClick}
            variant={button.variant ?? "default"}
            className="justify-start"
          >
            {button.icon}
            {button.label}
          </Button>
        ))}
      </CardContent>
    </Card>
  );

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-6">
          <ActionCard
            title="Branch"
            buttons={[
              {
                label: "View Branch Details",
                onClick: () =>
                  router.push(`/branch/${currentUser?.branch_id ?? ""}`),
              },
              {
                label: "Add New Branch",
                onClick: () => router.push("/branch"),
              },
              {
                label: "Browse Branches",
                onClick: () => void loadEntity("branches"),
                variant: "outline",
              },
            ]}
          />

          <ActionCard
            title="Employee Management"
            buttons={[
              {
                label: "View Employees",
                onClick: () => router.push("/employee"),
              },
              {
                label: "Track Working Hours",
                onClick: () => router.push("/employee/working"),
              },
              {
                label: "Add New Employee",
                onClick: () => router.push("/employee/new"),
              },
            ]}
          />

          <ActionCard
            title="Inventory"
            buttons={[
              {
                label: "View Product Catalog",
                onClick: () => router.push("/inventory/catalog"),
              },
              {
                label: "Add New Category",
                onClick: () => router.push("/inventory/categories/new"),
              },
              {
                label: "Browse Categories",
                onClick: () => void loadEntity("categories"),
                variant: "outline",
              },
            ]}
          />

          <ActionCard
            title="Suppliers"
            buttons={[
              {
                label: "View Suppliers",
                onClick: () => router.push("/suppliers"),
              },
              {
                label: "Add New Supplier",
                onClick: () => router.push("/suppliers/new"),
              },
              {
                label: "Browse Suppliers",
                onClick: () => void loadEntity("suppliers"),
                variant: "outline",
              },
            ]}
          />

          <ActionCard
            title="Access Rights"
            buttons={[
              {
                label: "Edit User Roles",
                onClick: () => router.push("/employee/roles"),
              },
            ]}
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">
                Loyalty Program
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isRewardsLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading loyalty settings…
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    Current rewards percentage:{" "}
                    <span className="font-medium">{rewardPercentage}%</span>
                  </p>
                  <Tabs defaultValue="set">
                    <TabsList className="w-full">
                      <TabsTrigger value="set" className="flex-1">
                        Update Rewards
                      </TabsTrigger>
                      <TabsTrigger value="info" className="flex-1">
                        How it works
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="set" className="space-y-3 pt-3">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Rewards Percentage (%)
                        </label>
                        <Input
                          type="number"
                          value={rewardDraft}
                          min={0}
                          max={MAX_REWARD_PERCENTAGE}
                          onChange={(event) =>
                            handleRewardChange(event.target.value)
                          }
                        />
                      </div>
                      <Button
                        onClick={handleSaveRewards}
                        disabled={
                          isSavingRewards ||
                          rewardDraft === "" ||
                          rewardDraft === rewardPercentage
                        }
                      >
                        {isSavingRewards && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Save Changes
                      </Button>
                    </TabsContent>
                    <TabsContent value="info" className="space-y-2 pt-3">
                      <p className="text-sm text-muted-foreground">
                        Set the percentage of each sale total that customers
                        earn as loyalty points. For example, a value of 1% adds
                        one point for every Rs.100 spent.
                      </p>
                    </TabsContent>
                  </Tabs>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">
                Mobile Application
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button
                variant="outline"
                onClick={() => setShowQr(true)}
                className="justify-start"
              >
                <QrCode className="mr-2 h-4 w-4" />
                Download Smart POS Mobile App
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="min-h-[200px]">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">
                {activeEntity
                  ? `Browse ${activeEntity
                      .charAt(0)
                      .toUpperCase()}${activeEntity.slice(1)}`
                  : "Select an option to browse"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeEntity ? (
                <>
                  <Input
                    placeholder="Search…"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                  <div className="rounded-md border">
                    {isLoading ? (
                      <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Loading {activeEntity}…
                      </div>
                    ) : filteredItems.length === 0 ? (
                      <div className="py-6 text-center text-sm text-muted-foreground">
                        No entries found.
                      </div>
                    ) : (
                      <ScrollArea className="h-[320px]">
                        <ul className="divide-y">
                          {filteredItems.map((item) => (
                            <li
                              key={item.id}
                              className="flex items-center justify-between gap-2 px-4 py-3"
                            >
                              <span className="text-sm font-medium">
                                {item.name}
                              </span>
                              {item.action && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={item.action}
                                >
                                  View
                                </Button>
                              )}
                            </li>
                          ))}
                        </ul>
                      </ScrollArea>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Choose an action on the left to browse details.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showQr} onOpenChange={setShowQr}>
        <DialogTrigger asChild>
          <span />
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Download Smart POS Mobile App</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <p>
              Scan the QR code below with your device to download the mobile
              application. After installing, log in using your employee
              credentials.
            </p>
            <div className="flex justify-center">
              <div className="relative h-56 w-56 overflow-hidden rounded-xl border">
                <Image
                  src={getMobileAppQrURL()}
                  alt="Smart POS Mobile QR"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ConfigScreen;
