"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import orderBy from "lodash/orderBy";
import { ArrowDown, ArrowUp, ArrowUpDown, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { getEmployees } from "@/services/employeeService";
import type { Employee } from "@/services/types";
import { Toast } from "@/components/ui";

type SortDirection = "asc" | "desc";

type SortColumn = {
  path: keyof Employee | "role_name" | "branch_name";
  order: SortDirection;
};

type EmployeeRecord = Employee & {
  branch: {
    branch_city: string;
  };
  user_role: {
    role_name: string;
  };
};

type ColumnConfig = {
  key: keyof EmployeeRecord | "actions";
  label: string;
  path?: SortColumn["path"];
  align?: "left" | "right";
  sortable?: boolean;
};

const PAGE_SIZE = 10;

const columns: ColumnConfig[] = [
  {
    key: "employee_name",
    label: "Name",
    path: "employee_name",
    sortable: true,
  },
  {
    key: "employee_email",
    label: "Email",
    path: "employee_email",
    sortable: true,
  },
  { key: "role_name", label: "Role", path: "role_name", sortable: true },
  { key: "branch_name", label: "Branch", path: "branch_name", sortable: true },
  { key: "actions", label: "Actions", align: "right" },
];

const formatSortIcon = (column: ColumnConfig, sortColumn: SortColumn) => {
  if (!column.sortable || !column.path) {
    return null;
  }

  if (sortColumn.path !== column.path) {
    return <ArrowUpDown className="h-3.5 w-3.5" />;
  }

  return sortColumn.order === "asc" ? (
    <ArrowUp className="h-3.5 w-3.5" />
  ) : (
    <ArrowDown className="h-3.5 w-3.5" />
  );
};

const getPaginatedData = <T,>(
  data: T[],
  page: number,
  pageSize: number
): T[] => {
  const startIndex = (page - 1) * pageSize;
  return data.slice(startIndex, startIndex + pageSize);
};

const EmployeeList = () => {
  const router = useRouter();
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortColumn, setSortColumn] = useState<SortColumn>({
    path: "employee_name",
    order: "asc",
  });

  const fetchEmployees = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data } = await getEmployees();
      setEmployees(Array.isArray(data) ? (data as EmployeeRecord[]) : []);
    } catch (error) {
      console.error("Failed to load employees", error);
      Toast.error("Unable to load employees. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const filteredEmployees = useMemo(() => {
    if (!searchQuery) return employees;
    const query = searchQuery.trim().toLowerCase();
    return employees.filter((employee) => {
      const matchesName = employee.employee_name?.toLowerCase().includes(query);
      const matchesId = employee.employee_id
        ?.toString()
        .toLowerCase()
        .startsWith(query);
      return Boolean(matchesName || matchesId);
    });
  }, [employees, searchQuery]);

  useEffect(() => {
    const nextTotalPages =
      Math.max(1, Math.ceil(filteredEmployees.length / PAGE_SIZE)) || 1;
    if (currentPage > nextTotalPages) {
      setCurrentPage(nextTotalPages);
    }
  }, [filteredEmployees.length, currentPage]);

  const sortedEmployees = useMemo(
    () =>
      orderBy(
        filteredEmployees,
        [sortColumn.path as string],
        [sortColumn.order]
      ),
    [filteredEmployees, sortColumn]
  );

  const paginatedEmployees: any[] = useMemo(
    () => getPaginatedData(sortedEmployees, currentPage, PAGE_SIZE),
    [sortedEmployees, currentPage]
  );

  const handleSort = (path: SortColumn["path"]) => {
    setSortColumn((prev) => {
      if (prev.path === path) {
        return {
          ...prev,
          order: prev.order === "asc" ? "desc" : "asc",
        };
      }
      return { path, order: "asc" };
    });
  };

  const handleSelect = (employee: EmployeeRecord) => {
    try {
      sessionStorage.setItem(
        "selectedEmployee",
        JSON.stringify(employee ?? {})
      );
    } catch (error) {
      console.warn("Unable to store employee in session storage", error);
    }
    router.push("/employee/profile");
  };

  const handleAddEmployee = () => {
    router.push("/employee/new");
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 border-b border-border sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-lg font-semibold">Employees</CardTitle>
          <p className="text-sm text-muted-foreground">
            Showing {sortedEmployees.length} employees in the database.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search employees (name or ID)"
            className="w-full min-w-[220px]"
          />
          <Button onClick={handleAddEmployee}>Add Employee</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead
                    key={column.key}
                    className={cn(
                      column.align === "right" ? "text-right" : "text-left",
                      column.sortable ? "cursor-pointer select-none" : ""
                    )}
                    onClick={() =>
                      column.sortable && column.path
                        ? handleSort(column.path)
                        : undefined
                    }
                  >
                    <span className="inline-flex items-center gap-1">
                      {column.label}
                      {formatSortIcon(column, sortColumn)}
                    </span>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="py-10 text-center text-muted-foreground"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Loading employees…
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedEmployees.length > 0 ? (
                paginatedEmployees.map((employee) => (
                  <TableRow key={employee.employee_id}>
                    <TableCell className="font-medium">
                      {employee.employee_name}
                    </TableCell>
                    <TableCell>{employee.employee_email}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {employee.user_role.role_name ?? "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {employee.branch.branch_city ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSelect(employee)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="py-10 text-center text-muted-foreground"
                  >
                    No employees found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {sortedEmployees.length > PAGE_SIZE && (
          <PaginationControls
            totalItems={sortedEmployees.length}
            currentPage={currentPage}
            pageSize={PAGE_SIZE}
            onPageChange={handlePageChange}
          />
        )}
      </CardContent>
    </Card>
  );
};

type PaginationControlsProps = {
  totalItems: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
};

const PaginationControls = ({
  totalItems,
  currentPage,
  pageSize,
  onPageChange,
}: PaginationControlsProps) => {
  const totalPages = Math.ceil(totalItems / pageSize);
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        <div className="flex items-center gap-1">
          {pages.map((page) => (
            <Button
              key={page}
              size="sm"
              variant={page === currentPage ? "default" : "outline"}
              onClick={() => onPageChange(page)}
            >
              {page}
            </Button>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default EmployeeList;
