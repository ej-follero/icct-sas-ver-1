import { pgTable, serial, varchar, integer, text, timestamp } from "drizzle-orm/pg-core";

export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  department: varchar("department", { length: 255 }).notNull(),
  description: text("description"),
  units: integer("units").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  totalStudents: integer("total_students").default(0),
  totalInstructors: integer("total_instructors").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}); 