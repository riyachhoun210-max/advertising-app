import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// Helper to convert date string to DateTime range
const getDateRange = (dateStr: string) => {
  const start = new Date(dateStr);
  start.setHours(0, 0, 0, 0);
  const end = new Date(dateStr);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

// GET - Fetch reports (admin sees all, staff sees their own)
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (session.role === 'admin') {
      // Admin sees all submitted reports with user info and tasks
      const reports = await prisma.dailyReport.findMany({
        where: date ? {
          date: {
            gte: getDateRange(date).start,
            lte: getDateRange(date).end,
          }
        } : undefined,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              position: true,
            },
          },
        },
        orderBy: { submittedAt: 'desc' },
      });

      // Get tasks for each report
      const reportsWithTasks = await Promise.all(
        reports.map(async (report) => {
          const reportDate = report.date;
          const { start, end } = {
            start: new Date(reportDate),
            end: new Date(reportDate),
          };
          start.setHours(0, 0, 0, 0);
          end.setHours(23, 59, 59, 999);
          
          const tasks = await prisma.task.findMany({
            where: {
              userId: report.userId,
              date: {
                gte: start,
                lte: end,
              },
            },
          });
          return { ...report, tasks };
        })
      );

      return NextResponse.json(reportsWithTasks);
    } else {
      // Staff sees their own reports
      const reports = await prisma.dailyReport.findMany({
        where: {
          userId: session.userId,
          ...(date ? {
            date: {
              gte: getDateRange(date).start,
              lte: getDateRange(date).end,
            }
          } : {}),
        },
        orderBy: { date: 'desc' },
      });
      return NextResponse.json(reports);
    }
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
  }
}

// POST - Submit a daily report
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { date } = await request.json();

    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    const { start, end } = getDateRange(date);

    // Check 24-hour submission window
    const selectedDate = new Date(date);
    selectedDate.setHours(23, 59, 59, 999); // End of selected day
    const now = new Date();
    const deadline = new Date(selectedDate);
    deadline.setHours(deadline.getHours() + 24); // 24 hours after end of day
    
    if (now > deadline) {
      return NextResponse.json({ 
        error: 'Submission deadline passed. Reports can only be submitted within 24 hours after the report date.' 
      }, { status: 400 });
    }

    // Check if there are any tasks for this date
    const tasksCount = await prisma.task.count({
      where: {
        userId: session.userId,
        date: {
          gte: start,
          lte: end,
        },
      },
    });

    if (tasksCount === 0) {
      return NextResponse.json({ error: 'No tasks to submit for this date' }, { status: 400 });
    }

    // Update existing report or create new one
    const reportDate = new Date(date);
    reportDate.setHours(12, 0, 0, 0);
    
    const existingReport = await prisma.dailyReport.findFirst({
      where: {
        userId: session.userId,
        date: {
          gte: start,
          lte: end,
        },
      },
    });

    let report;
    if (existingReport) {
      // Update existing report with new submission time
      report = await prisma.dailyReport.update({
        where: { id: existingReport.id },
        data: {
          submitted: true,
          submittedAt: new Date(),
        },
      });
    } else {
      // Create new report
      report = await prisma.dailyReport.create({
        data: {
          date: reportDate,
          userId: session.userId,
          submitted: true,
          submittedAt: new Date(),
        },
      });
    }

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error('Error submitting report:', error);
    return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 });
  }
}

// DELETE - Delete/withdraw a submitted report
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    const { start, end } = getDateRange(date);

    // Find the report for this date
    const report = await prisma.dailyReport.findFirst({
      where: {
        userId: session.userId,
        date: {
          gte: start,
          lte: end,
        },
      },
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Delete the report
    await prisma.dailyReport.delete({
      where: { id: report.id },
    });

    return NextResponse.json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Error deleting report:', error);
    return NextResponse.json({ error: 'Failed to delete report' }, { status: 500 });
  }
}
