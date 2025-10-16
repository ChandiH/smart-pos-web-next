"use client";

import { useContext, useEffect, useMemo, useState } from "react";
import orderBy from "lodash/orderBy";
import { ArrowDown, ArrowUp, ArrowUpDown, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import UserContext from "@/context/UserContext";
import {
  addEmployeeRecord,
  getEmployeeByBranch,
  getRecordByDateBranch,
} from "@/services/employeeService";
import type { Employee, Identifier, WorkingHourRecord } from "@/services/types";
import { Toast } from "@/components/ui";

type SortDirection = "asc" | "desc";

type SortColumn = {
  path: keyof EmployeeShiftRecord;
  order: SortDirection;
};

type EmployeeShiftRecord = Employee & {
  shift_on: string;
  shift_off: string;
  total_hours: number;
  present: boolean;
  updated_by: Identifier;
  date: string;
};

type ExtendedUser = {
  branch_id?: Identifier;
  branch_name?: string;
  employee_id?: Identifier;
  [key: string]: unknown;
};

const today = () => new Date().toISOString().slice(0, 10);

const EmployeeWorkingHour = () => {
  const { currentUser } = useContext(UserContext);
  const user = (currentUser as ExtendedUser | null) ?? {};

  const [selectedDate, setSelectedDate] = useState<string>(today());
  const [unmarkedEmployees, setUnmarkedEmployees] = useState<
    EmployeeShiftRecord[]
  >([]);
  const [markedEmployees, setMarkedEmployees] = useState<WorkingHourRecord[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [sortColumn, setSortColumn] = useState<SortColumn>({
    path: "employee_name",
    order: "asc",
  });

  const branchId = user.branch_id;

  const fetchData = async () => {
    if (!branchId) return;
    try {
      setIsLoading(true);
      const [{ data: employees }, { data: marked }] = await Promise.all([
        getEmployeeByBranch(branchId),
        getRecordByDateBranch(selectedDate, branchId),
      ]);

      const markedRecords = Array.isArray(marked)
        ? (marked as WorkingHourRecord[])
        : [];

      const unmarked = (Array.isArray(employees) ? employees : [])
        .filter(
          (employee) =>
            !markedRecords.find(
              (record) => record.employee_id === employee.employee_id
            )
        )
        .filter((employee) => employee.role_id !== 1) // Exclude owner role
        .map((employee) => mapToShiftRecord(employee));

      setMarkedEmployees(markedRecords);
      setUnmarkedEmployees(unmarked);
    } catch (error) {
      console.error("Failed to load working hours", error);
      Toast.error("Unable to load working hours. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, branchId]);

  const mapToShiftRecord = (employee: Employee): EmployeeShiftRecord => ({
    ...employee,
    shift_on: "",
    shift_off: "",
    total_hours: 0,
    present: true,
    updated_by: user.employee_id ?? 0,
    date: selectedDate,
  });

  const parseHours = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours + minutes / 60;
  };

  const getTotalHours = (shift_on: string, shift_off: string) => {
    const total = parseHours(shift_off) - parseHours(shift_on);
    return Number(total.toFixed(2));
  };

  const handleSort = (path: SortColumn["path"]) => {
    setSortColumn((prev) => {
      if (prev.path === path) {
        return {
          path,
          order: prev.order === "asc" ? "desc" : "asc",
        };
      }
      return { path, order: "asc" };
    });
  };

  const handleTimeChange = (
    employee: EmployeeShiftRecord,
    field: "shift_on" | "shift_off",
    value: string
  ) => {
    setUnmarkedEmployees((prev) =>
      prev.map((item) =>
        item.employee_id === employee.employee_id
          ? { ...item, [field]: value }
          : item
      )
    );
  };

  const validateRecord = (employee: EmployeeShiftRecord) => {
    if (!employee.shift_on || !employee.shift_off) {
      return false;
    }
    return getTotalHours(employee.shift_on, employee.shift_off) >= 0;
  };

  const submitLeaveRecord = async (employee: EmployeeShiftRecord) => {
    try {
      const payload = {
        ...employee,
        present: false,
        shift_on: "00:00",
        shift_off: "00:00",
        total_hours: 0,
      };

      const promise = addEmployeeRecord(mapToPayload(payload));
      Toast.promise(promise, {
        loading: "Recording leave...",
        success: "Leave recorded",
        error: "Unable to record leave. Please try again.",
      });
      await promise;
      void fetchData();
    } catch (error) {
      console.error("Failed to record leave", error);
      Toast.error("Unable to record leave. Please try again.");
    }
  };

  const submitRecord = async (employee: EmployeeShiftRecord) => {
    if (!validateRecord(employee)) {
      Toast.error("Shift Off must be later than Shift On");
      return;
    }

    try {
      const payload = {
        ...employee,
        total_hours: getTotalHours(employee.shift_on, employee.shift_off),
      };
      await addEmployeeRecord(mapToPayload(payload));
      Toast.success("Working hours recorded");
      void fetchData();
    } catch (error) {
      console.error("Failed to record working hours", error);
      Toast.error("Unable to record hours. Please try again.");
    }
  };

  const sortedUnmarkedEmployees = useMemo(
    () =>
      orderBy(
        unmarkedEmployees,
        [sortColumn.path as string],
        [sortColumn.order]
      ),
    [unmarkedEmployees, sortColumn]
  );

  const mapToPayload = (employee: EmployeeShiftRecord) => ({
    employee_id: employee.employee_id,
    employee_name: employee.employee_name,
    role_name: employee.role_name,
    date: employee.date,
    shift_on: employee.shift_on,
    shift_off: employee.shift_off,
    updated_by: employee.updated_by,
    present: employee.present,
    total_hours: employee.total_hours,
  });

  const handleDateSelect = (value: string) => {
    const selected = new Date(value);
    const now = new Date();
    const current = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (selected > current) {
      Toast.error(
        "Updating employee working hours for a future date is not allowed."
      );
    } else if (selected < current) {
      setSelectedDate(value);
    } else {
      Toast.error("Please select a valid date.");
    }
  };

  const renderSortIcon = (path: SortColumn["path"]) => {
    if (sortColumn.path !== path) {
      return <ArrowUpDown className="h-3.5 w-3.5" />;
    }
    return sortColumn.order === "asc" ? (
      <ArrowUp className="h-3.5 w-3.5" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5" />
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">
              Record Employee Working Hours
            </CardTitle>
            <CardDescription>
              {user.branch_name
                ? `${user.branch_name} branch`
                : "Assign employees to shifts"}
            </CardDescription>
          </div>
          <div className="w-full max-w-xs">
            <Input
              type="date"
              value={selectedDate}
              onChange={(event) => handleDateSelect(event.target.value)}
              max={today()}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading employees…
            </div>
          ) : sortedUnmarkedEmployees.length > 0 ? (
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort("employee_id")}
                    >
                      <span className="inline-flex items-center gap-1">
                        ID
                        {renderSortIcon("employee_id")}
                      </span>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort("employee_name")}
                    >
                      <span className="inline-flex items-center gap-1">
                        Name
                        {renderSortIcon("employee_name")}
                      </span>
                    </TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="w-[140px]">Shift On</TableHead>
                    <TableHead className="w-[140px]">Shift Off</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedUnmarkedEmployees.map((employee) => (
                    <TableRow key={employee.employee_id}>
                      <TableCell>{employee.employee_id}</TableCell>
                      <TableCell className="font-medium">
                        {employee.employee_name}
                      </TableCell>
                      <TableCell>{employee.role_name ?? "—"}</TableCell>
                      <TableCell>
                        <Input
                          type="time"
                          value={employee.shift_on}
                          onChange={(event) =>
                            handleTimeChange(
                              employee,
                              "shift_on",
                              event.target.value
                            )
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="time"
                          value={employee.shift_off}
                          onChange={(event) =>
                            handleTimeChange(
                              employee,
                              "shift_off",
                              event.target.value
                            )
                          }
                        />
                      </TableCell>
                      <TableCell className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => submitLeaveRecord(employee)}
                        >
                          Leave
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => submitRecord(employee)}
                          disabled={!validateRecord(employee)}
                        >
                          Save
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              All employee records for this date are already recorded. Review
              them below.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Recorded Working Hours on {selectedDate}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Shift On</TableHead>
                  <TableHead>Shift Off</TableHead>
                  <TableHead>Total Hours</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {markedEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      No records found for this date.
                    </TableCell>
                  </TableRow>
                ) : (
                  markedEmployees.map((item: WorkingHourRecord) => (
                    <TableRow key={`${item.employee_id}-${item.date}`}>
                      <TableCell>{item.employee_id}</TableCell>
                      <TableCell className="font-medium">
                        {item.employee_name}
                      </TableCell>
                      <TableCell>{item.role_name ?? "—"}</TableCell>
                      <TableCell>{item.shift_on}</TableCell>
                      <TableCell>{item.shift_off}</TableCell>
                      <TableCell>{item.total_hours}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeWorkingHour;
