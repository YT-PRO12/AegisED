const pool = require("../config/db");

const getDashboardStats = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM patients) AS total_patients,

        (SELECT COUNT(*)
         FROM emergency_cases
         WHERE status != 'Discharged') AS emergency_cases,

        (SELECT COUNT(*)
         FROM beds
         WHERE status = 'Available') AS available_beds,

        (SELECT COUNT(*)
         FROM doctors
         WHERE status = 'Available') AS available_doctors,

        (SELECT COUNT(*)
         FROM emergency_cases
         WHERE priority = 'Critical'
         AND status != 'Discharged') AS critical_cases,

        (SELECT COUNT(*)
         FROM emergency_cases
         WHERE priority = 'Urgent'
         AND status != 'Discharged') AS urgent_cases,

        (SELECT COUNT(*)
         FROM emergency_cases
         WHERE priority = 'Stable'
         AND status != 'Discharged') AS stable_cases,

        (SELECT COUNT(*)
         FROM emergency_cases
         WHERE status = 'Waiting') AS waiting_patients;
    `);

    const stats = result.rows[0];

    res.json({
      success: true,
      data: {
        totalPatients: Number(stats.total_patients),
        emergencyCases: Number(stats.emergency_cases),
        availableBeds: Number(stats.available_beds),
        availableDoctors: Number(stats.available_doctors),

        criticalCases: Number(stats.critical_cases),
        urgentCases: Number(stats.urgent_cases),
        stableCases: Number(stats.stable_cases),
        waitingPatients: Number(stats.waiting_patients),
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to load dashboard statistics",
    });
  }
};

module.exports = {
  getDashboardStats,
};
