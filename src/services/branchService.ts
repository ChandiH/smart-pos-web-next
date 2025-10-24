import http from "./httpService";
import { Branch } from "@/types/prisma-types";
import { API_RESPONSE } from "@/types/common-types";
import { BranchAddRequest, BranchGetRequest } from "@/types/request-types";

const RESOURCE = "/branch";

export const getAllBranches = async () => {
  const response = await http.get<API_RESPONSE<Branch[]>>(RESOURCE);
  return response.data;
};

export const getBranch = async ({ branch_id }: BranchGetRequest) => {
  const response = await http.get<API_RESPONSE<Branch>>(`${RESOURCE}/${branch_id}`);
  return response.data;
};

export const addBranch = async (data: BranchAddRequest) => {
  const response = await http.post<API_RESPONSE<Branch>>(RESOURCE, data);
  return response.data;
};
