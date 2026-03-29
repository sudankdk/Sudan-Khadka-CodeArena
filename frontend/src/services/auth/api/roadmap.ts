import { server } from "@/constants/server.tsx";
import { ApiClient } from "../client";
import type {
  ICreateCustomRoadmap,
  ICustomRoadmap,
  IUpdateCustomRoadmap,
  IUpdateRoadmapProgress,
} from "@/types/roadmap/roadmap";

export const roadmapClient = new ApiClient(server);

export const listCustomRoadmaps = async (): Promise<ICustomRoadmap[]> => {
  const resp = await roadmapClient.get<{ data: ICustomRoadmap[] }>("/roadmaps/custom");
  return resp?.data || [];
};

export const getCustomRoadmap = async (id: string): Promise<ICustomRoadmap> => {
  const resp = await roadmapClient.get<{ data: ICustomRoadmap }>(`/roadmaps/custom/${id}`);
  return resp?.data || resp;
};

export const createCustomRoadmap = async (
  payload: ICreateCustomRoadmap
): Promise<ICustomRoadmap> => {
  const resp = await roadmapClient.post<{ data: ICustomRoadmap }>(
    "/roadmaps/custom",
    payload
  );
  return resp?.data || resp;
};

export const updateCustomRoadmap = async (
  id: string,
  payload: IUpdateCustomRoadmap
): Promise<ICustomRoadmap> => {
  const resp = await roadmapClient.put<{ data: ICustomRoadmap }>(
    `/roadmaps/custom/${id}`,
    payload
  );
  return resp?.data || resp;
};

export const updateRoadmapProgress = async (
  roadmapId: string,
  payload: IUpdateRoadmapProgress
): Promise<ICustomRoadmap> => {
  const resp = await roadmapClient.put<{ data: ICustomRoadmap }>(
    `/roadmaps/custom/${roadmapId}/progress`,
    payload
  );
  return resp?.data || resp;
};

export const deleteCustomRoadmap = async (id: string): Promise<void> => {
  await roadmapClient.delete(`/roadmaps/custom/${id}`);
};
