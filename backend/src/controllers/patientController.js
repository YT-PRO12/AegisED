const c = require("../services/crud")("patient");
module.exports = {
  getPatients: c.list,
  getPatientById: c.get,
  createPatient: c.create,
  updatePatient: c.update,
  deletePatient: c.remove,
};
