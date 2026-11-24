export const statusLabels: Record<string, string> = {
  STUDYING: "Đang học",
  SUSPENDED: "Tạm dừng",
  RESERVED: "Bảo lưu",
  GRADUATED: "Tốt nghiệp",
  DROPPED_OUT: "Thôi học",
  EXPELLED: "Buộc thôi học",
};
export const genderLabels: Record<string, string> = {
  MALE: "Nam", FEMALE: "Nữ", OTHER: "Khác", Nam: "Nam", "Nữ": "Nữ", "Khác": "Khác",
};
export const genderCode: Record<string, string> = { Nam: "MALE", "Nữ": "FEMALE", "Khác": "OTHER" };
export const roleLabels: Record<string, string> = {
  ADMIN: "Quản trị viên", TEACHER: "Giảng viên", STUDENT: "Sinh viên",
};
export const dayNames: Record<number, string> = {
  2: "Thứ Hai", 3: "Thứ Ba", 4: "Thứ Tư", 5: "Thứ Năm", 6: "Thứ Sáu", 7: "Thứ Bảy", 8: "Chủ nhật",
};
export const sessionStatusLabels: Record<string, string> = {
  SCHEDULED: "Sắp diễn ra", COMPLETED: "Đã học", CANCELLED: "Đã hủy",
};

export const clock = (v: number) =>
  `${String(Math.floor(v / 60)).padStart(2, "0")}:${String(v % 60).padStart(2, "0")}`;
export const toMinute = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
export const isoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const parseIso = (s?: string | null) => {
  if (!s) return undefined;
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
export const viDate = (s?: string | null) => {
  const d = parseIso(s);
  return d ? d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";
};
export const initials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
};
