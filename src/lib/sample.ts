import * as XLSX from "xlsx";
import { loadTableFile } from "./files";
import type { SelectedTableFile, TableRows } from "./types";

export const sampleOptions = [
  { id: "exam-csv", label: "Exam results CSV" },
  { id: "registration-xlsx", label: "Registration results XLSX" },
] as const;

export type SampleId = (typeof sampleOptions)[number]["id"];

export type SampleFiles = {
  left: SelectedTableFile;
  right: SelectedTableFile;
};

const leftCsv = `student_id,name,class,math,english,total,comment
S001,王小明,A,88,91,179,steady
S002,李安,A,76,82,158,needs practice
S003,Chen Wei,B,92,85,177,excellent
S004,林美玲,B,65,70,135,retake
S005,Alex Kim,A,81,79,160,steady
`;

const rightCsv = `student_id,name,class,math,english,science,total,remark
S003,Chen Wei,B,92,85,94,271,excellent
S001,王小明,A,90,91,88,269,improved
S006,張雅婷,A,84,89,91,264,new student
S005,Alex Kim,A,81,79,86,246,steady
S004,林美玲,B,68,72,74,214,retake scheduled
`;

export async function loadSampleFiles(id: string): Promise<SampleFiles> {
  if (id === "registration-xlsx") return registrationSample();
  return examSample();
}

async function examSample(): Promise<SampleFiles> {
  const [left, right] = await Promise.all([
    selectedCsvFile("sample-exam-left.csv", leftCsv),
    selectedCsvFile("sample-exam-right.csv", rightCsv),
  ]);

  return { left, right };
}

async function selectedCsvFile(name: string, content: string): Promise<SelectedTableFile> {
  const file = new File([content], name, { type: "text/csv;charset=utf-8" });
  return loadTableFile(file);
}

async function registrationSample(): Promise<SampleFiles> {
  const [left, right] = await Promise.all([
    selectedXlsxFile("sample-registration-left.xlsx", registrationLeftRows()),
    selectedXlsxFile("sample-registration-right.xlsx", registrationRightRows()),
  ]);

  return { left, right };
}

async function selectedXlsxFile(name: string, rows: TableRows): Promise<SelectedTableFile> {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), "Registrations");

  const content = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const file = new File([content], name, {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  return loadTableFile(file);
}

function registrationLeftRows(): TableRows {
  return [
    ["Registration Result", "Name", "Department / Year", "Email", "Phone", "Dietary Preference"],
    ...registrants().map((person, index) => [
      index % 7 === 0 ? "Waitlisted" : "Accepted",
      person.name,
      person.department,
      person.email,
      person.phone,
      person.diet,
    ]),
  ];
}

function registrationRightRows(): TableRows {
  const rows = registrationLeftRows()
    .slice(1)
    .filter((row) => row[1] !== "Mia Chen")
    .map((row) => [...row]);

  rows[1][0] = "Accepted";
  rows[1][5] = "Vegan";
  rows[6][4] = "+886-912-640-118";
  rows[11][0] = "Cancelled";
  rows[18][5] = "Halal";
  rows.splice(8, 0, [
    "Accepted",
    "Noah Lin",
    "Data Science / Year 2",
    "noah.lin@example.edu",
    "+886-912-777-042",
    "Vegetarian",
  ]);
  rows.splice(24, 0, rows.splice(4, 1)[0]);

  return [
    ["Registration Result", "Name", "Department / Year", "Email", "Phone", "Dietary Preference"],
    ...rows,
  ];
}

function registrants() {
  const names = [
    "Ava Wang",
    "Mia Chen",
    "Ethan Liu",
    "Sophia Huang",
    "Lucas Chang",
    "Olivia Wu",
    "Liam Lin",
    "Emma Tsai",
    "Mason Lee",
    "Isabella Yang",
    "Logan Hsu",
    "Amelia Chou",
    "James Kao",
    "Harper Yu",
    "Benjamin Ho",
    "Evelyn Tang",
    "Henry Su",
    "Abigail Yeh",
    "Daniel Lai",
    "Emily Hsieh",
    "Michael Kuo",
    "Elizabeth Pan",
    "Alexander Shen",
    "Sofia Fang",
    "William Lu",
    "Grace Liang",
    "Matthew Chiang",
    "Chloe Peng",
    "Jackson Wei",
    "Victoria Yen",
    "Sebastian Ko",
    "Lily Tien",
    "David Hung",
    "Ella Ma",
    "Joseph Fan",
    "Scarlett Chiu",
    "Samuel Chao",
    "Zoey Liao",
    "Owen Teng",
    "Hannah Lo",
    "Nathan Hsu",
    "Aria Song",
    "Andrew Lin",
    "Nora Chen",
    "Ryan Wu",
    "Mila Chang",
    "Joshua Wang",
    "Layla Liu",
    "Carter Huang",
    "Riley Tsai",
    "Dylan Lee",
    "Aurora Yang",
    "Luke Chou",
    "Penelope Kao",
    "Isaac Yu",
    "Ellie Ho",
    "Gabriel Tang",
    "Stella Su",
    "Anthony Yeh",
    "Leah Lai",
  ];
  const departments = [
    "Computer Science / Year 1",
    "Economics / Year 2",
    "Electrical Engineering / Year 3",
    "Foreign Languages / Year 4",
    "Business Administration / Year 2",
    "Mechanical Engineering / Year 1",
  ];
  const diets = ["Regular", "Vegetarian", "Vegan", "Halal", "No beef", "No seafood"];

  return names.map((name, index) => ({
    name,
    department: departments[index % departments.length],
    email: `${name.toLowerCase().replaceAll(" ", ".")}@example.edu`,
    phone: `+886-912-${String(300 + index).padStart(3, "0")}-${String(100 + index).padStart(3, "0")}`,
    diet: diets[index % diets.length],
  }));
}
