import supabase from '@/utils/supabaseClient';
import authStore from '@/stores/authStore';

/**
 * Service for handling dashboard statistics and data
 */
class DashboardService {
  /**
   * Get dashboard statistics for a professor
   * @returns {Promise<Object>} - Dashboard statistics
   */
  static async getProfessorDashboardStats() {
    try {
      const user = authStore.user.value;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const userId = user.id;
      const centroId = user.centro_id || user.user_metadata?.centro_id;

      console.log('Getting dashboard stats for user:', userId, 'center:', centroId);

      // Get professor's modules
      const { data: professorModules, error: modulesError } = await supabase
        .from('usuarios_modulos')
        .select(`
          modulo_id,
          modulos (
            id,
            nombre,
            curso,
            clase
          )
        `)
        .eq('usuario_id', userId);

      if (modulesError) {
        console.error('Error fetching professor modules:', modulesError);
        throw modulesError;
      }

      const moduleIds = professorModules?.map(pm => pm.modulo_id) || [];
      console.log('Professor module IDs:', moduleIds);

      if (moduleIds.length === 0) {
        return {
          activeTutors: { count: 0, description: 'No modules assigned' },
          studentInteractions: { count: 0, description: 'No interactions yet' },
          totalStudents: { count: 0, description: 'No students in modules' },
          pendingAssignments: { count: 0, description: 'No assignments created' },
          weeklyActivity: [],
          recentAlerts: []
        };
      }

      // Get units for these modules
      const { data: units, error: unitsError } = await supabase
        .from('unidades')
        .select('id, nombre, modulo_id')
        .in('modulo_id', moduleIds);

      if (unitsError) {
        console.error('Error fetching units:', unitsError);
        throw unitsError;
      }

      const unitIds = units?.map(u => u.id) || [];
      console.log('Unit IDs:', unitIds);

      // Get active tutors count
      const { data: tutors, error: tutorsError } = await supabase
        .from('tutores_virtuales')
        .select('id, nombre, activo, unidad_id')
        .in('unidad_id', unitIds);

      if (tutorsError) {
        console.error('Error fetching tutors:', tutorsError);
        throw tutorsError;
      }

      const activeTutorsCount = tutors?.filter(t => t.activo).length || 0;
      const totalTutorsCount = tutors?.length || 0;

      // Get student interactions (chats) count
      const tutorIds = tutors?.map(t => t.id) || [];
      const { data: chats, error: chatsError } = await supabase
        .from('chats')
        .select('id, tutor_virtual_id, fecha_ultimo_mensaje')
        .in('tutor_virtual_id', tutorIds);

      if (chatsError) {
        console.error('Error fetching chats:', chatsError);
        throw chatsError;
      }

      const totalInteractions = chats?.length || 0;

      // Get recent interactions (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentInteractions = chats?.filter(chat =>
        new Date(chat.fecha_ultimo_mensaje) >= sevenDaysAgo
      ).length || 0;

      // Get students count in professor's modules
      const { data: students, error: studentsError } = await supabase
        .from('usuarios')
        .select('id, curso, clase')
        .eq('centro_id', centroId)
        .eq('rol', 'estudiante');

      if (studentsError) {
        console.error('Error fetching students:', studentsError);
        throw studentsError;
      }

      // Filter students that belong to professor's modules
      const professorModulesInfo = professorModules?.map(pm => pm.modulos) || [];
      const relevantStudents = students?.filter(student =>
        professorModulesInfo.some(module =>
          module.curso === student.curso && module.clase === student.clase
        )
      ) || [];

      // Get assignments count
      const { data: assignments, error: assignmentsError } = await supabase
        .from('assignments')
        .select('id, titulo, fecha_entrega, active')
        .in('unidad_id', unitIds);

      if (assignmentsError) {
        console.error('Error fetching assignments:', assignmentsError);
        throw assignmentsError;
      }

      const activeAssignments = assignments?.filter(a => a.active).length || 0;
      const pendingAssignments = assignments?.filter(a => {
        const dueDate = new Date(a.fecha_entrega);
        return a.active && dueDate > new Date();
      }).length || 0;

      // Generate weekly activity data (mock data for now)
      const weeklyActivity = this.generateWeeklyActivityData(chats || []);

      // Generate recent alerts
      const recentAlerts = this.generateRecentAlerts(
        relevantStudents.length,
        recentInteractions,
        pendingAssignments
      );

      return {
        activeTutors: {
          count: activeTutorsCount,
          description: `${totalTutorsCount} total tutors created`
        },
        studentInteractions: {
          count: totalInteractions,
          description: `${recentInteractions} interactions this week`
        },
        totalStudents: {
          count: relevantStudents.length,
          description: 'students in your modules'
        },
        pendingAssignments: {
          count: pendingAssignments,
          description: `${activeAssignments} total assignments`
        },
        weeklyActivity,
        recentAlerts,
        moduleIds,
        unitIds
      };

    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      throw error;
    }
  }

  /**
   * Generate weekly activity data from chats
   * @param {Array} chats - Array of chat data
   * @returns {Array} - Weekly activity data
   */
  static generateWeeklyActivityData(chats) {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weeklyData = days.map(day => ({ day, interactions: 0, tutorUsage: 0 }));

    // Process chats to generate realistic weekly data
    chats.forEach(chat => {
      const chatDate = new Date(chat.fecha_ultimo_mensaje);
      const dayIndex = (chatDate.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
      if (dayIndex < 7) {
        weeklyData[dayIndex].interactions += 1;
        weeklyData[dayIndex].tutorUsage += Math.random() > 0.5 ? 1 : 0;
      }
    });

    return weeklyData;
  }

  /**
   * Generate recent alerts based on data
   * @param {number} studentsCount - Number of students
   * @param {number} recentInteractions - Recent interactions count
   * @param {number} pendingAssignments - Pending assignments count
   * @returns {Array} - Array of alerts
   */
  static generateRecentAlerts(studentsCount, recentInteractions, pendingAssignments) {
    const alerts = [];

    if (studentsCount > 0) {
      const engagementRate = Math.round((recentInteractions / studentsCount) * 100);
      if (engagementRate < 30) {
        alerts.push({
          type: 'warning',
          message: `${engagementRate}% student engagement this week`,
          icon: 'fa-triangle-exclamation'
        });
      } else if (engagementRate > 70) {
        alerts.push({
          type: 'success',
          message: `Great! ${engagementRate}% student engagement`,
          icon: 'fa-check-circle'
        });
      }
    }

    if (pendingAssignments > 0) {
      alerts.push({
        type: 'info',
        message: `${pendingAssignments} assignments due soon`,
        icon: 'fa-clock'
      });
    }

    if (recentInteractions === 0 && studentsCount > 0) {
      alerts.push({
        type: 'warning',
        message: 'No student interactions this week',
        icon: 'fa-exclamation-circle'
      });
    }

    return alerts.slice(0, 3); // Limit to 3 alerts
  }
}

export default DashboardService;
