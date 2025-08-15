import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

// Note: This is an admin-only interface running server-side
// In production, you should add proper authentication middleware

// GET - Dashboard statistics
export async function GET(request: NextRequest) {
  try {
    

    // Get current date and previous periods for comparison
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const lastHour = new Date(now.getTime() - 60 * 60 * 1000);
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Fetch data in parallel
    const [
      modelsSnapshot,
      usersSnapshot,
      orgSubsSnapshot,
      userSubsSnapshot,
      executionsSnapshot,
      lastWeekModelsSnapshot,
      lastMonthUsersSnapshot,
      lastHourExecutionsSnapshot,
      yesterdayExecutionsSnapshot
    ] = await Promise.all([
      // Current data
      adminDb.collection('models').get(),
      adminDb.collection('users').get(),
      adminDb.collection('organizationSubscriptions').where('status', '==', 'active').get(),
      adminDb.collection('userSubscriptions').where('status', '==', 'active').get(),
      adminDb.collection('promptExecutions').get(),
      
      // Historical data for comparison
      adminDb.collection('models').where('createdAt', '>=', Timestamp.fromDate(lastWeek)).get(),
      adminDb.collection('users').where('createdAt', '>=', Timestamp.fromDate(lastMonth)).get(),
      adminDb.collection('promptExecutions').where('executedAt', '>=', Timestamp.fromDate(lastHour)).get(),
      adminDb.collection('promptExecutions').where('executedAt', '>=', Timestamp.fromDate(yesterday)).get()
    ]);

    // Calculate statistics
    const totalModels = modelsSnapshot.size;
    const newModelsThisWeek = lastWeekModelsSnapshot.size;
    
    const totalUsers = usersSnapshot.size;
    const newUsersThisMonth = lastMonthUsersSnapshot.size;
    const activeUsers = orgSubsSnapshot.size + userSubsSnapshot.size;
    
    const totalExecutions = executionsSnapshot.size;
    const executionsLastHour = lastHourExecutionsSnapshot.size;
    const executionsYesterday = yesterdayExecutionsSnapshot.size;
    
    // Calculate success rate (assuming successful executions have a status field)
    let successfulExecutions = 0;
    executionsSnapshot.forEach(doc => {
      const data = doc.data();
      // Check if execution was successful (no error field or status is success)
      if (!data.error && !data.failureReason) {
        successfulExecutions++;
      }
    });
    
    const successRate = totalExecutions > 0 ? (successfulExecutions / totalExecutions * 100).toFixed(1) : 0;
    
    // Calculate changes
    const modelsChange = newModelsThisWeek > 0 ? `+${newModelsThisWeek} this week` : 'No change';
    const usersChange = newUsersThisMonth > 0 ? `+${newUsersThisMonth} from last month` : 'No change';
    const executionsChange = executionsYesterday > 0 ? `+${executionsYesterday} from yesterday` : 'No change';
    const successRateChange = 'Stable'; // Could be calculated with historical data

    const stats = {
      models: {
        name: 'Total Models',
        value: totalModels.toString(),
        change: modelsChange,
        changeType: newModelsThisWeek > 0 ? 'positive' : 'neutral'
      },
      users: {
        name: 'Active Users',
        value: activeUsers.toString(),
        change: usersChange,
        changeType: newUsersThisMonth > 0 ? 'positive' : 'neutral'
      },
      executions: {
        name: 'API Requests',
        value: totalExecutions.toLocaleString(),
        change: executionsChange,
        changeType: executionsYesterday > 0 ? 'positive' : 'neutral'
      },
      successRate: {
        name: 'Success Rate',
        value: `${successRate}%`,
        change: successRateChange,
        changeType: 'positive'
      }
    };

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch dashboard statistics'
    }, { status: 500 });
  }
} 