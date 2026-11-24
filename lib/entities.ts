export type FieldType = "text" | "number" | "email" | "date" | "gender" | "status" | "lookup";

export type FieldDef = {
  key: string;
  label: string;
  type: FieldType;
  /** lookup collection under /api/catalog/<lookup> */
  lookup?: string;
  required?: boolean;
  placeholder?: string;
};

export type EntityDef = {
  slug: string;
  title: string;
  singular: string;
  description: string;
  fields: FieldDef[];
};

const f = (key: string, label: string, type: FieldType = "text", extra: Partial<FieldDef> = {}): FieldDef => ({
  key, label, type, ...extra,
});

export const entities: Record<string, EntityDef> = {
  years: {
    slug: "years", title: "Khóa học", singular: "khóa học",
    description: "Các khóa đào tạo của nhà trường, ví dụ K22 (2022).",
    fields: [f("name", "Tên khóa", "text", { required: true, placeholder: "vd: K22" }), f("startYear", "Năm bắt đầu", "number", { required: true, placeholder: "vd: 2022" })],
  },
  faculties: {
    slug: "faculties", title: "Khoa", singular: "khoa",
    description: "Các khoa đào tạo và khóa học tương ứng.",
    fields: [f("name", "Tên khoa", "text", { required: true }), f("courseYearId", "Khóa học", "lookup", { lookup: "years", required: true })],
  },
  classes: {
    slug: "classes", title: "Lớp học", singular: "lớp học",
    description: "Lớp hành chính, khoa quản lý và giảng viên phụ trách.",
    fields: [
      f("name", "Tên lớp", "text", { required: true }),
      f("facultyId", "Khoa", "lookup", { lookup: "faculties", required: true }),
      f("teacherId", "Giảng viên phụ trách", "lookup", { lookup: "teachers", required: true }),
    ],
  },
  subjects: {
    slug: "subjects", title: "Môn học", singular: "môn học",
    description: "Danh mục môn học theo khoa.",
    fields: [f("code", "Mã môn", "text", { required: true }), f("name", "Tên môn", "text", { required: true }), f("facultyId", "Khoa", "lookup", { lookup: "faculties", required: true })],
  },
  teachers: {
    slug: "teachers", title: "Giảng viên", singular: "giảng viên",
    description: "Đội ngũ giảng viên và khoa công tác.",
    fields: [
      f("code", "Mã giảng viên", "text", { required: true }),
      f("fullName", "Họ và tên", "text", { required: true }),
      f("email", "Email", "email"),
      f("facultyId", "Khoa", "lookup", { lookup: "faculties", required: true }),
    ],
  },
  "class-subjects": {
    slug: "class-subjects", title: "Phân công môn theo lớp", singular: "phân công",
    description: "Gán môn học và giảng viên cho từng lớp.",
    fields: [
      f("classroomId", "Lớp học", "lookup", { lookup: "classes", required: true }),
      f("subjectId", "Môn học", "lookup", { lookup: "subjects", required: true }),
      f("teacherId", "Giảng viên phụ trách", "lookup", { lookup: "teachers", required: true }),
    ],
  },
  students: {
    slug: "students", title: "Sinh viên", singular: "sinh viên",
    description: "Hồ sơ sinh viên, lớp học và trạng thái học tập.",
    fields: [
      f("code", "Mã sinh viên", "text", { required: true }),
      f("fullName", "Họ và tên", "text", { required: true }),
      f("email", "Email", "email"),
      f("phone", "Số điện thoại"),
      f("gender", "Giới tính", "gender"),
      f("dateOfBirth", "Ngày sinh", "date"),
      f("status", "Trạng thái", "status"),
      f("classroomId", "Lớp học", "lookup", { lookup: "classes", required: true }),
    ],
  },
};

/** Which slugs each role may open. ADMIN may also write. */
export const entityAccess: Record<string, string[]> = {
  ADMIN: Object.keys(entities),
  TEACHER: ["classes", "teachers"],
  STUDENT: [],
};

export const lookupKeys = ["years", "faculties", "classes", "students", "teachers", "subjects", "class-subjects"];
