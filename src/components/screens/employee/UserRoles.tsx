"use client";

import { useEffect, useMemo, useState } from "react";
import orderBy from "lodash/orderBy";
import { Loader2, Plus, Trash2 } from "lucide-react";

import AccessFrame from "@/components/accessFrame";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  accessList,
  addNewUserRole,
  changeUserAccess,
  deleteUserRole,
  getUserRoles,
} from "@/services/authorizationService";
import type { AccessPermission, Identifier } from "@/services/types";
import { Toast } from "@/components/ui";

type Role = {
  role_id: Identifier;
  role_name: string;
  role_desc?: string;
  user_access: number[];
};

type SortDirection = "asc" | "desc";

type SortColumn = {
  path: keyof Role;
  order: SortDirection;
};

const UserRoles = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [filteredRoles, setFilteredRoles] = useState<Role[]>([]);
  const [accessLevels, setAccessLevels] = useState<AccessPermission[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedAccess, setSelectedAccess] = useState<number[]>([]);
  const [isSettingChanged, setIsSettingChanged] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [sortColumn, setSortColumn] = useState<SortColumn>({
    path: "role_name",
    order: "asc",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [{ data: roleData }] = await Promise.all([getUserRoles()]);
      const roleList = Array.isArray(roleData)
        ? (roleData as Role[])
        : ([] as Role[]);

      setRoles(roleList);
      setFilteredRoles(roleList);
      setAccessLevels(accessList());
      setSelectedRole(roleList[0] ?? null);
      setSelectedAccess(roleList[0]?.user_access ?? []);
    } catch (error) {
      console.error("Failed to load user roles", error);
      Toast.error("Unable to load user roles. Please try again.");
    } finally {
      setIsLoading(false);
      setIsSettingChanged(false);
      setShowForm(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  useEffect(() => {
    setFilteredRoles(
      roles.filter((role) =>
        role.role_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [roles, searchQuery]);

  const sortedRoles = useMemo(
    () =>
      orderBy(filteredRoles, [sortColumn.path as string], [sortColumn.order]),
    [filteredRoles, sortColumn]
  );

  const handleSort = (path: SortColumn["path"]) => {
    setSortColumn((prev) => {
      if (prev.path === path) {
        return { path, order: prev.order === "asc" ? "desc" : "asc" };
      }
      return { path, order: "asc" };
    });
  };

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    setSelectedAccess(role.user_access ?? []);
    setShowForm(false);
    setIsSettingChanged(false);
  };

  const handleRoleDelete = async (role: Role) => {
    if (role.role_name.toLowerCase() === "owner") {
      Toast.error("Owner role cannot be deleted.");
      return;
    }

    try {
      await deleteUserRole(role.role_id);
      Toast.success("User role deleted");
      void fetchData();
    } catch (error) {
      console.error("Failed to delete role", error);
      const message =
        (error as { response?: { data?: { error?: string } } }).response?.data
          ?.error ?? "Unable to delete role.";
      Toast.error(message);
    }
  };

  const handleAccessToggle = (accessId: number) => {
    setSelectedAccess((prev) => {
      if (prev.includes(accessId)) {
        return prev.filter((id) => id !== accessId);
      }
      return [...prev, accessId];
    });
    setIsSettingChanged(true);
  };

  const handleCreateNewRole = () => {
    setSelectedRole(null);
    setSelectedAccess([]);
    setNewRoleName("");
    setNewRoleDesc("");
    setShowForm(true);
    setIsSettingChanged(false);
  };

  const handleSaveChanges = async () => {
    try {
      setIsSaving(true);
      if (showForm) {
        if (!newRoleName.trim()) {
          Toast.error("Role name is required.");
          setIsSaving(false);
          return;
        }
        await addNewUserRole({
          role_name: newRoleName.trim(),
          role_desc: newRoleDesc.trim(),
          user_access: selectedAccess,
        });
        Toast.success("New user role added");
      } else if (selectedRole) {
        await changeUserAccess(selectedRole.role_id, selectedAccess);
        Toast.success("Role permissions updated");
      }
      void fetchData();
    } catch (error) {
      console.error("Failed to save role changes", error);
      Toast.error("Unable to save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const isSaveDisabled = useMemo(() => {
    if (showForm) {
      return !newRoleName.trim() || isSaving;
    }
    return !isSettingChanged || isSaving || !selectedRole;
  }, [showForm, newRoleName, isSaving, isSettingChanged, selectedRole]);

  return (
    <AccessFrame
      accessLevel="configuration"
      message="You do not have permission to manage user roles. Please contact your branch manager."
    >
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-lg font-semibold">
              User Roles
              <Button size="sm" onClick={handleCreateNewRole}>
                <Plus className="mr-1 h-4 w-4" />
                New Role
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search roles…"
            />
            <div className="overflow-hidden rounded-lg border">
              {isLoading ? (
                <div className="flex items-center justify-center py-10 text-muted-foreground">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Loading roles…
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead
                        className="cursor-pointer"
                        onClick={() => handleSort("role_name")}
                      >
                        Role Name
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedRoles.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={2}
                          className="py-8 text-center text-sm text-muted-foreground"
                        >
                          No roles found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedRoles.map((role: any) => (
                        <TableRow
                          key={role.role_id as string}
                          className={
                            selectedRole?.role_id === role.role_id
                              ? "bg-muted/40"
                              : undefined
                          }
                        >
                          <TableCell>{role.role_name}</TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRoleSelect(role)}
                              >
                                Select
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleRoleDelete(role)}
                                disabled={
                                  role.role_name.toLowerCase() === "owner"
                                }
                              >
                                <Trash2 className="mr-1 h-3.5 w-3.5" />
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              {showForm
                ? "Create New User Role"
                : selectedRole?.role_name ?? "Select a role"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {showForm ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Role Name</label>
                  <Input
                    value={newRoleName}
                    onChange={(event) => setNewRoleName(event.target.value)}
                    placeholder="Enter role name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Input
                    value={newRoleDesc}
                    onChange={(event) => setNewRoleDesc(event.target.value)}
                    placeholder="Optional description"
                  />
                </div>
              </div>
            ) : selectedRole ? (
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>{selectedRole.role_desc ?? "No description available."}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Select a role to view and edit its permissions.
              </p>
            )}

            <div className="space-y-3">
              <p className="text-sm font-medium">Permissions</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {accessLevels.map((access) => (
                  <label
                    key={access.access_type_id}
                    className="flex items-center gap-2 rounded-md border p-3"
                  >
                    <Checkbox
                      checked={selectedAccess.includes(access.access_type_id)}
                      onCheckedChange={() =>
                        handleAccessToggle(access.access_type_id)
                      }
                    />
                    <span className="text-sm capitalize">
                      {access.access_name.replace(/([A-Z])/g, " $1").trim()}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowForm(false);
                setSelectedRole(null);
                setSelectedAccess([]);
                setNewRoleDesc("");
                setNewRoleName("");
                setIsSettingChanged(false);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveChanges} disabled={isSaveDisabled}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </CardFooter>
        </Card>
      </div>
    </AccessFrame>
  );
};

export default UserRoles;
