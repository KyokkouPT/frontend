import type { SetupStatus } from "@kyokkou/contracts";
import { serverFetch } from "./api/server";

/** 安装状态；后端不可用时返回“已安装”，避免把故障误判成未安装。 */
export async function getSetupStatus(): Promise<SetupStatus> {
  try {
    return await serverFetch<SetupStatus>("/api/v1/setup/status");
  } catch {
    return { requires_setup: false, user_count: 0, schema_version: 0 };
  }
}
