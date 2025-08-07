import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    console.log("Testing database connectivity...");
    
    // Test basic connection
    await prisma.$connect();
    console.log("Database connection successful");
    
    // Test a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log("Simple query test successful:", result);
    
    // Test if CourseOffering table exists
    try {
      const courseCount = await prisma.courseOffering.count();
      console.log(`CourseOffering table accessible, count: ${courseCount}`);
    } catch (tableError) {
      console.error("CourseOffering table error:", tableError);
      return NextResponse.json({
        status: "partial",
        message: "Database connected but CourseOffering table not accessible",
        error: tableError instanceof Error ? tableError.message : "Unknown table error",
        details: process.env.NODE_ENV === 'development' ? tableError : undefined
      }, { status: 200 });
    }
    
    // Test if Department table exists
    try {
      const deptCount = await prisma.department.count();
      console.log(`Department table accessible, count: ${deptCount}`);
    } catch (deptError) {
      console.error("Department table error:", deptError);
      return NextResponse.json({
        status: "partial",
        message: "Database connected but Department table not accessible",
        error: deptError instanceof Error ? deptError.message : "Unknown table error",
        details: process.env.NODE_ENV === 'development' ? deptError : undefined
      }, { status: 200 });
    }
    
    return NextResponse.json({
      status: "success",
      message: "Database connectivity test passed",
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("Database connectivity test failed:", error);
    
    return NextResponse.json({
      status: "error",
      message: "Database connectivity test failed",
      error: error instanceof Error ? error.message : "Unknown error",
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 });
  } finally {
    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.error("Error disconnecting from database:", disconnectError);
    }
  }
} 