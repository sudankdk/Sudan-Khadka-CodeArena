export interface ICustomRoadmap {
  id: string;
  user_id: string;
  author_name: string;
  name: string;
  description: string;
  visibility: "private" | "public";
  topics: string[];
  total_problems: number;
  progress: number;
  created_at: string;
  updated_at: string;
}

export interface ICreateCustomRoadmap {
  name: string;
  description: string;
  visibility: "private" | "public";
  topics: string[];
  total_problems: number;
}

export interface IUpdateRoadmapProgress {
  progress: number;
}
