import type { Metadata } from "next";
import { PublicAppealForm } from "@/components/public-appeal-form";

export const metadata: Metadata = { title: "封禁申诉" };

export default function PublicAppealPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-[-0.02em]">封禁申诉</h1>
      <p className="mt-1.5 text-sm leading-relaxed text-fg-1">
        账号被封禁或停用时，可在这里提交免登录申诉。需要验证注册邮箱与密码；处理结果会在账号恢复后通知。
      </p>
      <div className="mt-6">
        <PublicAppealForm />
      </div>
    </>
  );
}
