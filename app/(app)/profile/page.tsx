"use client";

import * as React from "react";
import { Building2, CheckCircle2, Hash, Mail, Phone, UserRound } from "lucide-react";
import { api, type Item } from "@/lib/api";
import { genderLabels, roleLabels, statusLabels } from "@/lib/labels";
import { useAuth } from "@/components/app/auth";
import { EmptyState, PageHeader, UserAvatar } from "@/components/app/shared";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = React.useState<Item | null>(null);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user) return;
    api(`/api/${user.role.toLowerCase()}/profile`)
      .then(setProfile)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) return null;
  const name = profile?.fullName || user.username;
  const fields = [
    { label: "Mã định danh", value: profile?.code, icon: Hash },
    { label: "Email", value: profile?.email, icon: Mail },
    { label: "Số điện thoại", value: profile?.phone, icon: Phone },
    { label: "Giới tính", value: profile?.gender && (genderLabels[profile.gender] || profile.gender), icon: UserRound },
    { label: "Trạng thái", value: profile?.status && (statusLabels[profile.status] || profile.status), icon: CheckCircle2 },
    { label: "Lớp / Khoa", value: profile?.classroom?.name || profile?.faculty?.name, icon: Building2 },
  ].filter((f) => f.value);

  return (
    <>
      <PageHeader title="Hồ sơ của tôi" description="Thông tin cá nhân và học vụ được đồng bộ từ hệ thống." />
      <section className="bg-card max-w-4xl overflow-hidden rounded-2xl border">
        <div className="from-primary/25 via-primary/10 h-24 bg-gradient-to-r to-transparent" />
        <div className="px-6 pb-6 sm:px-8">
          <div className="-mt-10 flex flex-col gap-3">
            <UserAvatar name={name} className="border-card size-20 rounded-2xl border-4 text-2xl [&_span]:text-2xl" />
            <div>
              <h2 className="text-xl font-bold">{name}</h2>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <Badge>{roleLabels[user.role]}</Badge>
                {profile?.code && <span className="text-muted-foreground font-mono text-xs">{profile.code}</span>}
              </div>
            </div>
          </div>

          <div className="mt-8">
            {loading ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
            ) : error || !profile ? (
              <EmptyState tone="error" title="Chưa tải được hồ sơ" description={error || "Tài khoản có thể chưa được liên kết với hồ sơ. Hãy liên hệ quản trị viên."} />
            ) : (
              <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {fields.map(({ label, value, icon: Icon }) => (
                  <div key={label} className="bg-secondary/40 rounded-xl border p-4">
                    <dt className="text-muted-foreground flex items-center gap-2 text-xs"><Icon className="text-primary size-4" /> {label}</dt>
                    <dd className="mt-2 text-sm font-semibold break-words">{String(value)}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
